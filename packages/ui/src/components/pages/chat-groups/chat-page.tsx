import React, { useState, useEffect, useRef } from 'react';
import { CreateChatRoomModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models';
import { Button, Input, Typography, Avatar, message, Space, Select, Checkbox, Modal } from 'antd';
import { SendOutlined, UserOutlined, SearchOutlined, PhoneOutlined, PlusOutlined, SmileOutlined, AudioOutlined, VideoCameraOutlined, CloseOutlined } from '@ant-design/icons';
import { ChatHelpService, UserHelpService } from '@in-one/shared-services';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import Picker from 'emoji-picker-react';
import './chat-page.css';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface User {
  unreadCount: number;
  id: string;
  username: string;
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId?: string;
  chatRoomId?: string | null;
  text: string;
  createdAt: string;
  status: 'pending' | 'delivered' | 'failed';
  image?: string;
}

const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [userId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
  const [chatBackground, setChatBackground] = useState<string>('#e6f0fa');
  const [sortOption, setSortOption] = useState<string>('recent');
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastCheckedUserId = useRef<string | null>(null);
  const chatService = new ChatHelpService();
  const userService = new UserHelpService();

  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callType: 'audio' | 'video'; signalData: any; callId: string } | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (userId && !hasFetchedUsers) {
      fetchUsers();
      fetchChatRooms();
      initSocket(userId);
      setHasFetchedUsers(true);
    }
    return () => {
      socket?.disconnect();
      endCallCleanup();
    };
  }, [userId]);

  useEffect(() => {
    if (selectedRoomId && userId) {
      fetchGroupMessages();
      setSelectedUser(null);
    }
  }, [selectedRoomId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messagesContainerRef.current) {
      messagesContainerRef.current.style.height = `${Math.min(messagesContainerRef.current.scrollHeight, window.innerHeight - (isCalling ? 400 : 200))}px`;
    }
  }, [messages, isCalling]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((err) => console.error('Local video play error:', err));
    }
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => console.error('Remote video play error:', err));
    }
  }, [localStream, remoteStream]);

  const initSocket = (userId: string) => {
    const newSocket = io('http://localhost:3006', {
      query: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (selectedRoomId) newSocket.emit('joinRoom', selectedRoomId);
      else if (chatRoomId) newSocket.emit('joinRoom', chatRoomId);
    });

    newSocket.on('privateMessage', (data) => {
      if (!data.success || !data.message) return;
      const { senderId, receiverId, chatRoomId: receivedChatRoomId, text, createdAt, _id } = data.message;
      const newMessage: Message = {
        _id,
        senderId,
        receiverId,
        chatRoomId: receivedChatRoomId,
        text,
        createdAt,
        status: 'delivered',
      };

      // Only add the message if it matches the current conversation
      if (
        (senderId === userId && receiverId === selectedUser?.id) ||
        (senderId === selectedUser?.id && receiverId === userId)
      ) {
        setMessages((prev) => {
          const tempMsgIndex = prev.findIndex((msg) => msg._id.startsWith('temp-') && msg.text === text && msg.senderId === senderId);
          if (tempMsgIndex !== -1) {
            // Replace the temporary message
            const updatedMessages = [...prev];
            updatedMessages[tempMsgIndex] = newMessage;
            return updatedMessages;
          }
          // Add new message if not a replacement
          return [...prev.filter((msg) => msg._id !== _id), newMessage];
        });
      }

      // Update users list with last message
      setUsers((prev) =>
        prev
          .map((u) =>
            u.id === (senderId === userId ? receiverId : senderId)
              ? { ...u, lastMessage: text, lastMessageTime: createdAt }
              : u
          )
          .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
      );

      if (!chatRoomId && receivedChatRoomId) {
        setChatRoomId(receivedChatRoomId);
        newSocket.emit('joinRoom', receivedChatRoomId);
      }
    });

    newSocket.on('groupMessage', (data) => {
      if (!data.success || !data.message) return;
      const { senderId, chatRoomId, text, createdAt, _id } = data.message;
      const newMessage: Message = {
        _id,
        senderId,
        chatRoomId,
        text,
        createdAt,
        status: 'delivered',
      };

      if (chatRoomId === selectedRoomId) {
        setMessages((prev) => {
          const tempMsgIndex = prev.findIndex((msg) => msg._id.startsWith('temp-') && msg.text === text && msg.senderId === senderId);
          if (tempMsgIndex !== -1) {
            // Replace the temporary message
            const updatedMessages = [...prev];
            updatedMessages[tempMsgIndex] = newMessage;
            return updatedMessages;
          }
          // Add new message if not a replacement
          return [...prev.filter((msg) => msg._id !== _id), newMessage].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }

      // Update chat rooms with last message
      setChatRooms((prev) =>
        prev
          .map((r) =>
            r._id === chatRoomId
              ? { ...r, lastMessage: text, lastMessageTime: createdAt }
              : r
          )
          .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
      );
    });

    newSocket.on('onlineUsers', setOnlineUsers);

    newSocket.on('callUser', (data) => {
      if (data.userToCall === userId && !isCalling) {
        setIncomingCall({
          callerId: data.from,
          callType: data.callType,
          signalData: data.signal,
          callId: data.callId,
        });
        const caller = users.find((u) => u.id === data.from);
        if (caller && (!selectedUser || selectedUser.id !== caller.id)) {
          setSelectedUser(caller);
        }
      }
    });

    newSocket.on('callAccepted', async (data) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
      }
    });

    newSocket.on('iceCandidate', async (data) => {
      if (peerConnection && data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    newSocket.on('callEnded', () => {
      endCallCleanup();
    });

    setSocket(newSocket);
  };

  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', { callId: chatRoomId, candidate: event.candidate, userId, receiverId: selectedUser?.id });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') endCall();
    };

    setPeerConnection(pc);
    return pc;
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!selectedUser || !userId || !socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
      setLocalStream(stream);

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const callData = { callerId: userId, userToCall: selectedUser.id, signalData: offer };
      const response = await chatService.initiateCall(callData);

      if (response.status && response.data) {
        setIsCalling(true);
        setCallType(type);
        setChatRoomId(response.data.callId);
        socket.emit('callUser', {
          userToCall: selectedUser.id,
          signalData: offer,
          from: userId,
          callId: response.data.callId,
          callType: type,
        });
      }
    } catch (error) {
      console.error('Start call error:', error);
      message.error('Failed to start call');
      endCallCleanup();
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingCall || !socket || !userId) {
      message.error('No incoming call or user not logged in');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.callType === 'video', audio: true });
      setLocalStream(stream);

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.signalData));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const answerData = { callId: incomingCall.callId, signalData: answer, answererId: userId };
      const response = await chatService.answerCall(answerData);

      if (response.status) {
        socket.emit('callAccepted', { signal: answer, to: incomingCall.callerId });
        setIsCalling(true);
        setCallType(incomingCall.callType);
        setChatRoomId(incomingCall.callId);
        setIncomingCall(null);
      }
    } catch (error) {
      console.error('Accept call error:', error);
      message.error('Failed to accept call');
      endCallCleanup();
    }
  };

  const endCall = async () => {
    if (chatRoomId && userId && socket) {
      await chatService.endCall({ callId: chatRoomId, userId });
      socket.emit('callEnded', { to: selectedUser?.id, callId: chatRoomId });
    }
    endCallCleanup();
  };

  const endCallCleanup = () => {
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    setIsCalling(false);
    setCallType(null);
    setChatRoomId(null);
    setIncomingCall(null);
  };

  const fetchUsers = async () => {
    try {
      const response = await chatService.getAllUsers();
      if (response.status && response.data?.data) {
        const filteredUsers = response.data.data.filter((u: User) => u.id !== userId);
        const usersWithLastMessage = await Promise.all(
          filteredUsers.map(async (user: User) => {
            const chatHistory = await chatService.getChatHistoryByUsers({ senderId: userId!, receiverId: user.id });
            const lastMsg = chatHistory.status && chatHistory.data?.length > 0 ? chatHistory.data[chatHistory.data.length - 1] : null;
            return { ...user, lastMessage: lastMsg?.text || '', lastMessageTime: lastMsg?.createdAt || '' };
          })
        );
        setUsers(usersWithLastMessage.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    }
  };

  const fetchChatRooms = async () => {
    try {
      const response = await chatService.getChatRooms(new UserIdRequestModel(userId!));
      if (response.status && response.data?.data) {
        setChatRooms(response.data.data.sort((a: { lastMessageTime: any; }, b: { lastMessageTime: any; }) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()));
      }
    } catch (error) {
      message.error('Failed to fetch chat rooms');
    }
  };

  const fetchChatHistory = async () => {
    if (!selectedUser || !userId) return;
    try {
      const response = await chatService.getChatHistoryByUsers({ senderId: userId, receiverId: selectedUser.id });
      if (response.status && Array.isArray(response.data)) {
        const formattedMessages = response.data.map((msg: any) => ({
          _id: msg._id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          chatRoomId: msg.chatRoomId,
          text: msg.text,
          createdAt: msg.createdAt,
          status: 'delivered' as const,
        }));
        setMessages(formattedMessages);
        const firstMessageWithChatRoom = response.data.find((msg: any) => msg.chatRoomId);
        if (firstMessageWithChatRoom) {
          setChatRoomId(firstMessageWithChatRoom.chatRoomId);
          socket?.emit('joinRoom', firstMessageWithChatRoom.chatRoomId);
        }
      }
    } catch (error) {
      message.error('Failed to fetch chat history');
      setMessages([]);
    }
  };

  const fetchGroupMessages = async () => {
    if (!selectedRoomId || !userId) return;
    try {
      const response = await chatService.getMessages({ chatRoomId: selectedRoomId });
      if (response?.status && Array.isArray(response.data)) {
        const formattedMessages = response.data
          .map((msg: any) => ({
            _id: msg._id,
            senderId: msg.senderId,
            chatRoomId: msg.chatRoomId,
            text: msg.text || '',
            createdAt: msg.createdAt || new Date().toISOString(),
            status: 'delivered' as const,
          }))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(formattedMessages);
        setChatRoomId(selectedRoomId);
        if (socket?.connected) socket.emit('joinRoom', selectedRoomId);
      }
    } catch (error) {
      message.error('Failed to load group messages');
      setMessages([]);
    }
  };

  const groupMessagesByDate = (messages: Message[]) =>
    messages.reduce((acc, msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(msg);
      return acc;
    }, {} as Record<string, Message[]>);

  const groupedMessages = groupMessagesByDate(messages);

  const checkUserStatus = async (userIdToCheck: string) => {
    if (lastCheckedUserId.current === userIdToCheck) return;
    try {
      const response = await userService.checkUserStatus(new UserIdRequestModel(userIdToCheck));
      if (response.status && response.data) {
        setSelectedUser((prev) => prev ? { ...prev, isOnline: response.data.status === 'online', lastSeen: response.data.lastSeen } : prev);
        lastCheckedUserId.current = userIdToCheck;
      }
    } catch (error) {
      console.error('Failed to check user status:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !userId) return;

    const tempId = `temp-${Date.now()}`; // Unique temporary ID
    const tempMessage: Message = {
      _id: tempId,
      senderId: userId,
      text: messageInput,
      createdAt: new Date().toISOString(),
      status: 'pending',
      receiverId: selectedUser?.id, // Include receiverId for private messages
      chatRoomId: selectedRoomId || chatRoomId || null, // Use existing chatRoomId if available
    };

    // Add the temporary message immediately
    setMessages((prev) => [...prev, tempMessage]);
    setMessageInput('');

    if (selectedRoomId) {
      // Group message
      const messagePayload = {
        chatRoomId: selectedRoomId,
        senderId: userId,
        text: messageInput,
        createdAt: tempMessage.createdAt,
      };
      socket?.emit('sendGroupMessage', messagePayload, (response: any) => {
        if (response?.success && response.data) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId
                ? { ...response.data, status: 'delivered' as const }
                : msg
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId ? { ...msg, status: 'failed' as const } : msg
            )
          );
        }
      });
    } else if (selectedUser) {
      // Private message
      const messageData = new PrivateMessegeModel(userId, selectedUser.id, messageInput);
      const messagePayload = {
        message: messageData,
        chatRoomId: chatRoomId || null,
        createdAt: tempMessage.createdAt,
      };
      socket?.emit('sendMessage', messagePayload, (response: any) => {
        if (response?.success && response.data) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId
                ? { ...response.data, status: 'delivered' as const }
                : msg
            )
          );
          if (!chatRoomId && response.data.chatRoomId) {
            setChatRoomId(response.data.chatRoomId);
            socket.emit('joinRoom', response.data.chatRoomId);
          }
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempId ? { ...msg, status: 'failed' as const } : msg
            )
          );
        }
      });
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedRoomId(null);
    setMessages([]);
    setChatRoomId(null);
    fetchChatHistory();
    if (lastCheckedUserId.current !== user.id) checkUserStatus(user.id);
  };

  const handleGroupSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedUser(null);
    setMessages([]);
    setChatRoomId(roomId);
    if (socket?.connected) socket.emit('joinRoom', roomId);
    fetchGroupMessages();
  };

  const handleSortChange = (value: string) => setSortOption(value);
  const handleCreateGroup = async () => {
    if (!groupName || selectedUsersForGroup.length < 2) return;
    const chatRoomData = new CreateChatRoomModel([userId!, ...selectedUsersForGroup], groupName);
    const response = await chatService.createChatRoom(chatRoomData);
    if (response.status && response.data) {
      setIsCreatingGroup(false);
      setSelectedUsersForGroup([]);
      setGroupName('');
      fetchChatRooms();
    }
  };
  const handleBackgroundChange = (background: string) => setChatBackground(background);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value.toLowerCase());
  const onEmojiClick = (emojiObject: any) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  if (!userId) {
    return <div className="login-prompt"><Title level={3}>Please log in to use the chat</Title></div>;
  }

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchQuery));
  const filteredRooms = chatRooms.filter((room) => room.name.toLowerCase().includes(searchQuery));
  const selectedRoom = chatRooms.find((room) => room._id === selectedRoomId);

  return (
    <div className="chat-container">
      <motion.div className="sidebar" initial={{ x: -300 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
        <div className="sidebar-header">
          <Title level={4}>Chats</Title>
          <Space>
            <Button icon={<PlusOutlined />} type="text" onClick={() => setIsCreatingGroup(true)} />
            <Select defaultValue="recent" style={{ width: 120 }} onChange={handleSortChange} suffixIcon={<PhoneOutlined />}>
              <Option value="recent">Recent</Option>
              <Option value="unread">Unread</Option>
              <Option value="alphabetical">Alphabetical</Option>
            </Select>
          </Space>
        </div>
        <Input placeholder="Search contact / chat" prefix={<SearchOutlined />} value={searchQuery} onChange={handleSearch} className="search-input" />
        {isCreatingGroup ? (
          <div className="group-creation">
            <Input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} style={{ marginBottom: 16 }} />
            {users.map((user) => (
              <div key={user.id} className="user-item">
                <Checkbox
                  onChange={(e) => setSelectedUsersForGroup(e.target.checked ? [...selectedUsersForGroup, user.id] : selectedUsersForGroup.filter((id) => id !== user.id))}
                >
                  <Space>
                    <Avatar src={user.profilePicture} icon={<UserOutlined />} size={40} />
                    <Text>{user.username}</Text>
                  </Space>
                </Checkbox>
              </div>
            ))}
            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => setIsCreatingGroup(false)}>Cancel</Button>
              <Button type="primary" onClick={handleCreateGroup}>Create Group</Button>
            </Space>
          </div>
        ) : (
          <div className="combined-list">
            <Text strong style={{ display: 'block', padding: '12px 16px' }}>Chats</Text>
            {[...filteredUsers, ...filteredRooms]
              .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
              .map((item) => {
                const isUser = 'username' in item;
                const id = isUser ? item.id : item._id;
                const name = isUser ? item.username : item.name || 'Unnamed Group';
                const isSelected = isUser ? selectedUser?.id === id : selectedRoomId === id;
                return (
                  <motion.div
                    key={id}
                    className={`user-item ${isSelected ? 'active' : ''}`}
                    onClick={() => (isUser ? handleUserSelect(item) : handleGroupSelect(id))}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Space>
                      {isUser ? (
                        <div className="avatar-container">
                          <div>{name.charAt(0).toUpperCase()}</div>
                          {onlineUsers.includes(id) && <span className="online-dot" />}
                        </div>
                      ) : (
                        <Avatar icon={<UserOutlined />} size={40} />
                      )}
                      <div className="user-info">
                        <Text strong>{name}</Text>
                        <Text type="secondary" className="message-preview">{item.lastMessage || ''}</Text>
                      </div>
                    </Space>
                  </motion.div>
                );
              })}
          </div>
        )}
      </motion.div>

      <div className="chat-area" style={{ background: chatBackground }}>
        {(selectedUser || selectedRoomId) ? (
          <>
            <motion.div className="chat-header" initial={{ y: -50 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
              <Space>
                <div className="avatar-container">
                  <div>{(selectedUser?.username || selectedRoom?.name || 'Group')?.charAt(0).toUpperCase()}</div>
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#8a2be2', fontWeight: 'bold' }}>
                    {selectedUser ? selectedUser.username : selectedRoom?.name || 'Unnamed Group'}
                  </Title>
                  <Text type="secondary" style={{ color: '#000' }}>
                    {selectedUser
                      ? selectedUser.isOnline
                        ? 'Active Now'
                        : `Last Seen ${new Date(selectedUser.lastSeen || Date.now()).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'Group Chat'}
                  </Text>
                </div>
              </Space>
              {selectedUser && !selectedRoomId && (
                <Space style={{ marginLeft: 'auto' }}>
                  <Button icon={<AudioOutlined />} onClick={() => startCall('audio')} disabled={isCalling || !!incomingCall} type="text" />
                  <Button icon={<VideoCameraOutlined />} onClick={() => startCall('video')} disabled={isCalling || !!incomingCall} type="text" />
                  {isCalling && <Button icon={<CloseOutlined />} onClick={endCall} type="text" danger />}
                </Space>
              )}
            </motion.div>

            {isCalling && (
              <div className="call-container">
                <div className="video-wrapper">
                  <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
                  <Text className="video-label">You</Text>
                </div>
                <div className="video-wrapper">
                  <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
                  <Text className="video-label">{selectedUser?.username || 'Remote'}</Text>
                </div>
              </div>
            )}

            <div className="messages-container" ref={messagesContainerRef}>
              {messages.length > 0 ? (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <React.Fragment key={date}>
                    <div className="date-divider"><Text type="secondary">{date}</Text></div>
                    {msgs.map((msg) => (
                      <div key={msg._id} className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}>
                        <Text className="message-text">{msg.text}</Text>
                        <div className="timestamp">
                          <Text>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                  <Text style={{ color: 'black', textAlign: 'center' }}>No messages in this chat yet. Start chatting!</Text>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <motion.div className="input-area" initial={{ y: 50 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
              <Space.Compact className="input-compact">
                <Button icon={<SmileOutlined />} type="text" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                {showEmojiPicker && <Picker onEmojiClick={onEmojiClick} />}
                <TextArea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onPressEnter={(e) => { e.preventDefault(); handleSendMessage(); }}
                  className="message-input"
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} className="send-button" />
              </Space.Compact>
            </motion.div>
          </>
        ) : (
          <div className="no-selection"><Text type="secondary">Select a user or group to start chatting</Text></div>
        )}
      </div>

      {(selectedUser || selectedRoomId) && (
        <motion.div className={`right-sidebar ${selectedRoomId ? 'group-expanded' : ''}`} initial={{ x: 300 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
          <div className="user-profile">
            <Avatar src={selectedUser?.profilePicture} icon={<UserOutlined />} size={80} />
            <Title level={4}>{selectedUser ? selectedUser.username : selectedRoom?.name || 'Group Chat'}</Title>
            <Text type="secondary">
              {selectedUser
                ? selectedUser.isOnline
                  ? 'Active Now'
                  : `Last Seen ${new Date(selectedUser.lastSeen || Date.now()).toLocaleString()}`
                : 'Group Chat'}
            </Text>
          </div>
          {selectedRoomId && selectedRoom?.isGroup && (
            <div className="group-members">
              <Text strong>Group Members</Text>
              {selectedRoom?.members?.map((memberId: string) => {
                const member = users.find((u) => u.id === memberId);
                return member ? (
                  <div key={member.id} className="member-item">
                    <Avatar src={member.profilePicture} icon={<UserOutlined />} size={40} />
                    <Text>{member.username}</Text>
                  </div>
                ) : null;
              })}
            </div>
          )}
          <div className="customize-section">
            <Text strong>Customize</Text>
            <div className="customize-option">
              <Text>Change Theme</Text><br /><br />
              <Space>
                <motion.div className="theme-circle blue" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#1890ff')} />
                <motion.div className="theme-circle green" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#52c41a')} />
                <motion.div className="theme-circle red" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#ff4d4f')} />
                <motion.div className="theme-circle purple" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#8a2be2')} />
                <motion.div className="theme-circle orange" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#fa8c16')} />
              </Space>
            </div>
          </div>
          <Modal
            title="Incoming Call"
            open={!!incomingCall}
            onCancel={endCall}
            footer={[
              <Button key="reject" onClick={endCall} danger>Reject</Button>,
              <Button key="accept" type="primary" onClick={handleAcceptCall}>Accept</Button>,
            ]}
          >
            <Text>
              Incoming {incomingCall?.callType} call from{' '}
              {users.find((u) => u.id === incomingCall?.callerId)?.username || 'Unknown'}
            </Text>
          </Modal>
        </motion.div>
      )}
    </div>
  );
};

export default ChatPage;
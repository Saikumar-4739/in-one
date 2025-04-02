import React, { useState, useEffect, useRef } from 'react';
import { CreateChatRoomModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models';
import { Button, Input, Typography, Avatar, message, Space, Dropdown, Menu, Select, Checkbox } from 'antd';
import { SendOutlined, UserOutlined, MoreOutlined, SearchOutlined, PhoneOutlined, PlusOutlined, SmileOutlined, PaperClipOutlined, AudioOutlined, VideoCameraOutlined, CloseOutlined } from '@ant-design/icons';
import { ChatHelpService, UserHelpService } from '@in-one/shared-services';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
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

type RTCSessionDescriptionInit = {
  type?: 'offer' | 'answer' | 'rollback';
  sdp?: string;
};

type RTCIceCandidateInit = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};


const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [userId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
  const [chatBackground, setChatBackground] = useState<string>('#e6f0fa');
  const [sortOption, setSortOption] = useState<string>('recent');
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const chatService = new ChatHelpService();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastCheckedUserId = useRef<string | null>(null); // New ref to track last checked user
  const userService = new UserHelpService()

  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Initial setup effect (unchanged)
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

  // Effect for group messages (unchanged)
  useEffect(() => {
    if (selectedRoomId && userId) {
      fetchGroupMessages();
      setSelectedUser(null);
    }
  }, [selectedRoomId, userId]);

  // Effect for pending messages (unchanged)
  useEffect(() => {
    if (selectedUser && userId) {
      const relevantPending = pendingMessages.filter(
        (msg) => (msg.senderId === selectedUser.id && msg.receiverId === userId) || (msg.senderId === userId && msg.receiverId === selectedUser.id)
      );
      if (relevantPending.length > 0) {
        setMessages((prev) => [...prev, ...relevantPending]);
        setPendingMessages((prev) => prev.filter((msg) => !relevantPending.includes(msg)));
      }
    }
  }, [selectedUser]);

  // Effect for scrolling (unchanged)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messagesContainerRef.current) {
      messagesContainerRef.current.style.height = 'auto';
      const height = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.style.height = `${Math.min(height, window.innerHeight - (isCalling ? 400 : 200))}px`;
    }
  }, [messages, isCalling]);

  // Socket initialization (unchanged)
  const initSocket = (userId: string) => {
    const newSocket = io('http://localhost:3006', {
      query: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      if (selectedRoomId) newSocket.emit('joinRoom', selectedRoomId);
      else if (chatRoomId) newSocket.emit('joinRoom', chatRoomId);
    });

    newSocket.on('privateMessage', (data) => {
      if (!data.success || !data.message) return;
      const { senderId, receiverId, chatRoomId: receivedChatRoomId, text, createdAt, _id } = data.message;
      const isRelevant =
        (senderId === userId && receiverId === selectedUser?.id) ||
        (senderId === selectedUser?.id && receiverId === userId);
      const involvesUser = senderId === userId || receiverId === userId;

      if (involvesUser) {
        const newMessage = { _id, senderId, receiverId, chatRoomId: receivedChatRoomId, text, createdAt, status: 'delivered' };
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg._id === _id);
          if (!messageExists) return [...prev, newMessage];
          return prev;
        });
        setUsers((prev) =>
          prev.map((u) =>
            u.id === (senderId === userId ? receiverId : senderId)
              ? { ...u, lastMessage: text, lastMessageTime: createdAt }
              : u
          ).sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
        );
      }

      if (!chatRoomId && receivedChatRoomId) {
        setChatRoomId(receivedChatRoomId);
        newSocket.emit('joinRoom', receivedChatRoomId);
      }
    });


    newSocket.on('groupMessage', (data) => {
      if (!data.success || !data.message) return;
      const { senderId, chatRoomId, text, createdAt, _id } = data.message;
      if (chatRoomId === selectedRoomId) {
        const newMessage = { _id, senderId, chatRoomId, text, createdAt, status: 'delivered' };
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg._id === _id);
          if (!messageExists) {
            const updatedMessages = [...prev, newMessage].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            return updatedMessages;
          }
          return prev;
        });
      }
      setChatRooms((prev) =>
        prev.map((r) =>
          r._id === chatRoomId
            ? { ...r, lastMessage: text, lastMessageTime: createdAt }
            : r
        ).sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
      );
    });

    newSocket.on('onlineUsers', setOnlineUsers);

    newSocket.on('callInitiated', async (data) => {
      if (data.receiverId === userId) {
        setIsCalling(true);
        setCallType(data.callType);
        await handleIncomingCall(data);
      }
    });

    newSocket.on('callAnswered', async (data) => {
      if (data.callerId === userId) {
        await handleCallAnswer(data);
      }
    });

    newSocket.on('iceCandidate', async (data) => {
      if (peerConnection && (data.callerId === userId || data.receiverId === userId)) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    newSocket.on('callEnded', () => {
      endCallCleanup();
    });

    newSocket.on('connect_error', () => message.error('Socket connection failed'));
    newSocket.on('error', () => { });
    newSocket.on('disconnect', () => { });

    setSocket(newSocket);
  };

  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('iceCandidate', {
          callId: chatRoomId,
          candidate: event.candidate,
          userId,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!selectedUser || !userId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Explicitly type callData to match ChatHelpService.initiateCall expectations
      const callData: {
        callerId: string;
        userToCall: string;
        signalData: RTCSessionDescriptionInit;
      } = {
        callerId: userId,
        userToCall: selectedUser.id as string, // Ensure string type
        signalData: {
          type: offer.type as 'offer', // Narrow type to 'offer'
          sdp: offer.sdp,
        },
      };

      const response = await chatService.initiateCall(callData);
      if (response.status) {
        setIsCalling(true);
        setCallType(type);
        socket?.emit('callInitiated', {
          ...callData,
          callId: response.data.callId,
          callType: type,
        });
      }
    } catch (error) {
      message.error('Failed to start call');
      console.error(error);
    }
  };

  const handleIncomingCall = async (data: any) => {
    if (!userId) {
      message.error('User not logged in');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: data.callType === 'video',
        audio: true,
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = setupPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(data.signalData));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const answerData: {
        callId: string;
        signalData: RTCSessionDescriptionInit;
        answererId: string;
      } = {
        callId: String(data.callId),
        signalData: {
          type: answer.type as 'answer',
          sdp: answer.sdp,
        },
        answererId: userId,
      };

      const response = await chatService.answerCall(answerData);
      if (response.status) {
        socket?.emit('callAnswered', {
          ...answerData,
          callerId: data.callerId,
        });
      }
    } catch (error) {
      message.error('Failed to answer call');
      console.error(error);
    }
  };

  const handleCallAnswer = async (data: any) => {
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signalData));
    }
  };

  // End call
  const endCall = async () => {
    if (chatRoomId && userId) {
      await chatService.endCall({ callId: chatRoomId, userId });
      socket?.emit('callEnded', { callId: chatRoomId });
    }
    endCallCleanup();
  };

  // Cleanup call resources
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
  };

  // Fetch users (unchanged)
  const fetchUsers = async () => {
    try {
      const response = await chatService.getAllUsers();
      if (response.status && response.data?.data) {
        const filteredUsers = response.data.data.filter((u: User) => u.id !== userId);
        const usersWithLastMessage = await Promise.all(
          filteredUsers.map(async (user: User) => {
            const chatHistory = await chatService.getChatHistoryByUsers({ senderId: userId!, receiverId: user.id });
            if (chatHistory.status && chatHistory.data?.length > 0) {
              const lastMsg = chatHistory.data[chatHistory.data.length - 1];
              return { ...user, lastMessage: lastMsg.text, lastMessageTime: lastMsg.createdAt };
            }
            return { ...user, lastMessage: '', lastMessageTime: '' };
          })
        );
        setUsers(usersWithLastMessage.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()));
      } else throw new Error('Invalid response structure');
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    }
  };

  // Fetch chat rooms (unchanged)
  const fetchChatRooms = async () => {
    try {
      const reqModel = new UserIdRequestModel(userId!);
      const response = await chatService.getChatRooms(reqModel);
      if (response.status && response.data?.data) {
        setChatRooms(response.data.data.sort((a: { lastMessageTime: any; }, b: { lastMessageTime: any; }) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()));
      } else message.error('Failed to fetch chat rooms');
    } catch (error) {
      message.error('An error occurred while fetching chat rooms');
    }
  };

  // Fetch chat history (unchanged)
  const fetchChatHistory = async () => {
    if (!selectedUser || !userId) return;
    try {
      const response = await chatService.getChatHistoryByUsers({ senderId: userId, receiverId: selectedUser.id });
      if (response.status && Array.isArray(response.data)) {
        const formattedMessages: Message[] = response.data.map((msg: any) => ({
          _id: msg._id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          chatRoomId: msg.chatRoomId,
          text: msg.text,
          createdAt: msg.createdAt,
          status: 'delivered',
        }));
        setMessages(formattedMessages);
        const firstMessageWithChatRoom = response.data.find((msg: any) => msg.chatRoomId);
        if (firstMessageWithChatRoom) {
          setChatRoomId(firstMessageWithChatRoom.chatRoomId);
          socket?.emit('joinRoom', firstMessageWithChatRoom.chatRoomId);
        }
      } else throw new Error('Invalid response format');
    } catch (error) {
      message.error('Failed to fetch chat history');
      setMessages([]);
    }
  };

  // Fetch group messages (unchanged)
  const fetchGroupMessages = async () => {
    if (!selectedRoomId || !userId) return;

    try {
      const reqModel = { chatRoomId: selectedRoomId };
      const response = await chatService.getMessages(reqModel);

      if (response?.status && Array.isArray(response.data)) {
        let formattedMessages: Message[] = response.data.map((msg: any) => ({
          _id: msg._id,
          senderId: msg.senderId,
          chatRoomId: msg.chatRoomId,
          text: msg.text || "", // Ensure text is never undefined
          createdAt: msg.createdAt || new Date().toISOString(), // Keep as string
          status: "delivered" as const, // Explicitly type as literal
        }));

        // Sort messages by createdAt (oldest first), parsing string to Date for comparison
        formattedMessages = formattedMessages.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        setMessages(formattedMessages);
        setChatRoomId(selectedRoomId);

        // Join room only if the socket is connected
        if (socket?.connected) {
          socket.emit("joinRoom", selectedRoomId);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error fetching group messages:", error);
      message.error("Failed to load group messages");
      setMessages([]); // Clear messages on failure
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    return messages.reduce((acc, msg) => {
      const date = new Date(msg.createdAt);
      const dateKey = isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString(); // Fallback for invalid dates
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(msg);
      return acc;
    }, {} as Record<string, Message[]>);
  };

  const groupedMessages = groupMessagesByDate(messages);




  // Check user status (modified to prevent repeats)
  const checkUserStatus = async (userIdToCheck: string) => {
    // Only call if the user hasn’t been checked yet
    if (lastCheckedUserId.current === userIdToCheck) return;

    try {
      const response = await userService.checkUserStatus(new UserIdRequestModel(userIdToCheck));

      if (response.status && response.data) {
        setSelectedUser((prev: any) => ({
          ...prev,
          isOnline: response.data.status === "online", // Convert to boolean
          lastSeen: response.data.lastSeen, // Store last seen date
        }));

        lastCheckedUserId.current = userIdToCheck; // Update ref to mark as checked
      }
    } catch (error) {
      console.error("Failed to check user status:", error);
    }
  };


  // Send message (unchanged)
  const handleSendMessage = async () => {
    if (!messageInput.trim() && !file) {
      message.warning('Message or file cannot be empty');
      return;
    }
    if (!userId) {
      message.warning('Please ensure you are logged in.');
      return;
    }

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      senderId: userId,
      text: messageInput,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...(file && { image: URL.createObjectURL(file) }),
    };

    if (selectedRoomId) {
      const messagePayload = {
        chatRoomId: selectedRoomId,
        senderId: userId,
        text: messageInput,
        createdAt: tempMessage.createdAt,
        ...(file && { image: file }),
      };
      setMessages((prev) => [...prev, { ...tempMessage, chatRoomId: selectedRoomId }]);
      setMessageInput('');
      setFile(null);

      if (!socket || !socket.connected) {
        try {
          const response = await chatService.sendMessage(messagePayload);
          if (response.status) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempMessage._id ? { ...msg, _id: response.data._id, status: 'delivered' } : msg
              )
            );
          }
        } catch (error) {
          setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg)));
          message.error('Failed to send group message');
        }
        return;
      }

      socket.emit('sendGroupMessage', messagePayload, (response: any) => {
        if (response?.success && response.data) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempMessage._id ? { ...response.data, status: 'delivered', chatRoomId: selectedRoomId } : msg
            )
          );
        } else {
          setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg)));
          message.error(response?.message || 'Failed to send group message');
        }
      });
    } else if (selectedUser) {
      const messageData = new PrivateMessegeModel(userId, selectedUser.id, messageInput);
      const tempMessageData = {
        ...messageData,
        _id: tempMessage._id,
        chatRoomId: chatRoomId || null,
        createdAt: tempMessage.createdAt,
        status: 'pending',
        ...(file && { image: URL.createObjectURL(file) }),
      };
      setMessages((prev) => [...prev, tempMessageData]);
      setMessageInput('');
      setFile(null);

      if (!socket || !socket.connected) {
        try {
          const response = await chatService.sendPrivateMessage(messageData);
          if (response.status && response.data) {
            setMessages((prev) =>
              prev.map((msg) => (msg._id === tempMessage._id ? { ...response.data, status: 'delivered' } : msg))
            );
            if (!chatRoomId && response.data.chatRoomId) {
              setChatRoomId(response.data.chatRoomId);
              socket?.emit('joinRoom', response.data.chatRoomId);
            }
          }
        } catch (error) {
          setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg)));
          message.error('Failed to send message');
        }
        return;
      }

      const messagePayload = {
        message: messageData,
        chatRoomId: chatRoomId || null,
        createdAt: tempMessage.createdAt,
        ...(file && { image: file }),
      };
      socket.emit('sendMessage', messagePayload, (response: any) => {
        if (response?.success && response.data) {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === tempMessage._id ? { ...response.data, status: 'delivered' } : msg))
          );
          if (!chatRoomId && response.data.chatRoomId) {
            setChatRoomId(response.data.chatRoomId);
            socket.emit('joinRoom', response.data.chatRoomId);
          }
        } else {
          setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg)));
          message.error(response?.message || 'Failed to send message');
        }
      });
    }
  };

  // User selection (modified to include status check with prevention)
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedRoomId(null);
    setMessages([]);
    setChatRoomId(null);
    fetchChatHistory();
    if (lastCheckedUserId.current !== user.id) { // Only call if it's a new user
      checkUserStatus(user.id);
    }
  };

  // Group selection (unchanged)
  const handleGroupSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedUser(roomId);
    setMessages([]);
    setChatRoomId(roomId);
    if (socket && socket.connected) {
      socket.emit('joinRoom', roomId);
    }
    fetchGroupMessages();
  };

  // Sort change (unchanged)
  const handleSortChange = (value: string) => {
    setSortOption(value);
  };

  // Create group (unchanged)
  const handleCreateGroup = async () => {
    if (!groupName || selectedUsersForGroup.length < 2) {
      message.warning('Please enter a group name and select at least 2 users.');
      return;
    }
    try {
      const chatRoomData = new CreateChatRoomModel([userId!, ...selectedUsersForGroup], groupName);
      const createRoomResponse = await chatService.createChatRoom(chatRoomData);
      if (createRoomResponse.status && createRoomResponse.data) {
        message.success('Group created successfully!');
        setIsCreatingGroup(false);
        setSelectedUsersForGroup([]);
        setGroupName('');
        fetchChatRooms();
      }
    } catch (error) {
      message.error('Failed to create group');
    }
  };

  // Background change (unchanged)
  const handleBackgroundChange = (background: string) => setChatBackground(background);

  // Search handler (unchanged)
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  // Emoji click (unchanged)
  const onEmojiClick = (emojiObject: any) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // File change (unchanged)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  // Render logic (unchanged except for minor UI tweaks)
  if (!userId) {
    return (
      <div className="login-prompt">
        <Title level={3}>Please log in to use the chat</Title>
      </div>
    );
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
        <div className="search-bar">
          <Input placeholder="Search contact / chat" prefix={<SearchOutlined />} value={searchQuery} onChange={handleSearch} className="search-input" />
        </div>
        {isCreatingGroup ? (
          <div className="group-creation">
            <Input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} style={{ marginBottom: 16 }} />
            {users.map((user) => (
              <div key={user.id} className="user-item">
                <Checkbox
                  onChange={(e) => {
                    if (e.target.checked) setSelectedUsersForGroup([...selectedUsersForGroup, user.id]);
                    else setSelectedUsersForGroup(selectedUsersForGroup.filter((id) => id !== user.id));
                  }}
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
          <>
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
                      transition={{ type: 'spring', stiffness: 300 }}
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
              {filteredUsers.length === 0 && filteredRooms.length === 0 && (
                <Text type="secondary" style={{ padding: '12px 16px' }}>No chats yet. Start one!</Text>
              )}
            </div>
          </>
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
                        : `Last Seen ${new Date(selectedUser.lastSeen || Date.now()).toLocaleString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}`
                      : 'Group Chat'}
                  </Text>
                </div>
              </Space>
              {selectedUser && !selectedRoomId && (
                <Space style={{ marginLeft: 'auto' }}>
                  <Button
                    icon={<AudioOutlined />}
                    onClick={() => startCall('audio')}
                    disabled={isCalling}
                    type="text"
                  />
                  <Button
                    icon={<VideoCameraOutlined />}
                    onClick={() => startCall('video')}
                    disabled={isCalling}
                    type="text"
                  />
                  {isCalling && (
                    <Button
                      icon={<CloseOutlined />}
                      onClick={endCall}
                      type="text"
                      danger
                    />
                  )}
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
                  <Text className="video-label">{selectedUser?.username}</Text>
                </div>
              </div>
            )}
            <div className="messages-container" ref={messagesContainerRef}>
              {messages.length > 0 ? (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <React.Fragment key={date}>
                    <div className="date-divider">
                      <Text type="secondary">{date}</Text>
                    </div>
                    {msgs.map((msg, index) => (
                      <div key={msg._id || index} className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}>
                        {msg.image && <img src={msg.image} alt="message attachment" className="message-image" />}
                        {msg.text && <Text className="message-text">{msg.text}</Text>}
                        <div className="timestamp">
                          <Text>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100vh",
                  }}
                >
                  <Text style={{ color: "black", textAlign: "center" }}>
                    No messages in this chat yet. Start chatting!
                  </Text>
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
                  onPressEnter={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="message-input"
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} className="send-button" />
              </Space.Compact>
            </motion.div>
          </>
        ) : (
          <div className="no-selection">
            <Text type="secondary">Select a user or group to start chatting</Text>
          </div>
        )}
      </div>

      {(selectedUser || selectedRoomId) && (
        <motion.div
          className={`right-sidebar ${selectedRoomId ? 'group-expanded' : ''}`}
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
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
              {selectedRoom?.members?.length > 0 ? (
                selectedRoom.members.map((memberId: string) => {
                  const member = users.find((u) => u.id === memberId);
                  return member ? (
                    <div key={member.id} className="member-item">
                      <Avatar src={member.profilePicture} icon={<UserOutlined />} size={40} />
                      <Text>{member.username}</Text>
                    </div>
                  ) : null;
                })
              ) : (
                <Text type="secondary">No members found</Text>
              )}
            </div>
          )}
          <div className="customize-section">
            <Text strong>Customize</Text>
            <div className="customize-option">
              <Text>Change Theme</Text>
              <br></br>
              <br></br>
              <Space>
                <motion.div className="theme-circle blue" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#1890ff')} />
                <motion.div className="theme-circle green" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#52c41a')} />
                <motion.div className="theme-circle red" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#ff4d4f')} />
                <motion.div className="theme-circle purple" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#8a2be2')} />
                <motion.div className="theme-circle orange" whileHover={{ scale: 1.2 }} onClick={() => handleBackgroundChange('#fa8c16')} />
              </Space>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatPage;
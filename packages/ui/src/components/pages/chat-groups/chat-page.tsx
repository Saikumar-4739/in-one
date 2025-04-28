import React, { useState, useEffect, useRef } from 'react';
import { CreateChatRoomModel, CreateMessageModel, PrivateMessegeModel, UserIdRequestModel, EditMessageModel, MessegeIdRequestModel } from '@in-one/shared-models';
import { Button, Input, Typography, Avatar, message, Space, Select, Checkbox, Modal, Spin, Dropdown, Menu } from 'antd';
import { SendOutlined, UserOutlined, SearchOutlined, PhoneOutlined, PlusOutlined, SmileOutlined, AudioOutlined, VideoCameraOutlined, CloseOutlined, VideoCameraAddOutlined, ShareAltOutlined, FullscreenExitOutlined, FullscreenOutlined, SoundOutlined, EditOutlined, DeleteOutlined, MoreOutlined, CheckOutlined } from '@ant-design/icons';
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
  chatRoomId?: string; // Optional, used only for group messages
  text: string | null;
  createdAt: string;
  status: 'pending' | 'delivered' | 'read' | 'failed';
  emoji?: string;
  fileUrl?: string;
  fileType?: string;
}

const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
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

  // Call states
  const [isCalling, setIsCalling] = useState<boolean>(false);
  const [incomingCall, setIncomingCall] = useState<{ callerId: string; callType: 'audio' | 'video'; signalData: any; callId: string } | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  useEffect(() => {
    if (userId && !hasFetchedUsers) {
      fetchUsers();
      fetchChatRooms();
      initSocket(userId);
      setHasFetchedUsers(true);
      requestNotificationPermission();
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
    if (selectedUser && userId) {
      fetchPrivateChatHistory();
    }
  }, [selectedUser, userId]);

  useEffect(() => {
    peerConnectionRef.current = peerConnection;
  }, [peerConnection]);

  useEffect(() => {
    if (remoteStream) {
      setIsLoading(false);
    }
  }, [remoteStream]);

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

  const requestNotificationPermission = () => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const showNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const initSocket = (userId: string) => {
    const newSocket = io('https://in-one.onrender.com', {
      auth: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      if (selectedRoomId) newSocket.emit('joinRoom', selectedRoomId);
    });

    newSocket.on('privateMessage', (savedMessage: Message) => {
      setMessages((prev) => {
        const exists = prev.some((msg) => msg._id === savedMessage._id);
        return exists ? prev : [...prev, { ...savedMessage, status: 'delivered' }];
      });
      updateUserList(savedMessage);
    });

    newSocket.on('groupMessage', (savedMessage: Message) => {
      if (savedMessage.chatRoomId === selectedRoomId) {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg._id === savedMessage._id);
          return exists ? prev : [...prev, { ...savedMessage, status: 'delivered' }];
        });
      }
      updateChatRoomList(savedMessage);
    });

    newSocket.on('onlineUsers', setOnlineUsers);

    newSocket.on('callUser', (data: { userToCall: string; from: string; callType: 'audio' | 'video'; signal: any; callId: string }) => {
      if (data.userToCall === userId && !isCalling) {
        setIncomingCall({ callerId: data.from, callType: data.callType, signalData: data.signal, callId: data.callId });
        showNotification('Incoming Call', `Incoming ${data.callType} call from ${users.find(u => u.id === data.from)?.username}`);
        const caller = users.find((u) => u.id === data.from);
        if (caller && (!selectedUser || selectedUser.id !== caller.id)) {
          setSelectedUser(caller);
        }
      }
    });

    newSocket.on('callAccepted', async (data: { signal: RTCSessionDescriptionInit }) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
      }
    });

    newSocket.on('iceCandidate', async (data: { candidate: RTCIceCandidateInit | undefined }) => {
      if (peerConnection && data.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    newSocket.on('callEnded', () => {
      endCallCleanup();
    });

    setSocket(newSocket);
  };

  const updateUserList = (savedMessage: Message) => {
    setUsers((prev) =>
      prev
        .map((u) =>
          u.id === (savedMessage.senderId === userId ? savedMessage.receiverId : savedMessage.senderId)
            ? { ...u, lastMessage: savedMessage.text || '', lastMessageTime: savedMessage.createdAt }
            : u
        )
        .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
    );
  };

  const updateChatRoomList = (savedMessage: Message) => {
    setChatRooms((prev) =>
      prev
        .map((r) =>
          r._id === savedMessage.chatRoomId
            ? { ...r, lastMessage: savedMessage.text || '', lastMessageTime: savedMessage.createdAt }
            : r
        )
        .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime())
    );
  };

  const setupPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('iceCandidate', { callId: incomingCall?.callId, candidate: event.candidate, userId, receiverId: selectedUser?.id });
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video' ? { facingMode: 'user' } : false, audio: true });
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.callType === 'video' ? { facingMode: 'user' } : false, audio: true });
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
        setIncomingCall(null);
      }
    } catch (error) {
      console.error('Accept call error:', error);
      message.error('Failed to accept call');
      endCallCleanup();
    }
  };

  const endCall = async () => {
    if (incomingCall?.callId && userId && socket) {
      await chatService.endCall({ callId: incomingCall.callId, userId });
      socket.emit('callEnded', { to: selectedUser?.id, callId: incomingCall.callId });
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
    setIncomingCall(null);
  };

  const fetchUsers = async () => {
    try {
      const response = await chatService.getAllUsers();
      if (response.status && response.data) {
        const filteredUsers = response.data.filter((u: User) => u.id !== userId);
        const usersWithLastMessage = await Promise.all(
          filteredUsers.map(async (user: User) => {
            const chatHistory = await chatService.getPrivateChatHistory({ senderId: userId!, receiverId: user.id });
            const lastMsg = chatHistory.status && chatHistory.data?.length > 0 ? chatHistory.data[chatHistory.data.length - 1] : null;
            return { ...user, lastMessage: lastMsg?.text || '', lastMessageTime: lastMsg?.createdAt || '', unreadCount: 0 };
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
      if (response.status && response.data) {
        setChatRooms(response.data.sort((a: { lastMessageTime: any }, b: { lastMessageTime: any }) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime()));
      }
    } catch (error) {
      message.error('Failed to fetch chat rooms');
    }
  };

  const fetchPrivateChatHistory = async () => {
    if (!selectedUser || !userId) return;
    try {
      const response = await chatService.getPrivateChatHistory({ senderId: userId, receiverId: selectedUser.id });
      if (response.status && Array.isArray(response.data)) {
        const formattedMessages = response.data.map((msg: Message) => ({
          _id: msg._id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          chatRoomId: msg.chatRoomId,
          text: msg.text,
          createdAt: msg.createdAt,
          status: msg.status || 'delivered',
          emoji: msg.emoji,
          fileUrl: msg.fileUrl,
          fileType: msg.fileType,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      message.error('Failed to fetch private chat history');
      setMessages([]);
    }
  };

  const fetchGroupMessages = async () => {
    if (!selectedRoomId || !userId) return;
    try {
      const response = await chatService.getMessages({ chatRoomId: selectedRoomId });
      if (response.status && Array.isArray(response.data)) {
        const formattedMessages = response.data
          .map((msg: Message) => ({
            _id: msg._id,
            senderId: msg.senderId,
            chatRoomId: msg.chatRoomId,
            text: msg.text,
            createdAt: msg.createdAt,
            status: msg.status || 'delivered',
            emoji: msg.emoji,
            fileUrl: msg.fileUrl,
            fileType: msg.fileType,
          }))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(formattedMessages);
        if (socket?.connected) socket.emit('joinRoom', selectedRoomId);
      }
    } catch (error) {
      message.error('Failed to load group messages');
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !userId) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      _id: tempId,
      senderId: userId,
      text: messageInput,
      createdAt: new Date().toISOString(),
      status: 'pending',
      receiverId: selectedUser?.id,
      chatRoomId: selectedRoomId || undefined,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setMessageInput('');

    try {
      if (selectedRoomId) {
        // Group message
        const messagePayload: CreateMessageModel = {
          chatRoomId: selectedRoomId,
          senderId: userId,
          text: messageInput,
        };
        const response = await chatService.sendMessage(messagePayload);
        if (response.status && response.data) {
          const savedMessage: Message = { ...response.data, status: 'delivered' };
          setMessages((prev) => prev.map((msg) => (msg._id === tempId ? savedMessage : msg)));
          socket?.emit('sendGroupMessage', messagePayload);
          updateChatRoomList(savedMessage);
        } else {
          throw new Error('Failed to send group message');
        }
      } else if (selectedUser) {
        // Private message
        const messageData: PrivateMessegeModel = {
          senderId: userId,
          receiverId: selectedUser.id,
          text: messageInput,
        };
        const response = await chatService.sendPrivateMessage(messageData);
        if (response.status && response.data) {
          const savedMessage: Message = { ...response.data, status: 'delivered' };
          setMessages((prev) => prev.map((msg) => (msg._id === tempId ? savedMessage : msg)));
          socket?.emit('sendPrivateMessage', { message: messageData });
          updateUserList(savedMessage);
        } else {
          throw new Error('Failed to send private message');
        }
      } else {
        // New group creation
        const messagePayload: CreateMessageModel = {
          senderId: userId,
          text: messageInput,
          participants: [],
          groupName: `Group-${Date.now()}`,
        };
        const response = await chatService.sendMessage(messagePayload);
        if (response.status && response.data) {
          const savedMessage: Message = { ...response.data, status: 'delivered' };
          setMessages((prev) => prev.map((msg) => (msg._id === tempId ? savedMessage : msg)));
          setSelectedRoomId(savedMessage.chatRoomId || '');
          socket?.emit('joinRoom', savedMessage.chatRoomId);
          socket?.emit('sendGroupMessage', messagePayload);
          updateChatRoomList(savedMessage);
          fetchChatRooms();
        } else {
          throw new Error('Failed to create new group');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.map((msg) => (msg._id === tempId ? { ...msg, status: 'failed' } : msg)));
      message.error('Failed to send message');
    }
  };

  const handleEditMessage = async (msg: Message) => {
    if (!msg.text || !userId) return;
    setEditingMessage(msg);
    setMessageInput(msg.text);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !messageInput.trim() || !userId) return;

    const editPayload: EditMessageModel = {
      messageId: editingMessage._id,
      newText: messageInput,
    };

    try {
      let response;
      if (editingMessage.chatRoomId) {
        // Group message
        response = await chatService.editMessage(editPayload);
      } else {
        // Private message
        response = await chatService.editPrivateMessage(editPayload);
      }

      if (response.status && response.data) {
        const updatedMessage: Message = { ...response.data, status: 'delivered' };
        setMessages((prev) => prev.map((msg) => (msg._id === editingMessage._id ? updatedMessage : msg)));
        setEditingMessage(null);
        setMessageInput('');
        message.success('Message updated successfully');
      } else {
        throw new Error('Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      message.error('Failed to edit message');
    }
  };

  const handleDeleteMessage = async (msg: Message) => {
    if (!userId) return;

    const deletePayload: MessegeIdRequestModel = { messageId: msg._id };

    try {
      let response;
      if (msg.chatRoomId) {
        // Group message
        response = await chatService.deleteMessage(deletePayload);
      } else {
        // Private message
        response = await chatService.deletePrivateMessage(deletePayload);
      }

      if (response.status) {
        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
        message.success('Message deleted successfully');
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      message.error('Failed to delete message');
    }
  };

  const messageMenu = (msg: Message) => (
    <Menu>
      {msg.senderId === userId && (
        <>
          <Menu.Item key="edit" onClick={() => handleEditMessage(msg)}>
            <EditOutlined /> Edit
          </Menu.Item>
          <Menu.Item key="delete" onClick={() => handleDeleteMessage(msg)}>
            <DeleteOutlined /> Delete
          </Menu.Item>
        </>
      )}
    </Menu>
  );

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

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedRoomId(null);
    setMessages([]);
    fetchPrivateChatHistory();
    if (lastCheckedUserId.current !== user.id) checkUserStatus(user.id);
  };

  const handleGroupSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedUser(null);
    setMessages([]);
    if (socket?.connected) socket.emit('joinRoom', roomId);
    fetchGroupMessages();
  };

  const handleSortChange = (value: string) => setSortOption(value);

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsersForGroup.length < 2) {
      message.error('Please provide a group name and select at least two users');
      return;
    }
    const chatRoomData = new CreateChatRoomModel([userId!, ...selectedUsersForGroup], groupName);
    try {
      const response = await chatService.createChatRoom(chatRoomData);
      if (response.status && response.data) {
        setIsCreatingGroup(false);
        setSelectedUsersForGroup([]);
        setGroupName('');
        fetchChatRooms();
        message.success('Group created successfully');
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      message.error('Failed to create group');
    }
  };

  const handleBackgroundChange = (background: string) => setChatBackground(background);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value.toLowerCase());

  const onEmojiClick = (emojiObject: any) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => (track.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach((track) => (track.enabled = isCameraOff));
      setIsCameraOff(!isCameraOff);
    }
  };

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen().catch((err) => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen().catch((err) => console.error('Exit fullscreen error:', err));
    }
    setIsFullScreen(!isFullScreen);
  };

  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current || !localStream) return;

    if (!isSharingScreen) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(screenTrack);
          setIsSharingScreen(true);

          localStream.getVideoTracks().forEach((track) => track.stop());
          setLocalStream(screenStream);

          screenTrack.onended = async () => {
            setIsSharingScreen(false);
            try {
              const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
              const webcamTrack = webcamStream.getVideoTracks()[0];
              await sender.replaceTrack(webcamTrack);
              setLocalStream(webcamStream);
            } catch (error) {
              message.error('Failed to revert to webcam: ' + error);
            }
          };
        }
      } catch (error) {
        message.error('Failed to share screen: ' + error);
      }
    } else {
      localStream.getTracks().forEach((track) => track.stop());
      try {
        const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const webcamTrack = webcamStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(webcamTrack);
        }
        setLocalStream(webcamStream);
        setIsSharingScreen(false);
      } catch (error) {
        message.error('Failed to stop screen sharing: ' + error);
      }
    }
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
        <Input placeholder="Search contact / chat" prefix={<SearchOutlined />} value={searchQuery} onChange={handleSearch} className="search-input1" />
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
              .sort((a, b) => {
                if (sortOption === 'unread') return (b.unreadCount || 0) - (a.unreadCount || 0);
                if (sortOption === 'alphabetical') return (a.username || a.name).localeCompare(b.username || b.name);
                return new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime();
              })
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
                          <Avatar src={item.profilePicture} icon={<UserOutlined />} size={40} />
                          {onlineUsers.includes(id) && <span className="online-dot" />}
                        </div>
                      ) : (
                        <Avatar icon={<UserOutlined />} size={40} />
                      )}
                      <div className="user-info">
                        <Text strong>{name}</Text>
                        <Text type="secondary" className="message-preview">{item.lastMessage || ''}</Text>
                      </div>
                      {item.unreadCount > 0 && (
                        <div className="unread-count">{item.unreadCount}</div>
                      )}
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
                  <Avatar src={selectedUser?.profilePicture} icon={<UserOutlined />} size={40} />
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
                </Space>
              )}
            </motion.div>

            <div className="messages-container" ref={messagesContainerRef}>
              {messages.length > 0 ? (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <React.Fragment key={date}>
                    <div className="date-divider"><Text type="secondary">{date}</Text></div>
                    {msgs.map((msg) => (
                      <div key={msg._id} className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}>
                        <Dropdown overlay={messageMenu(msg)} trigger={['click']}>
                          <Button type="text" icon={<MoreOutlined />} className="message-actions" />
                        </Dropdown>
                        {msg.fileUrl && msg.fileType ? (
                          msg.fileType.startsWith('image') ? (
                            <img src={msg.fileUrl} alt="Attachment" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                          ) : (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">Download File</a>
                          )
                        ) : null}
                        {msg.text && <Text className="message-text">{msg.text}</Text>}
                        {msg.emoji && <Text className="message-emoji">{msg.emoji}</Text>}
                        <div className="timestamp">
                          <Text>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                          {msg.senderId === userId && (
                            <Text className="message-status">
                              {msg.status === 'pending' ? 'Sending...' : msg.status === 'delivered' ? 'Delivered' : msg.status === 'read' ? 'Read' : 'Failed'}
                            </Text>
                          )}
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
                  onPressEnter={(e) => { e.preventDefault(); editingMessage ? handleSaveEdit() : handleSendMessage(); }}
                  className="message-input"
                />
                <Button
                  type="primary"
                  icon={editingMessage ? <CheckOutlined /> : <SendOutlined />}
                  onClick={editingMessage ? handleSaveEdit : handleSendMessage}
                  className="send-button"
                />
                {editingMessage && (
                  <Button type="text" icon={<CloseOutlined />} onClick={() => { setEditingMessage(null); setMessageInput(''); }} />
                )}
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
        </motion.div>
      )}

      {/* Call Modal */}
      <Modal
        title={callType === 'audio' ? 'Audio Call' : 'Video Call'}
        open={isCalling}
        onCancel={endCall}
        footer={
          <Space>
            {callType === 'video' && (
              <>
                <Button
                  icon={isCameraOff ? <VideoCameraAddOutlined /> : <VideoCameraOutlined />}
                  onClick={toggleCamera}
                  type={isCameraOff ? 'default' : 'primary'}
                  aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isCameraOff ? 'Camera On' : 'Camera Off'}
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={toggleScreenShare}
                  type={isSharingScreen ? 'primary' : 'default'}
                  aria-label={isSharingScreen ? 'Stop sharing screen' : 'Share screen'}
                >
                  {isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
                </Button>
              </>
            )}
            <Button
              icon={isMuted ? <UserOutlined /> : <SoundOutlined />}
              onClick={toggleMute}
              type={isMuted ? 'default' : 'primary'}
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            <Button
              icon={isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullScreen}
              aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
            >
              {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            <Button danger onClick={endCall} aria-label="End call">
              End Call
            </Button>
          </Space>
        }
        width={callType === 'video' ? 900 : 400}
        className="video-call-modal"
        centered
      >
        <div className="call-container">
          {isLoading && <Spin tip="Connecting..." size="large" />}
          {callType === 'audio' ? (
            <div className="audio-call-container">
              <AudioOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              <Text className="call-status">Connected to {selectedUser?.username || 'User'}</Text>
            </div>
          ) : (
            <div className="video-call-container">
              <div className="video-wrapper local-video-wrapper">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="local-video"
                  aria-label="Your video feed"
                />
                <Text className="video-label">You</Text>
                {isCameraOff && <div className="camera-off">Camera Off</div>}
              </div>
              <div className="video-wrapper remote-video-wrapper">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="remote-video"
                  aria-label="Remote participant's video feed"
                />
                <Text className="video-label">{selectedUser?.username || 'Remote'}</Text>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Incoming Call Modal */}
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
    </div>
  );
};

export default ChatPage;
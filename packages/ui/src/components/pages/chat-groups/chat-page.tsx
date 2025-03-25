import React, { useState, useEffect, useRef } from 'react';
import { CreateChatRoomModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models';
import { Button, Input, Typography, Avatar, message, Space, Dropdown, Menu, Select, Checkbox } from 'antd';
import { SendOutlined, UserOutlined, MoreOutlined, SearchOutlined, FilterOutlined, PlusOutlined, SmileOutlined, PaperClipOutlined } from '@ant-design/icons';
import { ChatHelpService } from '@in-one/shared-services';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Picker from 'emoji-picker-react';
import './chat-page.css';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface User {
  id: string;
  username: string;
  profilePicture?: string;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface Message {
  _id: string;
  senderId: string;
  receiverId?: string;
  chatRoomId?: string;
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
  const [file, setFile] = useState<File | null>(null);
  const chatService = new ChatHelpService();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SOCKET_URL = 'http://localhost:3006'; 
  useEffect(() => {
    if (userId && !hasFetchedUsers) {
      fetchUsers();
      fetchChatRooms();
      initSocket(userId);
      setHasFetchedUsers(true);
    }
    return () => {
      socket?.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (selectedUser && userId) {
      const privateRoomId = [userId, selectedUser.id].sort().join('-');
      setChatRoomId(privateRoomId);
      socket?.emit('joinRoom', privateRoomId);
      fetchChatHistory();
    }
  }, [selectedUser, userId, socket]);

  useEffect(() => {
    if (selectedRoomId && userId) {
      setChatRoomId(selectedRoomId);
      socket?.emit('joinRoom', selectedRoomId);
      fetchGroupMessages();
    }
  }, [selectedRoomId, userId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initSocket = (userId: string) => {
    const newSocket = io(SOCKET_URL, {
      query: { userId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      if (chatRoomId) newSocket.emit('joinRoom', chatRoomId);
    });

    newSocket.on('privateMessage', (data) => {
      if (!data.success || !data.message) return;
      const { _id, senderId, receiverId, chatRoomId, text, createdAt } = data.message;

      setMessages((prev) => {
        if (prev.some((msg) => msg._id === _id)) return prev;
        return [...prev, { _id, senderId, receiverId, chatRoomId, text, createdAt, status: 'delivered' }];
      });

      if (senderId !== userId && document.hidden) {
        const sender = users.find((u) => u.id === senderId);
        if ('Notification' in window) {
          const showNotification = () =>
            new Notification(`New Message from ${sender?.username || 'Unknown'}`, { body: text });
          if (Notification.permission === 'granted') showNotification();
          else if (Notification.permission !== 'denied') Notification.requestPermission().then((perm) => perm === 'granted' && showNotification());
        }
      }
    });

    newSocket.on('groupMessage', (data) => {
      if (!data.success || !data.message) return;
      const { _id, senderId, chatRoomId, text, createdAt } = data.message;

      if (chatRoomId === selectedRoomId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg._id === _id)) return prev;
          return [...prev, { _id, senderId, chatRoomId, text, createdAt, status: 'delivered' }];
        });
      } else if (senderId !== userId && document.hidden) {
        const room = chatRooms.find((r) => r._id === chatRoomId);
        const sender = users.find((u) => u.id === senderId);
        if ('Notification' in window) {
          const showNotification = () =>
            new Notification(`New Message in ${room?.name || 'Group'}`, { body: `${sender?.username}: ${text}` });
          if (Notification.permission === 'granted') showNotification();
          else if (Notification.permission !== 'denied') Notification.requestPermission().then((perm) => perm === 'granted' && showNotification());
        }
      }
    });

    newSocket.on('onlineUsers', setOnlineUsers);
    newSocket.on('connect_error', (err) => console.error('Socket error:', err));
    setSocket(newSocket);
  };

  const fetchUsers = async () => {
    try {
      const response = await chatService.getAllUsers();
      if (response.status && response.data?.data) {
        setUsers(response.data.data.filter((u: User) => u.id !== userId));
      }
    } catch (error) {
      message.error('Failed to fetch users');
    }
  };

  const fetchChatRooms = async () => {
    try {
      const reqModel = new UserIdRequestModel(userId!);
      const response = await chatService.getChatRooms(reqModel);
      if (response.status && response.data?.data) setChatRooms(response.data.data);
    } catch (error) {
      message.error('Failed to fetch chat rooms');
    }
  };

  const fetchChatHistory = async () => {
    if (!selectedUser || !userId) return;
    try {
      const response = await chatService.getChatHistoryByUsers({ senderId: userId, receiverId: selectedUser.id });
      if (response.status && Array.isArray(response.data)) {
        setMessages(response.data.map((msg: any) => ({
          _id: msg._id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          chatRoomId: msg.chatRoomId,
          text: msg.text,
          createdAt: msg.createdAt,
          status: 'delivered',
        })));
      }
    } catch (error) {
      message.error('Failed to fetch chat history');
    }
  };

  const fetchGroupMessages = async () => {
    if (!selectedRoomId || !userId) return;
    try {
      const response = await chatService.getMessages({ chatRoomId: selectedRoomId });
      if (response.status && Array.isArray(response.data)) {
        setMessages(response.data.map((msg: any) => ({
          _id: msg._id,
          senderId: msg.senderId,
          chatRoomId: msg.chatRoomId,
          text: msg.text,
          createdAt: msg.createdAt,
          status: 'delivered',
        })));
      }
    } catch (error) {
      message.error('Failed to load group messages');
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!messageInput.trim() && !file) {
      message.warning('Message or file cannot be empty');
      return;
    }
    if (!userId) {
      message.warning('Please log in');
      return;
    }
  
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      senderId: userId,
      text: messageInput,
      createdAt: new Date().toISOString(),
      status: 'pending' as const,
      ...(file && { image: URL.createObjectURL(file) }),
    };
  
    if (selectedRoomId) {
      const payload = { chatRoomId: selectedRoomId, senderId: userId, text: messageInput, createdAt: tempMessage.createdAt };
      setMessages((prev) => [...prev, { ...tempMessage, chatRoomId: selectedRoomId }]);
      setMessageInput('');
      setFile(null);
  
      socket?.emit('sendGroupMessage', payload, (response: any) => {
        if (response?.success && response.data) {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === tempMessage._id ? { ...response.data, status: 'delivered' } : msg))
          );
        } else {
          setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg)));
          message.error('Failed to send group message');
        }
      });
    } else if (selectedUser) {
      const messageData = new PrivateMessegeModel(userId, selectedUser.id, messageInput);
      const tempMessageData: Message = {
        ...tempMessage,
        receiverId: selectedUser.id,
        chatRoomId: chatRoomId ?? undefined, // Convert null to undefined to match Message interface
      };
      setMessages((prev) => [...prev, tempMessageData]);
      setMessageInput('');
      setFile(null);
  
      socket?.emit('sendMessage', { message: messageData, chatRoomId, createdAt: tempMessage.createdAt }, (response: any) => {
        if (response?.success && response.data) {
          setMessages((prev) =>
            prev.map((msg) => (msg._id === tempMessage._id ? { ...response.data, status: 'delivered' } : msg))
          );
          if (!chatRoomId && response.data.chatRoomId) setChatRoomId(response.data.chatRoomId);
        } else {
          setMessages((prev) => prev.map((msg) => (msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg)));
          message.error('Failed to send message');
        }
      });
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSelectedRoomId(null);
    setMessages([]);
    const privateRoomId = [userId!, user.id].sort().join('-');
    setChatRoomId(privateRoomId);
    socket?.emit('joinRoom', privateRoomId);
    fetchChatHistory();
  };

  const handleGroupSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedUser(null);
    setMessages([]);
    setChatRoomId(roomId);
    socket?.emit('joinRoom', roomId);
    fetchGroupMessages();
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    let sortedUsers = [...users];
    if (value === 'recent') sortedUsers.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
    else if (value === 'alphabetical') sortedUsers.sort((a, b) => a.username.localeCompare(b.username));
    setUsers(sortedUsers);
  };
  const handleCreateGroup = async (): Promise<void> => {
    if (!groupName || selectedUsersForGroup.length < 2) {
      message.warning('Enter a group name and select at least 2 users');
      return; // Explicitly return void early
    }
  
    try {
      const chatRoomData = new CreateChatRoomModel([userId!, ...selectedUsersForGroup], groupName);
      const response = await chatService.createChatRoom(chatRoomData);
      if (response.status && response.data) {
        setChatRooms((prev) => [...prev, response.data]);
        setIsCreatingGroup(false);
        setSelectedUsersForGroup([]);
        setGroupName('');
        message.success('Group created successfully');
      }
    } catch (error) {
      message.error('Failed to create group');
    }
  };

  const handleBackgroundChange = (color: string) => setChatBackground(color);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value);
  const onEmojiClick = (emojiObject: any) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  if (!userId) return <Title level={3}>Please log in to use the chat</Title>;

  const menu = <Menu><Menu.Item key="1">Option 1</Menu.Item></Menu>;
  const filteredUsers = users.filter((u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedRoom = chatRooms.find((r) => r._id === selectedRoomId);

  return (
    <div className="chat-container">
      <motion.div className="sidebar" initial={{ x: -300 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
        <div className="sidebar-header">
          <Title level={4}>Chats</Title>
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setIsCreatingGroup(true)} />
            <Select defaultValue="recent" style={{ width: 120 }} onChange={handleSortChange}>
              <Option value="recent">Recent</Option>
              <Option value="alphabetical">Alphabetical</Option>
            </Select>
          </Space>
        </div>
        <Input placeholder="Search chats" prefix={<SearchOutlined />} value={searchQuery} onChange={handleSearch} />
        {isCreatingGroup ? (
          <div className="group-creation">
            <Input placeholder="Group Name" value={groupName} onChange={(e) => setGroupName(e.target.value)} style={{ marginBottom: 16 }} />
            {users.map((user) => (
              <Checkbox
                key={user.id}
                onChange={(e) =>
                  setSelectedUsersForGroup((prev) =>
                    e.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                  )
                }
              >
                <Space>
                  <Avatar src={user.profilePicture} icon={<UserOutlined />} />
                  <Text>{user.username}</Text>
                </Space>
              </Checkbox>
            ))}
            <Space style={{ marginTop: 16 }}>
              <Button onClick={() => setIsCreatingGroup(false)}>Cancel</Button>
              <Button type="primary" onClick={handleCreateGroup}>Create</Button>
            </Space>
          </div>
        ) : (
          <>
            <div className="group-list">
              <Text strong>Groups</Text>
              {chatRooms.filter((r) => r.isGroup).map((room) => (
                <motion.div
                  key={room._id}
                  className={`user-item ${selectedRoomId === room._id ? 'active' : ''}`}
                  onClick={() => handleGroupSelect(room._id)}
                  whileHover={{ scale: 1.02 }}
                >
                  <Space>
                    <Avatar icon={<UserOutlined />} />
                    <Text>{room.name}</Text>
                  </Space>
                </motion.div>
              ))}
            </div>
            <div className="user-list">
              <Text strong>Users</Text>
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => handleUserSelect(user)}
                  whileHover={{ scale: 1.02 }}
                >
                  <Space>
                    <Avatar src={user.profilePicture} icon={<UserOutlined />} />
                    <Text>{user.username}</Text>
                    {onlineUsers.includes(user.id) && <span className="online-dot" />}
                  </Space>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      <div className="chat-area" style={{ background: chatBackground }}>
        {(selectedUser || selectedRoomId) ? (
          <>
            <div className="chat-header">
              <Space>
                <Avatar src={selectedUser?.profilePicture} icon={<UserOutlined />} />
                <Title level={4}>{selectedUser?.username || selectedRoom?.name}</Title>
              </Space>
              <Dropdown overlay={menu} trigger={['click']}>
                <Button icon={<MoreOutlined />} type="text" />
              </Dropdown>
            </div>
            <div className="messages-container">
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg._id}
                    className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {msg.image && <img src={msg.image} alt="attachment" style={{ maxWidth: '200px' }} />}
                    <Text>{msg.text}</Text>
                    <Text type="secondary">{new Date(msg.createdAt).toLocaleTimeString()}</Text>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
            <div className="input-area">
              <Space.Compact>
                <Button icon={<SmileOutlined />} onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                {showEmojiPicker && <Picker onEmojiClick={onEmojiClick} />}
                <label>
                  <Button icon={<PaperClipOutlined />} />
                  <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
                <TextArea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  onPressEnter={(e) => { e.preventDefault(); handleSendMessage(); }}
                />
                <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} />
              </Space.Compact>
            </div>
          </>
        ) : (
          <Text type="secondary">Select a chat to start messaging</Text>
        )}
      </div>

      {(selectedUser || selectedRoomId) && (
        <motion.div className="right-sidebar" initial={{ x: 300 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
          <div className="customize-section">
            <Text strong>Customize Theme</Text>
            <Space>
              <div className="theme-circle" style={{ background: '#1890ff' }} onClick={() => handleBackgroundChange('#1890ff')} />
              <div className="theme-circle" style={{ background: '#52c41a' }} onClick={() => handleBackgroundChange('#52c41a')} />
              <div className="theme-circle" style={{ background: '#ff4d4f' }} onClick={() => handleBackgroundChange('#ff4d4f')} />
            </Space>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatPage;
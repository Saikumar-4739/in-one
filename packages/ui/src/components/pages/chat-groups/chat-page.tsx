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
      fetchChatHistory();
      setSelectedRoomId(chatRoomId);
    }
  }, [selectedUser, userId]);

  useEffect(() => {
    if (selectedRoomId && userId) {
      console.log('useEffect triggered for selectedRoomId:', selectedRoomId); // Debug log
      fetchGroupMessages();
      setSelectedUser(null); // Ensure no user is selected
    }
  }, [selectedRoomId, userId]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messagesContainerRef.current) {
      messagesContainerRef.current.style.height = 'auto';
      const height = messagesContainerRef.current.scrollHeight;
      messagesContainerRef.current.style.height = `${Math.min(height, window.innerHeight - 200)}px`;
    }
  }, [messages]);

  const initSocket = (userId: string) => {
    const newSocket = io('http://localhost:3005', {
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
      const { senderId, receiverId, chatRoomId: receivedChatRoomId, text } = data.message;
      const isRelevant =
        (senderId === userId && receiverId === selectedUser?.id) ||
        (senderId === selectedUser?.id && receiverId === userId);
      const involvesUser = senderId === userId || receiverId === userId;

      const sender = users.find((u) => u.id === senderId);
      const senderName = sender?.username || 'Unknown';

      if (involvesUser) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg._id === data.message._id);
          if (!messageExists) return [...prev, { ...data.message, status: 'delivered' }];
          return prev;
        });
      }

      if (!isRelevant && involvesUser && 'Notification' in window) {
        const showNotification = () => {
          const notification = new Notification(`New Message from ${senderName}`, {
            body: text,
            icon: sender?.profilePicture || undefined,
            tag: data.message._id,
          });
          notification.onclick = () => {
            window.focus();
            const targetUser = users.find((u) => u.id === (senderId === userId ? receiverId : senderId));
            if (targetUser) {
              setSelectedUser(targetUser);
              fetchChatHistory();
            }
          };
        };
        if (Notification.permission === 'granted') showNotification();
        else if (Notification.permission !== 'denied') Notification.requestPermission().then((perm) => { if (perm === 'granted') showNotification(); });
      }

      if (!chatRoomId && receivedChatRoomId) {
        setChatRoomId(receivedChatRoomId);
        newSocket.emit('joinRoom', receivedChatRoomId);
      }
    });

    newSocket.on('groupMessage', (data) => {
      if (!data.success || !data.message) {
        console.warn('Invalid groupMessage data:', data);
        return;
      }
      const { senderId, chatRoomId, text, createdAt, _id } = data.message;
      console.log('Received groupMessage:', { senderId, chatRoomId, text, _id }); // Debug log
      if (chatRoomId === selectedRoomId) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg._id === _id);
          if (!messageExists) {
            const newMessage = { _id, senderId, text, createdAt, chatRoomId, status: 'delivered' };
            console.log('Adding new message to state:', newMessage); // Debug log
            return [...prev, newMessage];
          }
          return prev;
        });
      } else {
        const room = chatRooms.find((r) => r._id === chatRoomId);
        if (room) message.info(`New message in ${room.name}`);
      }
    });

    newSocket.on('onlineUsers', setOnlineUsers);
    newSocket.on('connect_error', () => message.error('Socket connection failed'));
    newSocket.on('error', () => { });
    newSocket.on('disconnect', () => { });

    setSocket(newSocket);
  };

  const fetchUsers = async () => {
    try {
      const response = await chatService.getAllUsers();
      if (response.status && response.data?.data) {
        const filteredUsers = response.data.data.filter((u: any) => u.id !== userId);
        setUsers(filteredUsers);
      } else throw new Error('Invalid response structure');
    } catch (error) {
    }
  };

  const fetchChatRooms = async () => {
    try {
      const reqModel = new UserIdRequestModel(userId!);
      const response = await chatService.getChatRooms(reqModel);
      if (response.status && response.data?.data) setChatRooms(response.data.data);
      else message.error('Failed to fetch chat rooms');
    } catch (error) {
      message.error('An error occurred while fetching chat rooms');
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

  const fetchGroupMessages = async () => {
    if (!selectedRoomId || !userId) {
      console.warn('fetchGroupMessages aborted - Missing data:', { selectedRoomId, userId });
      return;
    }
    try {
      const reqModel = { chatRoomId: selectedRoomId };
      console.log('Fetching messages for chatRoomId:', selectedRoomId);
      const response = await chatService.getMessages(reqModel);
      if (response.status && Array.isArray(response.data)) {
        const formattedMessages = response.data.map((msg: any) => ({
          _id: msg._id,
          senderId: msg.senderId,
          chatRoomId: msg.chatRoomId,
          text: msg.text,
          createdAt: msg.createdAt,
          status: 'delivered',
        }));
        setMessages(formattedMessages);
        setChatRoomId(selectedRoomId);
        if (socket && socket.connected) socket.emit('joinRoom', selectedRoomId);
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      message.error('Failed to load group messages');
      setMessages([]);
    }
  };

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
        message.info('Socket not connected, sending via API...');
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
        message.info('Socket not connected, sending via API...');
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
          } else throw new Error('Failed to send message via API');
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
    } else {
      message.warning('Please select a user or group to send a message.');
    }
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setMessages([]);
    setChatRoomId(null);
  };

  const handleGroupSelect = (roomId: string) => {
    console.log('Selecting group with roomId:', roomId); // Debug log
    setSelectedRoomId(roomId); // Set the selected room ID
    setMessages([]); // Reset messages
    setChatRoomId(roomId); // Set the chat room ID for socket
    setSelectedUser(null); // Clear selected user
    if (socket && socket.connected) {
      socket.emit('joinRoom', roomId); // Join the room via socket
    }
    fetchGroupMessages(); // Fetch messages immediately
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    let sortedUsers = [...users];
    if (value === 'recent') sortedUsers.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
    else if (value === 'unread') sortedUsers.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
    else if (value === 'alphabetical') sortedUsers.sort((a, b) => a.username.localeCompare(b.username));
    setUsers(sortedUsers);
  };

  const handleCreateGroup = async () => {
    if (!groupName || selectedUsersForGroup.length < 2) {
      message.warning('Please enter a group name and select at least 2 users.');
      return;
    }
    if (!userId) {
      message.error('User ID is missing. Please log in to create a group.');
      return;
    }
    try {
      const chatRoomData = new CreateChatRoomModel([userId, ...selectedUsersForGroup], groupName);
      const createRoomResponse = await chatService.createChatRoom(chatRoomData);
      if (createRoomResponse.status && createRoomResponse.data) {
        message.success('Group created successfully!');
        setIsCreatingGroup(false);
        setSelectedUsersForGroup([]);
        setGroupName('');
        fetchChatRooms();
      } else throw new Error('Failed to create group');
    } catch (error) {
      message.error('Failed to create group');
    }
  };

  const handleBackgroundChange = (background: string) => setChatBackground(background);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(query));
    setUsers(filteredUsers);
  };

  const onEmojiClick = (emojiObject: any) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  if (!userId) {
    return (
      <div className="login-prompt">
        <Title level={3}>Please log in to use the chat</Title>
      </div>
    );
  }

  const menu = (
    <Menu>
      <Menu.Item key="1">Option 1</Menu.Item>
      <Menu.Item key="2">Option 2</Menu.Item>
      <Menu.Item key="3">Option 3</Menu.Item>
    </Menu>
  );

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedRoom = chatRooms.find((room) => room._id === selectedRoomId);

  return (
    <div className="chat-container">
      <motion.div className="sidebar" initial={{ x: -300 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
        <div className="sidebar-header">
          <Title level={4}>Chats</Title>
          <Space>
            <Button icon={<PlusOutlined />} type="text" onClick={() => setIsCreatingGroup(true)} />
            <Select defaultValue="recent" style={{ width: 120 }} onChange={handleSortChange} suffixIcon={<FilterOutlined />}>
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
            <div className="group-list">
              <Text strong style={{ display: 'block', padding: '12px 16px' }}>Groups</Text>
              {chatRooms.filter((room) => room.isGroup).length > 0 ? (
                chatRooms.filter((room) => room.isGroup).map((room) => (
                  <motion.div
                    key={room._id}
                    className={`user-item ${selectedRoomId === room._id ? 'active' : ''}`}
                    onClick={() => handleGroupSelect(room._id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Space>
                      <Avatar icon={<UserOutlined />} size={40} />
                      <div className="user-info">
                        <Text strong>{room.name || 'Unnamed Group'}</Text>
                        <Text type="secondary" className="message-preview">{room.lastMessage || ''}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleTimeString() : ''}</Text>
                      <span className="emoji">👥</span>
                    </Space>
                  </motion.div>
                ))
              ) : (
                <Text type="secondary" style={{ padding: '12px 16px' }}>No groups yet. Create one!</Text>
              )}
            </div>
            <div className="user-list">
              <Text strong style={{ display: 'block', padding: '12px 16px' }}>Users</Text>
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => handleUserSelect(user)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Space>
                    <div className="avatar-container">
                      <div>{user.username.charAt(0).toUpperCase()}</div>
                      {onlineUsers.includes(user.id) && <span className="online-dot" />}
                    </div>
                    <div className="user-info">
                      <Text strong>{user.username}</Text>
                      <Text type="secondary" className="message-preview">{user.lastMessage || ''}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{user.lastMessageTime ? new Date(user.lastMessageTime).toLocaleTimeString() : ''}</Text>
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
            <motion.div className="chat-header" initial={{ y: -50 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
              <Space>
                <div className="avatar-container">
                  <div>{(selectedUser?.username || selectedRoom?.name || 'Group')?.charAt(0).toUpperCase()}</div>
                  {selectedUser && onlineUsers.includes(selectedUser.id) ? (
                    <span className="status-dot online" />
                  ) : selectedUser ? (
                    <span className="status-dot offline" />
                  ) : null}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#8a2be2', fontWeight: 'bold' }}>
                    {selectedUser ? selectedUser.username : selectedRoom?.name || 'Unnamed Group'}
                  </Title>
                  <Text type="secondary" style={{ color: '#e6e6e6' }}>
                    {selectedUser
                      ? onlineUsers.includes(selectedUser.id)
                        ? 'Active Now'
                        : `Last Seen ${new Date(selectedUser.lastSeen || Date.now()).toLocaleString()}`
                      : 'Group Chat'}
                  </Text>
                </div>
              </Space>
              <Space>
                <Button icon={<SearchOutlined />} type="text" />
                <Dropdown overlay={menu} trigger={['click']}>
                  <Button icon={<MoreOutlined />} type="text" />
                </Dropdown>
              </Space>
            </motion.div>
            <div className="messages-container" ref={messagesContainerRef}>
              {messages.length > 0 ? (
                messages.map((msg, index) => {
                  const showDateSeparator =
                    index === 0 || new Date(messages[index - 1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                  return (
                    <React.Fragment key={msg._id || index}>
                      {showDateSeparator && (
                        <div className="date-separator">
                          <Text type="secondary">{new Date(msg.createdAt).toUTCString()}</Text>
                        </div>
                      )}
                      <div className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}>
                        {msg.image && <img src={msg.image} alt="message attachment" className="message-image" />}
                        {msg.text && <Text className="message-text">{msg.text}</Text>}
                        <div className="timestamp">
                          <Text>{new Date(msg.createdAt).toLocaleTimeString()}</Text>
                          {msg.senderId === userId && (
                            <span className={`tick ${msg.status === 'delivered' ? 'double' : 'single'}`}>
                              {msg.status === 'delivered' ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              ) : (
                <div className="no-messages">
                  <Text type="secondary">No messages in this group yet. Start chatting!</Text>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <motion.div className="input-area" initial={{ y: 50 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 100 }}>
              <Space.Compact className="input-compact">
                <Button icon={<SmileOutlined />} type="text" onClick={() => setShowEmojiPicker(!showEmojiPicker)} />
                {showEmojiPicker && <Picker onEmojiClick={onEmojiClick} />}
                <label>
                  <Button icon={<PaperClipOutlined />} type="text" />
                  <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
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
        <motion.div className="right-sidebar" initial={{ x: 300 }} animate={{ x: 0 }} transition={{ type: 'spring', stiffness: 100, damping: 20 }}>
          <div className="user-profile">
            <Avatar src={selectedUser?.profilePicture} icon={<UserOutlined />} size={80} />
            <Title level={4}>{selectedUser ? selectedUser.username : selectedRoom?.name || 'Group Chat'}</Title>
            <Text type="secondary">
              {selectedUser
                ? onlineUsers.includes(selectedUser.id)
                  ? 'Active Now'
                  : `Last Seen ${new Date(selectedUser.lastSeen || Date.now()).toLocaleString()}`
                : 'Group Chat'}
            </Text>
          </div>
          {(selectedRoomId && selectedRoom?.isGroup) && (
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
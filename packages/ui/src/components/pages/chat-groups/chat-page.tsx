import React, { useState, useEffect, useRef } from 'react';
import { CreateChatRoomModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models';
import { Button, Input, Typography, Avatar, message, Space, Dropdown, Menu, Select, Checkbox, Modal } from 'antd';
import { SendOutlined, PhoneOutlined, UserOutlined, MoreOutlined, SearchOutlined, FilterOutlined, BellOutlined, PictureOutlined, SettingOutlined, PlusOutlined, VideoCameraOutlined, SmileOutlined, PaperClipOutlined } from '@ant-design/icons';
import { ChatHelpService } from '@in-one/shared-services';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import './chat-page.css';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]); // State for groups
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null); // State for selected group
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [userId] = useState<string | null>(() => localStorage.getItem('userId'));
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
  const [chatBackground, setChatBackground] = useState<string>('#e6f0fa');
  const [sortOption, setSortOption] = useState<string>('recent');
  const [selectedUsersForGroup, setSelectedUsersForGroup] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [groupName, setGroupName] = useState<string>('');
  const chatService = new ChatHelpService();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId && !hasFetchedUsers) {
      fetchUsers();
      fetchChatRooms(); // Fetch groups
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
      setSelectedRoomId(null); // Reset selected group when a user is selected
    }
  }, [selectedUser]);

  useEffect(() => {
    if (selectedRoomId && userId) {
      fetchGroupMessages(); // Fetch messages for the selected group
      setSelectedUser(null); // Reset selected user when a group is selected
    }
  }, [selectedRoomId]);

  useEffect(() => {
    if (selectedUser && userId) {
      if (pendingMessages.length > 0) {
        const relevantPending = pendingMessages.filter(
          (msg) => (msg.senderId === selectedUser.id && msg.receiverId === userId) || (msg.senderId === userId && msg.receiverId === selectedUser.id)
        );
        if (relevantPending.length > 0) {
          setMessages((prev) => [...prev, ...relevantPending]);
          setPendingMessages((prev) => prev.filter((msg) => !relevantPending.includes(msg)));
        }
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

    newSocket.on('connect', () => { });

    newSocket.on('privateMessage', (data) => {
      if (!data.success || !data.message) {
        return;
      }

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
          if (!messageExists) {
            return [...prev, { ...data.message, status: 'delivered' }];
          }
          return prev;
        });
      }

      if (!isRelevant && involvesUser) {
        if ('Notification' in window) {
          const showSystemNotification = () => {
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

          if (Notification.permission === 'granted') {
            showSystemNotification();
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                showSystemNotification();
              }
            });
          }
        }
      }

      if (!chatRoomId && receivedChatRoomId) {
        setChatRoomId(receivedChatRoomId);
        newSocket.emit('joinRoom', receivedChatRoomId);
      }
    });

    newSocket.on('onlineUsers', (users: string[]) => {
      setOnlineUsers(users);
    });

    newSocket.on('connect_error', (error) => {
      message.error('Socket connection failed');
    });

    newSocket.on('error', (error) => { });

    newSocket.on('disconnect', () => { });

    setSocket(newSocket);
  };

  const fetchUsers = async () => {
    try {
      const response = await chatService.getAllUsers();
      if (response.status && response.data?.data) {
        const filteredUsers = response.data.data.filter((u: any) => u.id !== userId);
        setUsers(filteredUsers);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      message.error('Failed to fetch users');
    }
  };

  const fetchChatRooms = async () => {
    try {
      const reqModel = new UserIdRequestModel(userId!);
      const response = await chatService.getChatRooms(reqModel);
      if (response.status === true && response.data?.data) {
        setChatRooms(response.data.data); // Extract the chat rooms array from response.data.data
      } else {
        message.error('Failed to fetch chat rooms');
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      message.error('An error occurred while fetching chat rooms');
    }
  };

  const fetchChatHistory = async () => {
    if (!selectedUser || !userId) {
      return;
    }

    try {
      const response = await chatService.getChatHistoryByUsers({ senderId: userId, receiverId: selectedUser.id });
      if (response.status && response.data) {
        setMessages(response.data);
        const firstMessageWithChatRoom = response.data.find((msg: any) => msg.chatRoomId);
        if (firstMessageWithChatRoom) {
          setChatRoomId(firstMessageWithChatRoom.chatRoomId);
          socket?.emit('joinRoom', firstMessageWithChatRoom.chatRoomId);
        }
      } else {
        throw new Error('Failed to fetch chat history');
      }
    } catch (error) {
      message.error('Failed to fetch chat history');
    }
  };

  const fetchGroupMessages = async () => {
    if (!selectedRoomId || !userId) {
      return;
    }

    try {
      const reqModel = { chatRoomId: selectedRoomId };
      const response = await chatService.getMessages(reqModel);
      if (response.status === true) {
        setMessages(response.data || []);
        setChatRoomId(selectedRoomId);
        socket?.emit('joinRoom', selectedRoomId);
      } else {
        message.error('Failed to fetch group messages');
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      message.error('An error occurred while fetching group messages');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) {
      message.warning('Message cannot be empty');
      return;
    }
    if (!userId) {
      message.warning('Please ensure you are logged in.');
      return;
    }

    if (selectedRoomId) {
      console.log('Sending message with userId:', userId); // Add this
      const messageData = {
        chatRoomId: selectedRoomId,
        senderId: userId,
        text: messageInput,
      };
      try {
        const response = await chatService.sendMessage(messageData);
        if (response.status === true) {
          setMessages((prev) => [...prev, { senderId: userId, text: messageInput, createdAt: new Date() }]);
          setMessageInput('');
        } else {
          message.error(response.internalMessage || 'Failed to send message');
        }
      } catch (error) {
        console.error('Error sending group message:', error);
        message.error('An error occurred while sending the message');
      }
    } else if (selectedUser) {
      // Send private message
      const messageData = new PrivateMessegeModel(userId, selectedUser.id, messageInput);
      const tempMessage = {
        ...messageData,
        _id: `temp-${Date.now()}`,
        chatRoomId: chatRoomId || null,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      setMessages((prev) => [...prev, tempMessage]);
      setMessageInput('');

      if (!socket || !socket.connected) {
        message.info('Socket not connected, sending via API...');
        try {
          const response = await chatService.sendPrivateMessage(messageData);
          if (response.status && response.data) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg._id === tempMessage._id ? { ...response.data, status: 'delivered' } : msg
              )
            );
            if (!chatRoomId && response.data.chatRoomId) {
              setChatRoomId(response.data.chatRoomId);
              socket?.emit('joinRoom', response.data.chatRoomId);
            }
          } else {
            throw new Error('Failed to send message via API');
          }
        } catch (error) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg
            )
          );
          message.error('Failed to send message');
        }
        return;
      }

      const messagePayload = {
        message: messageData,
        chatRoomId: chatRoomId || null,
        createdAt: tempMessage.createdAt,
      };
      socket.emit('sendMessage', messagePayload, (response: any) => {
        if (response?.success && response.data) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempMessage._id ? { ...response.data, status: 'delivered' } : msg
            )
          );
          if (!chatRoomId && response.data.chatRoomId) {
            setChatRoomId(response.data.chatRoomId);
            socket.emit('joinRoom', response.data.chatRoomId);
          }
        } else {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg
            )
          );
          message.error(response?.message || 'Failed to send message');
        }
      });
    } else {
      message.warning('Please select a user or group to send a message.');
    }
  };

  const handleStartCall = async () => {
    if (!selectedUser || !userId || !socket) return;
    socket.emit('startCall', {
      callerId: userId,
      receiverId: selectedUser.id,
      callType: 'audio',
    });
  };

  const handleUserSelect = (user: any) => {
    setSelectedUser(user);
    setMessages([]);
    setChatRoomId(null);
  };

  const handleGroupSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMessages([]);
    setChatRoomId(null);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    let sortedUsers = [...users];
    if (value === 'recent') {
      sortedUsers.sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
    } else if (value === 'unread') {
      sortedUsers.sort((a, b) => (b.unreadCount || 0) - (a.unreadCount || 0));
    } else if (value === 'alphabetical') {
      sortedUsers.sort((a, b) => a.username.localeCompare(b.username));
    }
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
        fetchChatRooms(); // Fetch updated groups
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      message.error('Failed to create group');
    }
  };

  const handleBackgroundChange = (background: string) => {
    setChatBackground(background);
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

  return (
    <div className="chat-container">
      <motion.div
        className="sidebar"
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="sidebar-header">
          <Title level={4}>Chats</Title>
          <Space>
            <Button icon={<PlusOutlined />} type="text" onClick={() => setIsCreatingGroup(true)} />
            <Select
              defaultValue="recent"
              style={{ width: 120 }}
              onChange={handleSortChange}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="recent">Recent</Option>
              <Option value="unread">Unread</Option>
              <Option value="alphabetical">Alphabetical</Option>
            </Select>
          </Space>
        </div>
        <div className="search-bar">
          <Input placeholder="Search contact / chat" prefix={<SearchOutlined />} className="search-input" />
        </div>
        {isCreatingGroup ? (
          <div className="group-creation">
            <Input
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            {users.map((user) => (
              <div key={user.id} className="user-item">
                <Checkbox
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsersForGroup([...selectedUsersForGroup, user.id]);
                    } else {
                      setSelectedUsersForGroup(selectedUsersForGroup.filter((id) => id !== user.id));
                    }
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
              <Button type="primary" onClick={handleCreateGroup}>
                Create Group
              </Button>
            </Space>
          </div>
        ) : (
          <>
            {/* Groups Section */}
            <div className="group-list">
              <Text strong style={{ display: 'block', padding: '12px 16px' }}>Groups</Text>
              {chatRooms.length > 0 && chatRooms.some((room) => room.isGroup) ? (
                chatRooms
                  .filter((room) => room.isGroup) // Filter to show only groups
                  .map((room) => (
                    <motion.div
                      key={room._id} // Use _id instead of chatRoomId to match API response
                      className={`user-item ${selectedRoomId === room._id ? 'active' : ''}`}
                      onClick={() => handleGroupSelect(room._id)} // Use _id instead of chatRoomId
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Space>
                        <Avatar icon={<UserOutlined />} size={40} />
                        <div className="user-info">
                          <Text strong>{room.name || 'Unnamed Group'}</Text>
                          <Text type="secondary" className="message-preview">
                            {room.lastMessage || 'No messages yet'}
                          </Text>
                        </div>
                      </Space>
                    </motion.div>
                  ))
              ) : (
                <Text type="secondary" style={{ padding: '12px 16px' }}>
                  No groups yet. Create one!
                </Text>
              )}
            </div>
            {/* Users Section */}
            <div className="user-list">
              <Text strong style={{ display: 'block', padding: '12px 16px' }}>Users</Text>
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  className={`user-item ${selectedUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => handleUserSelect(user)}
                  onMouseEnter={() => setHoveredUserId(user.id)}
                  onMouseLeave={() => setHoveredUserId(null)}
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
                      <Text type="secondary" className="message-preview">
                        {user.lastMessage || 'No messages yet'}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {user.lastMessageTime ? new Date(user.lastMessageTime).toLocaleTimeString() : ''}
                    </Text>
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
            <motion.div
              className="chat-header"
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <Space>
                <div className="avatar-container">
                  <div>{(selectedUser?.username || selectedRoomId)?.charAt(0).toUpperCase()}</div>
                  {selectedUser && onlineUsers.includes(selectedUser.id) ? (
                    <span className="status-dot online" />
                  ) : selectedUser ? (
                    <span className="status-dot offline" />
                  ) : null}
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, color: '#8a2be2', fontWeight: 'bold' /* White text for violet background */ }}>
                    {selectedUser ? selectedUser.username : chatRooms.find((room) => room._id === selectedRoomId)?.name || 'Group Chat'}
                  </Title>
                  <Text type="secondary" style={{ color: '#e6e6e6' /* Light gray for secondary text */ }}>
                    {selectedUser
                      ? onlineUsers.includes(selectedUser.id)
                        ? 'Active Now'
                        : `Last Seen ${new Date(selectedUser.lastSeen || Date.now()).toLocaleString()}`
                      : 'Group Chat'}
                  </Text>
                </div>
              </Space>
              <Space>
                {selectedUser && <Button icon={<PhoneOutlined />} type="text" onClick={handleStartCall} />}
                <Button icon={<VideoCameraOutlined />} type="text" />
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
                    index === 0 ||
                    new Date(messages[index - 1].createdAt).toDateString() !==
                    new Date(msg.createdAt).toDateString();
                  return (
                    <React.Fragment key={msg._id || index}>
                      {showDateSeparator && (
                        <div className="date-separator">
                          <Text type="secondary">
                            {new Date(msg.createdAt).toUTCString()}
                          </Text>
                        </div>
                      )}
                      <div className={`message ${msg.senderId === userId ? 'sent' : 'received'}`}>
                        {msg.image && <img src={msg.image} alt="message attachment" className="message-image" />}
                        {msg.text || msg.content ? (
                          <>
                            <Text className="message-text">{msg.text || msg.content}</Text>
                            {msg.text?.includes('http') && msg.text?.includes('envato') && (
                              <a href={msg.text} target="_blank" rel="noopener noreferrer">
                                {msg.text}
                              </a>
                            )}
                          </>
                        ) : null}
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
                  <Text type="secondary">No messages to display</Text>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <motion.div
              className="input-area"
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', stiffness: 100 }}
            >
              <Space.Compact className="input-compact">
                <Button icon={<SmileOutlined />} type="text" />
                <Button icon={<PaperClipOutlined />} type="text" />
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
          className="right-sidebar"
          initial={{ x: 300 }}
          animate={{ x: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <div className="user-profile">
            <Avatar src={selectedUser?.profilePicture} icon={<UserOutlined />} size={80} />
            <Title level={4}>{selectedUser ? selectedUser.username : chatRooms.find((room) => room._id === selectedRoomId)?.name || 'Group Chat'}</Title>
            <Text type="secondary">
              {selectedUser
                ? onlineUsers.includes(selectedUser.id)
                  ? 'Active Now'
                  : `Last Seen ${new Date(selectedUser.lastSeen || Date.now()).toLocaleString()}`
                : 'Group Chat'}
            </Text>
          </div>
          <div className="shared-media">
            <Text strong>Shared Media</Text>
            <Space>
              <div className="media-preview" style={{ backgroundImage: 'url(https://example.com/media1.jpg)' }} />
              <div className="media-preview" style={{ backgroundImage: 'url(https://example.com/media2.jpg)' }} />
              <div className="media-preview" style={{ backgroundImage: 'url(https://example.com/media3.jpg)' }} />
            </Space>
          </div>
          <div className="customize-section">
            <Text strong>Customize</Text>
            <div className="customize-option">
              <Text>Change Theme</Text>
              <Space>
                <motion.div
                  className="theme-circle blue"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => handleBackgroundChange('#1890ff')}
                />
                <motion.div
                  className="theme-circle green"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => handleBackgroundChange('#52c41a')}
                />
                <motion.div
                  className="theme-circle red"
                  whileHover={{ scale: 1.2 }}
                  onClick={() => handleBackgroundChange('#ff4d4f')}
                />
              </Space>
            </div>
            <div className="customize-option">
              <Text>Change Background</Text>
              <Space>
                <motion.div
                  className="background-option"
                  style={{ backgroundImage: 'url(https://example.com/background1.jpg)' }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleBackgroundChange('url(https://example.com/background1.jpg)')}
                />
                <motion.div
                  className="background-option"
                  style={{ backgroundImage: 'url(https://example.com/background2.jpg)' }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleBackgroundChange('url(https://example.com/background2.jpg)')}
                />
                <motion.div
                  className="background-option"
                  style={{ backgroundImage: 'url(https://example.com/background3.jpg)' }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleBackgroundChange('url(https://example.com/background3.jpg)')}
                />
              </Space>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChatPage;
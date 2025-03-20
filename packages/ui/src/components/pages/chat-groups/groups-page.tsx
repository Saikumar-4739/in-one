import React, { useState, useEffect } from 'react';
import { CreateChatRoomModel, CreateMessageModel, ChatRoomIdRequestModel } from '@in-one/shared-models';
import { Button, Input, Typography, Space, Card, message, Select, List, Modal } from 'antd';
import { SendOutlined, PlusOutlined } from '@ant-design/icons';
import { ChatHelpService } from '@in-one/shared-services';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const GroupsPage: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const chatService = new ChatHelpService();

  useEffect(() => {
    if (userId) {
      fetchChatRooms();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedRoomId && userId) {
      fetchMessages();
    }
  }, [selectedRoomId]);

  const fetchChatRooms = async () => {
    try {
      const reqModel = { userId: userId! };
      const response = await chatService.getChatRooms(reqModel);
      if (response.status === true) {
        setChatRooms(response.data);
      } else {
        message.error('Failed to fetch chat rooms');
      }
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      message.error('An error occurred while fetching chat rooms');
    }
  };

  const fetchMessages = async () => {
    try {
      const reqModel: ChatRoomIdRequestModel = { chatRoomId: selectedRoomId! };
      const response = await chatService.getMessages(reqModel);
      if (response.status === true) {
        setMessages(response.data || []);
      } else {
        message.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      message.error('An error occurred while fetching messages');
    }
  };

  const handleCreateRoom = async () => {
    if (!userId) return;
    const reqModel: CreateChatRoomModel = {
      creatorId: userId,
      name: `Group ${chatRooms.length + 1}`, // Simple default name
      participants: [userId], // Add more logic for participants if needed
    };
    try {
      const response = await chatService.createChatRoom(reqModel);
      if (response.status === true) {
        fetchChatRooms();
        setIsCreateModalVisible(false);
        message.success('Chat room created successfully');
      } else {
        message.error(response.internalMessage || 'Failed to create chat room');
      }
    } catch (error) {
      console.error('Error creating chat room:', error);
      message.error('An error occurred while creating the chat room');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoomId || !userId) {
      message.warning('Please select a room and enter a message');
      return;
    }
    const reqModel: CreateMessageModel = {
      chatRoomId: selectedRoomId,
      senderId: userId,
      content: messageInput,
    };
    try {
      const response = await chatService.sendMessage(reqModel);
      if (response.status === true) {
        setMessages((prev) => [...prev, { senderId: userId, content: messageInput, timestamp: new Date() }]);
        setMessageInput('');
      } else {
        message.error(response.internalMessage || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('An error occurred while sending the message');
    }
  };

  if (!userId) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f0f2f5',
        }}
      >
        <Title level={3}>Please log in to view groups</Title>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        padding: '20px',
        backgroundColor: '#fff',
        overflow: 'auto',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '20px' }}>
        {/* Chat Rooms List */}
        <Card
          title="Groups"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalVisible(true)}>
              New Group
            </Button>
          }
          style={{ width: '300px', height: 'calc(100vh - 40px)', overflowY: 'auto' }}
        >
          <Select
            style={{ width: '100%' }}
            placeholder="Select a group to chat"
            onChange={(value: string) => setSelectedRoomId(value)}
            value={selectedRoomId}
          >
            {chatRooms.map((room) => (
              <Option key={room.chatRoomId} value={room.chatRoomId}>
                {room.name || room.chatRoomId}
              </Option>
            ))}
          </Select>
        </Card>

        {/* Chat Area */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Title level={2} style={{ margin: 0 }}>
            Group Chat
          </Title>
          <Card
            style={{
              flexGrow: 1,
              marginTop: '10px',
              overflowY: 'auto',
              backgroundColor: '#fff',
              borderRadius: '8px',
            }}
          >
            {selectedRoomId ? (
              messages.length > 0 ? (
                messages.map((msg, index) => (
                  <Card
                    key={index}
                    size="small"
                    style={{
                      backgroundColor: msg.senderId === userId ? '#e6f7ff' : '#f6ffed',
                      marginBottom: '10px',
                      borderRadius: '8px',
                    }}
                  >
                    <Text strong>{msg.senderId === userId ? 'You' : msg.senderId}:</Text> <Text>{msg.content}</Text>
                  </Card>
                ))
              ) : (
                <Text type="secondary">No messages yet. Start chatting!</Text>
              )
            ) : (
              <Text type="secondary">Select a group to start chatting</Text>
            )}
          </Card>
          <Space style={{ marginTop: '10px' }}>
            <TextArea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ width: '500px' }}
              disabled={!selectedRoomId}
              onPressEnter={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!selectedRoomId}
            >
              Send
            </Button>
          </Space>
        </div>
      </div>

      {/* Create Chat Room Modal */}
      <Modal
        title="Create New Group"
        visible={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={handleCreateRoom}
      >
        <Text>Create a new group chat (default name applied)</Text>
      </Modal>
    </div>
  );
};

export default GroupsPage;
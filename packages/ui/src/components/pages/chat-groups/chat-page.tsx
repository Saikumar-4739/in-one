import React, { useState, useEffect } from 'react';
import { CreateMessageModel, PrivateMessegeModel, CallModel, EndCallModel } from '@in-one/shared-models';
import { Button, Input, Typography, Space, Card, message, Select, List } from 'antd';
import { SendOutlined, PhoneOutlined, CloseOutlined } from '@ant-design/icons';
import { ChatHelpService } from '@in-one/shared-services';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ChatPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);
  const [callActive, setCallActive] = useState<boolean>(false);
  const chatService = new ChatHelpService();

  useEffect(() => {
    if (userId) {
      fetchUsers();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedUserId && userId) {
      fetchMessages();
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const response = await chatService.getAllUsers();
      if (response.status === true) {
        setUsers(response.data.filter((u: any) => u.userId !== userId)); // Exclude current user
      } else {
        message.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('An error occurred while fetching users');
    }
  };

  const fetchMessages = async () => {
    try {
      const reqModel: PrivateMessegeModel = {
        senderId: userId!, receiverId: selectedUserId!,
        text: ''
      };
      const response = await chatService.sendPrivateMessage(reqModel); // Assuming this fetches messages too
      if (response.status === true) {
        setMessages(response.data.messages || []);
      } else {
        message.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      message.error('An error occurred while fetching messages');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId || !userId) {
      message.warning('Please select a user and enter a message');
      return;
    }
    const reqModel: PrivateMessegeModel = {
      senderId: userId,
      receiverId: selectedUserId,
      content: messageInput,
    };
    try {
      const response = await chatService.sendPrivateMessage(reqModel);
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

  const handleStartCall = async () => {
    if (!selectedUserId || !userId) {
      message.warning('Please select a user to call');
      return;
    }
    const callModel: CallModel = {
      callerId: userId, receiverId: selectedUserId,
      callType: 'audio'
    };
    try {
      const response = await chatService.startCall(callModel);
      if (response.status === true) {
        setCallActive(true);
        message.success('Call started');
      } else {
        message.error(response.internalMessage || 'Failed to start call');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      message.error('An error occurred while starting the call');
    }
  };

  const handleEndCall = async () => {
    if (!selectedUserId || !userId) return;
    const endCallModel: EndCallModel = { callerId: userId, receiverId: selectedUserId };
    try {
      const response = await chatService.endCall(endCallModel);
      if (response.status === true) {
        setCallActive(false);
        message.success('Call ended');
      } else {
        message.error(response.internalMessage || 'Failed to end call');
      }
    } catch (error) {
      console.error('Error ending call:', error);
      message.error('An error occurred while ending the call');
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
          backgroundColor: '#fff',
        }}
      >
        <Title level={3}>Please log in to use the chat</Title>
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
        {/* User List */}
        <Card
          title="Users"
          style={{ width: '300px', height: 'calc(100vh - 40px)', overflowY: 'auto' }}
        >
          <Select
            style={{ width: '100%' }}
            placeholder="Select a user to chat"
            onChange={(value: string) => setSelectedUserId(value)}
            value={selectedUserId}
          >
            {users.map((user) => (
              <Option key={user.userId} value={user.userId}>
                {user.name || user.userId}
              </Option>
            ))}
          </Select>
        </Card>

        {/* Chat Area */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Title level={2} style={{ margin: 0 }}>
            Chat
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
            {selectedUserId ? (
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
                    <Text strong>{msg.senderId === userId ? 'You' : 'Them'}:</Text> <Text>{msg.content}</Text>
                  </Card>
                ))
              ) : (
                <Text type="secondary">No messages yet. Start chatting!</Text>
              )
            ) : (
              <Text type="secondary">Select a user to start chatting</Text>
            )}
          </Card>
          <Space style={{ marginTop: '10px' }}>
            <TextArea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ width: '500px' }}
              disabled={!selectedUserId}
              onPressEnter={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!selectedUserId}
            >
              Send
            </Button>
            <Button
              type="default"
              icon={<PhoneOutlined />}
              onClick={handleStartCall}
              disabled={!selectedUserId || callActive}
            >
              Call
            </Button>
            {callActive && (
              <Button
                type="default"
                icon={<CloseOutlined />}
                onClick={handleEndCall}
                danger
              >
                End Call
              </Button>
            )}
          </Space>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
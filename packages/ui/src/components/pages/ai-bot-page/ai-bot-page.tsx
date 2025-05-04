import { useState } from 'react';
import axios from 'axios';
import { Input, Button, List, Modal, Avatar, Typography } from 'antd';
import { SendOutlined, PaperClipOutlined, SmileOutlined, UserOutlined } from '@ant-design/icons';

// Types
interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

// Component
const Chatbot: React.FC = () => {
  // State Management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState<boolean>(false);

  // API Logic: Fetch response from Cohere AI
  const fetchCohereResponse = async (message: string) => {
    setLoading(true);
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    try {
      const response = await axios.post(
        'https://api.cohere.ai/generate',
        {
          prompt: message,
          model: 'command-r-08-2024',
          max_tokens: 100,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer kX1iQyOb1gSrUqwIY4grCn3v4hPSCQrqg9qiXz7F`,
            'Content-Type': 'application/json',
          },
        }
      );

      const botMessage = response.data?.text || "Sorry, I couldn't process your request.";
      setMessages((prev) => [...prev, { sender: 'Bot', text: botMessage, timestamp }]);
    } catch (error) {
      console.error('Error fetching Cohere response:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'Bot', text: "Sorry, I couldn't process your request.", timestamp },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Event Handlers
  const handleMessageSubmit = () => {
    if (!input.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { sender: 'You', text: input, timestamp }]);
    fetchCohereResponse(input);
    setInput('');
  };

  const handleProfileClick = () => {
    setIsProfileModalVisible(true);
  };

  // UI Rendering
  return (
    <div className="chatbot-container">
      {/* Header Section */}
      <div className="chatbot-header">
        <Typography.Text strong>One BoT</Typography.Text>
      </div>

      {/* Messages Section */}
      <List
        dataSource={messages}
        renderItem={(item, index) => (
          <List.Item
            key={index}
            style={{
              display: 'flex',
              justifyContent: item.sender === 'You' ? 'flex-end' : 'flex-start',
              padding: '8px 16px',
            }}
          >
            <div
              style={{
                maxWidth: '60%',
                padding: '8px 12px',
                borderRadius: '12px',
                backgroundColor: item.sender === 'You' ? '#e6f0ff' : '#f0f0f0',
                color: '#000',
              }}
            >
              <Typography.Text>{item.text}</Typography.Text>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                {item.timestamp}
              </div>
            </div>
          </List.Item>
        )}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#ffffff',
        }}
      />

      {/* Input Section */}
      <div className="input-container">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleMessageSubmit}
          placeholder="Enter Message..."
          style={{
            flex: 1,
            borderRadius: '20px',
            border: '1px solid #d9d9d9',
            padding: '8px 16px',
          }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleMessageSubmit}
          loading={loading}
          style={{
            borderRadius: '50%',
            backgroundColor: '#8a2be2',
            borderColor: '#8a2be2',
            marginLeft: '8px',
          }}
        />
      </div>

      {/* Profile Modal */}
      <Modal
        open={isProfileModalVisible}
        title="Grok AI Profile"
        onCancel={() => setIsProfileModalVisible(false)}
        footer={null}
        style={{ top: '20px', right: '20px', width: '300px' }}
      >
        <div style={{ textAlign: 'center' }}>
          <Avatar size={80} icon={<UserOutlined />} />
          <Typography.Text strong style={{ marginTop: '8px' }}>
            Grok AI
          </Typography.Text>
          <Typography.Text type="secondary">
            Created by xAI
          </Typography.Text>
          <Typography.Text style={{ marginTop: '8px' }}>
            I'm here to help answer your questions and provide assistance.
          </Typography.Text>
        </div>
      </Modal>

      {/* Styles */}
      <style>
        {`
          .chatbot-container {
            display: flex;
            flex-direction: column;
            height: 90vh;
            width: 100%;
            background-color: #ffffff;
          }
          .chatbot-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #e8e8e8;
            background-color: #ffffff;
          }
          .input-container {
            display: flex;
            align-items: center;
            padding: 16px;
            border-top: 1px solid #e8e8e8;
            background-color: #ffffff;
          }
        `}
      </style>
    </div>
  );
};

export default Chatbot;
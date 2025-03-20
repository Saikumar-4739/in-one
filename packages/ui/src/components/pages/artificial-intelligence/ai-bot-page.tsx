import React, { useState } from 'react';
import { Button, Input, Typography, Space, Card, message } from 'antd';
import { SendOutlined, RobotOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const AIBotPage: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [conversation, setConversation] = useState<{ question: string; answer: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userId] = useState<string | null>(() => localStorage.getItem('userId') || null);

  // Simulated AI response function (replace with actual API call)
  const getAIResponse = async (query: string): Promise<string> => {
    setLoading(true);
    try {
      // Mock response (replace with real API integration)
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      return `I'm In-One AI, created by xAI. Here's a simulated answer to your question: "${query}". In a real setup, I'd fetch data or reason through this for you! How can I assist further?`;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      message.error('Failed to get a response from the AI');
      return 'Sorry, something went wrong. Try again!';
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      message.warning('Please enter a question');
      return;
    }
    if (!userId) {
      message.error('Please log in to use the AI Bot');
      return;
    }

    const answer = await getAIResponse(question);
    setConversation((prev) => [...prev, { question, answer }]);
    setQuestion(''); // Clear input
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        padding: '20px',
        backgroundColor: '#fff',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', flexGrow: 1 }}>
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Title level={2} style={{ margin: 0 }}>
            <RobotOutlined /> AI Bot (Powered by xAI)
          </Title>
        </div>

        {/* Conversation Display */}
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            minHeight: '300px',
          }}
        >
          {conversation.length === 0 ? (
            <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
              Ask me anything! I’m here to help, just like Grok from xAI.
            </Text>
          ) : (
            conversation.map((chat, index) => (
              <Space
                key={index}
                direction="vertical"
                style={{ width: '100%', marginBottom: '20px' }}
              >
                <Card
                  size="small"
                  style={{ backgroundColor: '#e6f7ff', borderRadius: '8px' }}
                >
                  <Text strong>You:</Text> <Text>{chat.question}</Text>
                </Card>
                <Card
                  size="small"
                  style={{ backgroundColor: '#f6ffed', borderRadius: '8px' }}
                >
                  <Text strong>In-One AI:</Text> <Text>{chat.answer}</Text>
                </Card>
              </Space>
            ))
          )}
          {loading && (
            <Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
              Thinking...
            </Text>
          )}
        </div>

        {/* Question Input */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            backgroundColor: '#fff',
            padding: '10px',
          }}
        >
          <TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={loading || !userId}
            style={{ flexGrow: 1 }}
            onPressEnter={(e) => {
              e.preventDefault();
              handleAskQuestion();
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAskQuestion}
            loading={loading}
            disabled={!userId}
          >
            Ask
          </Button>
        </div>

        {/* Login Prompt */}
        {!userId && (
          <Text type="warning" style={{ textAlign: 'center', marginTop: '10px' }}>
            Please log in to interact with the AI Bot.
          </Text>
        )}
      </div>
    </div>
  );
};

export default AIBotPage;
import { useState } from 'react';
import axios from 'axios';
import { Input, Button, List } from 'antd';

const Chatbot = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCohereResponse = async (message: string) => {
    setLoading(true);
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

      if (response.data && response.data.text) {
        setMessages((prev) => [...prev, `Bot: ${response.data.text}`]);
      } else {
        setMessages((prev) => [
          ...prev,
          "Bot: Sorry, I couldn't process your request.",
        ]);
      }
    } catch (error) {
      console.error('Error fetching Cohere response:', error);
      setMessages((prev) => [
        ...prev,
        "Bot: Sorry, I couldn't process your request.",
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageSubmit = () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, `You: ${input}`]);
      fetchCohereResponse(input);
      setInput('');
    }
  };

  return (
    <div
      className="chatbot-container"
      style={{
        width: '500px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <List
        dataSource={messages}
        renderItem={(item, index) => (
          <List.Item key={index} className="message-item">
            <div>{item}</div>
          </List.Item>
        )}
        className="messages-list"
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '10px',
          minHeight: '50%',
        }}
      />

      <div
        className="input-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px',
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleMessageSubmit}
          placeholder="Type a message..."
          className="input-field"
          style={{ width: '80%' }}
        />

        <Button
          type="primary"
          onClick={handleMessageSubmit}
          className="send-button"
          loading={loading}
          style={{
            width: '15%',
            height: '100%',
            backgroundColor: '#003049', 
            color: 'white', 
            borderColor: '#003049', 
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default Chatbot;
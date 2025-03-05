// ChatPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import './chat-page.css';
import { 
  CreateMessageModel, 
  ChatRoomIdRequestModel, 
  UserIdRequestModel,
  PrivateMessegeModel 
} from '@in-one/shared-models';
import { ChatHelpService } from '@in-one/shared-services';

interface User {
  id: string;
  name: string;
  status: string;
}

interface ChatRoom {
  id: string;
  name: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

const ChatPage: React.FC = () => {
  const chatService = new ChatHelpService();
  const wsSubject = useRef<WebSocketSubject<any> | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const currentUserId = 'user123'; // Should come from auth context

  useEffect(() => {
    initializeWebSocket();
    loadInitialData();

    return () => {
      wsSubject.current?.complete();
    };
  }, []);

  const initializeWebSocket = () => {
    wsSubject.current = webSocket('ws://your-websocket-url/chat');
    
    wsSubject.current.subscribe({
      next: handleWebSocketMessage,
      error: (err) => console.error('WebSocket error:', err),
      complete: () => console.log('WebSocket connection closed')
    });
  };

  const loadInitialData = async () => {
    try {
      const chatRoomsResponse = await chatService.getChatRooms({ userId: currentUserId });
      setChatRooms(chatRoomsResponse.data);

      const usersResponse = await chatService.getAllUsers();
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const selectChatRoom = async (chatRoomId: string) => {
    setSelectedChatRoomId(chatRoomId);
    await loadMessages(chatRoomId);
  };

  const loadMessages = async (chatRoomId: string) => {
    try {
      const response = await chatService.getMessages({ chatRoomId });
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput || !selectedChatRoomId) return;

    const message: CreateMessageModel = {
      chatRoomId: selectedChatRoomId,
      text: messageInput,
    };

    try {
      await chatService.sendMessage(message);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendPrivateMessage = async (receiverId: string) => {
    if (!messageInput) return;

    const privateMessage: PrivateMessegeModel = {
      senderId: currentUserId,
      receiverId,
      text: messageInput,
    };

    try {
      await chatService.sendPrivateMessage(privateMessage);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending private message:', error);
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'NEW_MESSAGE':
        if (message.chatRoomId === selectedChatRoomId) {
          setMessages(prev => [...prev, message.data]);
        }
        break;
      case 'USER_STATUS':
        setUsers(prev => prev.map(user => 
          user.id === message.data.userId ? { ...user, status: message.data.status } : user
        ));
        break;
      case 'NEW_CHAT_ROOM':
        setChatRooms(prev => [...prev, message.data]);
        break;
      default:
        console.log('Unhandled WebSocket message:', message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="chat-rooms">
          <h3>Chat Rooms</h3>
          <ul>
            {chatRooms.map(room => (
              <li 
                key={room.id}
                className={room.id === selectedChatRoomId ? 'active' : ''}
                onClick={() => selectChatRoom(room.id)}
              >
                {room.name}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="users-list">
          <h3>Users</h3>
          <ul>
            {users.map(user => (
              <li key={user.id}>
                <span className={user.status === 'online' ? 'online' : ''}>
                  {user.name}
                </span>
                <button onClick={() => sendPrivateMessage(user.id)}>Message</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedChatRoomId && (
        <div className="chat-area">
          <div className="messages">
            {messages.map(message => (
              <div key={message.id} className="message">
                <span className="sender">{message.senderId}</span>
                <span className="content">{message.content}</span>
                <span className="timestamp">
                  {new Date(message.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="message-input">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
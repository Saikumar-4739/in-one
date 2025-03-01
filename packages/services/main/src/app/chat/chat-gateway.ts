import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';
import { CreateMessageModel } from '@in-one/shared-models';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>(); // Stores (userId -> socketId)
  private logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {
    this.logger.log('✅ WebSocket Gateway Initialized');
  }

  /**
   * When a client connects, store the user in activeUsers
   */
  async handleConnection(socket: Socket) {
    try {
      const userId = socket.handshake.query.userId as string;
      this.logger.log(`🔗 New client connected: ${socket.id}, userId: ${userId}`);
      
      if (userId) {
        this.activeUsers.set(userId, socket.id);
        this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
        this.logger.log(`🟢 User connected: ${userId} | Total active users: ${this.activeUsers.size}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error in handleConnection: ${error}`);
    }
  }

  /**
   * When a client disconnects, remove the user from activeUsers
   */
  async handleDisconnect(socket: Socket) {
    try {
      const userId = [...this.activeUsers.entries()].find(([, id]) => id === socket.id)?.[0];

      if (userId) {
        this.activeUsers.delete(userId);
        this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
        this.logger.log(`🔴 User disconnected: ${userId} | Remaining active users: ${this.activeUsers.size}`);
      } else {
        this.logger.log(`⚠️ Unknown socket disconnected: ${socket.id}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error in handleDisconnect: ${error}`);
    }
  }

  /**
   * Send a message to a chat room and broadcast it
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(@MessageBody() data: { senderId: string; receiverId: string; text: string; chatRoomId: string }, @ConnectedSocket() socket: Socket) {
    try {
      this.logger.log(`📩 Received message from userId ${data.senderId} in chatRoomId: ${data.chatRoomId}`);
      
      const newMessage = await this.chatService.createMessage(data);
      this.server.to(data.chatRoomId).emit('newMessage', { success: true, message: newMessage });

      // Emit private message if not a group chat
      if (!data.chatRoomId) {
        this.server.to(data.receiverId).emit('privateMessage', { success: true, message: newMessage });
      }

      return { success: true, message: 'Message sent successfully', data: newMessage };
    } catch (error) {
      this.logger.error(`❌ Error in handleSendMessage: ${error}`);
      return { success: false, message: 'Failed to send message', error: error };
    }
  }

  /**
   * Join a chat room
   */
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() chatRoomId: string, @ConnectedSocket() socket: Socket) {
    try {
      socket.join(chatRoomId);
      this.logger.log(`👥 User joined room: ${chatRoomId}, Socket ID: ${socket.id}`);
      this.server.to(chatRoomId).emit('userJoined', { success: true, userId: socket.id });

      return { success: true, message: `Joined room: ${chatRoomId}` };
    } catch (error) {
      this.logger.error(`❌ Error in handleJoinRoom: ${error}`);
      return { success: false, message: 'Failed to join room', error: error };
    }
  }

  /**
   * Leave a chat room
   */
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@MessageBody() chatRoomId: string, @ConnectedSocket() socket: Socket) {
    try {
      socket.leave(chatRoomId);
      this.logger.log(`🚪 User left room: ${chatRoomId}, Socket ID: ${socket.id}`);
      this.server.to(chatRoomId).emit('userLeft', { success: true, userId: socket.id });

      return { success: true, message: `Left room: ${chatRoomId}` };
    } catch (error) {
      this.logger.error(`❌ Error in handleLeaveRoom: ${error}`);
      return { success: false, message: 'Failed to leave room', error: error };
    }
  }

  /**
   * Retrieve chat history for a chat room
   */
  @SubscribeMessage('getChatHistory')
  async handleGetChatHistory(@MessageBody() chatRoomId: string) {
    try {
      this.logger.log(`📜 Fetching chat history for room: ${chatRoomId}`);

      const messages = await this.chatService.getChatHistory(chatRoomId);
      return { success: true, message: 'Chat history retrieved', data: messages };
    } catch (error) {
      this.logger.error(`❌ Error in handleGetChatHistory: ${error}`);
      return { success: false, message: 'Failed to retrieve chat history', error: error };
    }
  }

  /**
   * Retrieve all online users
   */
  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers() {
    try {
      this.logger.log(`👤 Fetching online users (${this.activeUsers.size} users online)`);
      return { success: true, data: Array.from(this.activeUsers.keys()) };
    } catch (error) {
      this.logger.error(`❌ Error in handleGetOnlineUsers: ${error}`);
      return { success: false, message: 'Failed to retrieve online users', error: error };
    }
  }
}

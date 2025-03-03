import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection,OnGatewayDisconnect} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>(); 
  private logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {
    this.logger.log('✅ WebSocket Gateway Initialized');
  }

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

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@MessageBody() data: { senderId: string; receiverId: string; text: string; chatRoomId: string }, @ConnectedSocket() socket: Socket) {
    try {
      this.logger.log(`📩 Received message from userId ${data.senderId} in chatRoomId: ${data.chatRoomId}`);
      const newMessage = await this.chatService.createMessage(data);
      this.server.to(data.chatRoomId).emit('newMessage', { success: true, message: newMessage });
      if (!data.chatRoomId) {
        this.server.to(data.receiverId).emit('privateMessage', { success: true, message: newMessage });
      }
      return { success: true, message: 'Message sent successfully', data: newMessage };
    } catch (error) {
      this.logger.error(`❌ Error in handleSendMessage: ${error}`);
      return { success: false, message: 'Failed to send message', error: error };
    }
  }

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

  @SubscribeMessage('startCall')
  async handleStartCall(@MessageBody() data: { callerId: string; receiverId: string; callType: 'audio' | 'video' }) {
    try {
      const call = await this.chatService.startCall(data);
      this.server.to(data.receiverId).emit('incomingCall', call);
    } catch (error) {
      console.error('❌ Error starting call:', error);
    }
  }

  @SubscribeMessage('endCall')
  async handleEndCall(@MessageBody() data: { callId: string; status: 'missed' | 'completed' | 'declined' }) {
    try {
      const validStatuses: ['missed', 'completed', 'declined'] = ['missed', 'completed', 'declined'];
      if (!validStatuses.includes(data.status)) {
        throw new HttpException(
          { success: false, message: 'Invalid status' },
          HttpStatus.BAD_REQUEST
        );
      }
      const callResponse = await this.chatService.endCall(data.callId, data.status);
      if (!callResponse.status) {
        throw new HttpException(
          { success: false, message: callResponse.internalMessage },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      this.server.to(callResponse.data.receiverId.toString()).emit('callEnded', callResponse.data);
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw new HttpException(
        { success: false, message: 'Error ending call' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @SubscribeMessage('sendAudioMessage')
  async handleSendAudioMessage(@MessageBody() data: { senderId: string; receiverId: string; chatRoomId: string; audioUrl: string; duration: number }) {
    const audioMessage = await this.chatService.sendAudioMessage(data);
    this.server.to(data.chatRoomId).emit('newAudioMessage', audioMessage);
  }
}


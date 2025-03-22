import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection,OnGatewayDisconnect} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ChatRoomIdRequestModel, EndCallModel, PrivateMessegeModel } from '@in-one/shared-models';

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

  // chat.gateway.ts
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { message: PrivateMessegeModel; chatRoomId?: string; createdAt: string },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      this.logger.log(`📩 Received message from userId ${data.message.senderId}`);
      const response = await this.chatService.sendPrivateMessage(data.message);
      if (response.status && response.data) {
        const newMessage = response.data;
        const chatRoomId = newMessage.chatRoomId;
        // Emit to all clients in the chat room, including the sender
        this.server.to(chatRoomId).emit('privateMessage', { success: true, message: newMessage });
        // Also emit to the sender explicitly if needed
        socket.emit('privateMessage', { success: true, message: newMessage });
        return { success: true, data: newMessage };
      } else {
        throw new Error('Failed to send message');
      }
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
  async handleGetChatHistory(@MessageBody() reqModel: any) {
    try {
      if (typeof reqModel !== 'object' || !reqModel.chatRoomId) {
        throw new Error('Invalid request payload: Expected an object with chatRoomId.');
      }
  
      this.logger.log(`📜 Fetching chat history for room: ${reqModel.chatRoomId}`);
      const messages = await this.chatService.getChatHistory(reqModel.chatRoomId);
  
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
  async handleEndCall(@MessageBody() reqModel: EndCallModel) {
    try {
      const validStatuses: ['missed', 'completed', 'declined'] = ['missed', 'completed', 'declined'];
      if (!validStatuses.includes(reqModel.status)) {
        throw new HttpException(
          { success: false, message: 'Invalid status' },
          HttpStatus.BAD_REQUEST
        );
      }
      const callResponse = await this.chatService.endCall(reqModel);
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

  @SubscribeMessage('sendPrivateMessage')
async handleSendPrivateMessage(
  @MessageBody() data: PrivateMessegeModel,
  @ConnectedSocket() socket: Socket,
) {
  try {
    this.logger.log(`📩 Received private message from userId ${data.senderId} to ${data.receiverId}`);
    
    // Use ChatService to send the private message and get chatRoomId
    const response = await this.chatService.sendPrivateMessage(data);
    if (!response.status || !response.data) {
      throw new Error('Failed to process private message');
    }

    const newMessage = response.data;
    const chatRoomId = newMessage.chatRoomId;

    // Emit to both sender and receiver (using user IDs or chat room)
    this.server.to(data.senderId).to(data.receiverId).emit('privateMessage', {
      success: true,
      message: newMessage,
    });

    // Join the sender to the chat room if not already joined
    socket.join(chatRoomId);

    // Send callback with the message details
    return { success: true, data: newMessage };
  } catch (error) {
    this.logger.error(`❌ Error in handleSendPrivateMessage: ${error}`);
    return { success: false, message: 'Failed to send private message', error: error };
  }
}
}


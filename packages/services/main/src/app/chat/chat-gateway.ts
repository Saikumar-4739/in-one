import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';
import { PrivateMessegeModel } from '@in-one/shared-models';

type RTCSessionDescriptionInit = {
  type?: 'offer' | 'answer' | 'rollback';
  sdp?: string;
};

type RTCIceCandidateInit = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

@WebSocketGateway(3006, { cors: { origin: '*', methods: ['GET', 'POST'] } }) // Explicitly set to port 3006
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>(); // userId -> socketId
  private logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {
    this.logger.log('✅ WebSocket Gateway Initialized on port 3006');
  }

  async handleConnection(socket: Socket) {
    const userId = socket.handshake.query.userId as string;
    if (!userId) {
      this.logger.error('No userId provided, disconnecting');
      socket.disconnect();
      return;
    }
    this.activeUsers.set(userId, socket.id);
    this.logger.log(`User ${userId} connected with socket ${socket.id}`);
    this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
  }

  async handleDisconnect(socket: Socket) {
    const userId = [...this.activeUsers.entries()].find(([, id]) => id === socket.id)?.[0];
    if (userId) {
      this.activeUsers.delete(userId);
      this.logger.log(`User ${userId} disconnected`);
      this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() chatRoomId: string, @ConnectedSocket() socket: Socket) {
    socket.join(chatRoomId);
    this.logger.log(`Socket ${socket.id} joined room ${chatRoomId}`);
    this.server.to(chatRoomId).emit('userJoined', { userId: socket.id });
    return { success: true, message: `Joined room ${chatRoomId}` };
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { message: PrivateMessegeModel; chatRoomId?: string; createdAt: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const response = await this.chatService.sendPrivateMessage(data.message);
      if (!response.status || !response.data) throw new Error('Failed to send private message');

      const newMessage = response.data;
      const chatRoomId = newMessage.chatRoomId || data.chatRoomId || `${data.message.senderId}-${data.message.receiverId}`;

      // Join the room if not already in it
      socket.join(chatRoomId);

      // Emit to all participants in the room
      this.server.to(chatRoomId).emit('privateMessage', { success: true, message: newMessage });

      return { success: true, data: newMessage };
    } catch (error) {
      this.logger.error(`❌ Error in sendMessage: ${error}`);
      return { success: false, message: 'Failed to send message', error };
    }
  }

  @SubscribeMessage('sendGroupMessage')
  async handleSendGroupMessage(
    @MessageBody() data: { chatRoomId: string; senderId: string; text: string; createdAt: string },
    @ConnectedSocket() socket: Socket
  ) {
    try {
      const messageData = { chatRoomId: data.chatRoomId, senderId: data.senderId, text: data.text };
      const response = await this.chatService.createMessage(messageData);
      if (!response || !response._id) throw new Error('Failed to create group message');

      const newMessage = {
        _id: response._id,
        senderId: response.senderId,
        chatRoomId: response.chatRoomId,
        text: response.text,
        createdAt: response.createdAt,
      };

      // Emit to all in the group room
      this.server.to(data.chatRoomId).emit('groupMessage', { success: true, message: newMessage });
      return { success: true, data: newMessage };
    } catch (error) {
      this.logger.error(`❌ Error in sendGroupMessage: ${error}`);
      return { success: false, message: 'Failed to send group message', error };
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers() {
    return { success: true, data: Array.from(this.activeUsers.keys()) };
  }

  @SubscribeMessage('callUser')
  handleCallUser(
    @MessageBody() data: { userToCall: string; signalData: RTCSessionDescriptionInit; from: string; callId: string; callType: string },
    @ConnectedSocket() socket: Socket
  ) {
    const targetSocketId = this.activeUsers.get(data.userToCall);
    this.logger.log(`CallUser: from ${data.from} to ${data.userToCall}, targetSocketId: ${targetSocketId}`);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('callUser', {
        signal: data.signalData,
        from: data.from,
        callId: data.callId,
        callType: data.callType,
        userToCall: data.userToCall, // Added this line to fix the issue
      });
    } else {
      this.logger.warn(`User ${data.userToCall} not found`);
    }
    return { success: true };
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(
    @MessageBody() data: { signal: RTCSessionDescriptionInit; to: string; callId: string },
    @ConnectedSocket() socket: Socket
  ) {
    const targetSocketId = this.activeUsers.get(data.to);
    this.logger.log(`AnswerCall: to ${data.to}, targetSocketId: ${targetSocketId}`);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('callAccepted', data);
    } else {
      this.logger.warn(`User ${data.to} not found`);
    }
    return { success: true };
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @MessageBody() data: { candidate: RTCIceCandidateInit; to: string },
    @ConnectedSocket() socket: Socket
  ) {
    const targetSocketId = this.activeUsers.get(data.to);
    this.logger.log(`IceCandidate: to ${data.to}, targetSocketId: ${targetSocketId}`);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('iceCandidate', {
        candidate: data.candidate,
      });
    } else {
      this.logger.warn(`User ${data.to} not found`);
    }
    return { success: true };
  }

  @SubscribeMessage('endCall')
  handleEndCall(
    @MessageBody() data: { to: string },
    @ConnectedSocket() socket: Socket
  ) {
    const targetSocketId = this.activeUsers.get(data.to);
    this.logger.log(`EndCall: to ${data.to}, targetSocketId: ${targetSocketId}`);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('callEnded');
    } else {
      this.logger.warn(`User ${data.to} not found`);
    }
    return { success: true };
  }
}
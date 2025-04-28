import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { Logger } from '@nestjs/common';
import { CreateMessageModel, MessageResponseModel, PrivateMessegeModel } from '@in-one/shared-models';

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

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://localhost:4200', 'https://localhost:4202']
      : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>();
  private logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(socket: Socket) {
    const userId = socket.handshake.auth.userId as string;
    if (!userId) {
      socket.disconnect();
      return;
    }
    this.activeUsers.set(userId, socket.id);
    this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
  }

  async handleDisconnect(socket: Socket) {
    const userId = [...this.activeUsers.entries()].find(([, id]) => id === socket.id)?.[0];
    if (userId) {
      this.activeUsers.delete(userId);
      this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() chatRoomId: string, @ConnectedSocket() socket: Socket) {
    socket.join(chatRoomId);
    this.server.to(chatRoomId).emit('userJoined', { userId: socket.id });
    return { success: true, message: `Joined room ${chatRoomId}` };
  }

  @SubscribeMessage('sendPrivateMessage')
async handleSendPrivateMessage(@MessageBody() data: { message: PrivateMessegeModel }, @ConnectedSocket() socket: Socket) {
  try {
    const response = await this.chatService.sendPrivateMessage(data.message);
    if (!response.status || !response.data) throw new Error('Failed to send private message');

    const newMessage = response.data;
    const targetSocketId = this.activeUsers.get(newMessage.receiverId);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('privateMessage', newMessage);
      socket.emit('privateMessage', newMessage); // Echo back to sender
    } else {
      this.logger.warn(`User ${newMessage.receiverId} not found`);
    }
    return { success: true, data: newMessage };
  } catch (error) {
    this.logger.error(`❌ Error in sendPrivateMessage: ${error}`);
    return { success: false, message: 'Failed to send private message', error };
  }
}

  @SubscribeMessage('sendGroupMessage')
  async handleSendGroupMessage(@MessageBody() data: CreateMessageModel, @ConnectedSocket() socket: Socket) {
    try {
      const response = await this.chatService.createMessage(data);
      if (!response || !response._id || !response.chatRoomId) {
        throw new Error('Failed to create group message or missing chatRoomId');
      }
  
      const newMessage = new MessageResponseModel(
        response._id,
        response.senderId,
        response.text,
        response.createdAt,
        response.chatRoomId,
        undefined,
        response.emoji,
        response.fileUrl,
        response.fileType,
        response.status
      );
  
      socket.join(newMessage.chatRoomId || ''); // TypeScript now knows chatRoomId is string
      this.server.to(newMessage.chatRoomId || '').emit('groupMessage', newMessage);
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
  handleCallUser(@MessageBody() data: { userToCall: string; signalData: RTCSessionDescriptionInit; from: string; callId: string; callType: string }, @ConnectedSocket() socket: Socket) {
    const targetSocketId = this.activeUsers.get(data.userToCall);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('callUser', {
        signal: data.signalData,
        from: data.from,
        callId: data.callId,
        callType: data.callType,
        userToCall: data.userToCall,
      });
    } else {
      this.logger.warn(`User ${data.userToCall} not found`);
    }
    return { success: true };
  }

  @SubscribeMessage('answerCall')
  handleAnswerCall(@MessageBody() data: { signal: RTCSessionDescriptionInit; to: string; callId: string }, @ConnectedSocket() socket: Socket) {
    const targetSocketId = this.activeUsers.get(data.to);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('callAccepted', data);
    } else {
      this.logger.warn(`User ${data.to} not found`);
    }
    return { success: true };
  }

  @SubscribeMessage('iceCandidate')
  handleIceCandidate(@MessageBody() data: { candidate: RTCIceCandidateInit; to: string }, @ConnectedSocket() socket: Socket) {
    const targetSocketId = this.activeUsers.get(data.to);
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
  handleEndCall(@MessageBody() data: { to: string }, @ConnectedSocket() socket: Socket) {
    const targetSocketId = this.activeUsers.get(data.to);
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('callEnded');
    } else {
      this.logger.warn(`User ${data.to} not found`);
    }
    return { success: true };
  }
}
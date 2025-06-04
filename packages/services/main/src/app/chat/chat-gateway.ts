import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageModel, MessageResponseModel, PrivateMessegeModel, CommonResponse, ErrorResponse } from '@in-one/shared-models';
import { ChatHelperService } from './chat.helper.services';

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

@WebSocketGateway({ cors: { origin: (origin, callback) => { const allowedOrigins = process.env.NODE_ENV === 'production' ? ['https://localhost:4200', 'https://localhost:4202'] : '*'; if (allowedOrigins === '*' || allowedOrigins.includes(origin)) { callback(null, true); } else { callback(new Error('Not allowed by CORS')); } }, methods: ['GET', 'POST'], credentials: true } })
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>();
  private logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatHelperService: ChatHelperService,
  ) { }

  // EVENT: Handle client connection
  async handleConnection(socket: Socket) {
    try {
      const userId = socket.handshake.auth.userId as string;
      if (!userId) {
        throw new ErrorResponse(52001, 'User ID must be provided');
      }

      this.activeUsers.set(userId, socket.id);
      this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
      this.logger.log(`User ${userId} connected with socket ID ${socket.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error}`);
      socket.disconnect();
    }
  }

  // EVENT: Handle client disconnection
  async handleDisconnect(socket: Socket) {
    try {
      const userId = [...this.activeUsers.entries()].find(([, id]) => id === socket.id)?.[0];
      if (userId) {
        this.activeUsers.delete(userId);
        this.server.emit('onlineUsers', Array.from(this.activeUsers.keys()));
        this.logger.log(`User ${userId} disconnected`);
      }
    } catch (error) {
      this.logger.error(`Disconnection error: ${error}`);
    }
  }

  // EVENT: Join a chat room
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() chatRoomId: string, @ConnectedSocket() socket: Socket): Promise<CommonResponse> {
    try {
      if (!chatRoomId) {
        throw new ErrorResponse(52002, 'Chat room ID must be provided');
      }

      socket.join(chatRoomId);
      this.server.to(chatRoomId).emit('userJoined', { userId: socket.id });
      return new CommonResponse(true, 200, `Joined room ${chatRoomId}`);
    } catch (error) {
      throw error instanceof ErrorResponse ? error : new ErrorResponse(52003, 'Failed to join room');
    }
  }

  // EVENT: Send a private message
  @SubscribeMessage('sendPrivateMessage')
  async handleSendPrivateMessage(@MessageBody() data: { message: PrivateMessegeModel }, @ConnectedSocket() socket: Socket): Promise<CommonResponse> {
    try {
      if (!data?.message?.senderId || !data.message.receiverId || !data.message.text) {
        throw new ErrorResponse(52004, 'Sender ID, receiver ID, and text must be provided');
      }

      const response = await this.chatService.sendPrivateMessage(data.message);
      if (!response.status || !response.data) {
        throw new ErrorResponse(52005, 'Failed to send private message');
      }

      const newMessage = response.data as MessageResponseModel;
      // Assert receiverId is a string since we validated it in the input and service
      const receiverId = newMessage.receiverId as string;

      const targetSocketId = this.activeUsers.get(receiverId);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('privateMessage', newMessage);
        socket.emit('privateMessage', newMessage);
      } else {
        this.logger.warn(`User ${receiverId} not found`);
      }

      return new CommonResponse(true, 200, 'Private message sent successfully', newMessage);
    } catch (error) {
      return new CommonResponse(false, 500, 'Messege Sending failed', error)
    }
  }

  // EVENT: Send a group message
  @SubscribeMessage('sendGroupMessage')
  async handleSendGroupMessage(@MessageBody() data: CreateMessageModel, @ConnectedSocket() socket: Socket): Promise<CommonResponse> {
    try {
      if (!data.senderId || !data.text || (!data.chatRoomId && !data.participants?.length)) {
        throw new ErrorResponse(52007, 'Sender ID, text, and either chatRoomId or participants must be provided');
      }

      const response = await this.chatService.createMessage(data);
      if (!response.status || !response.data?._id || !response.data?.chatRoomId) {
        throw new ErrorResponse(52008, 'Failed to create group message');
      }

      const newMessage = response.data as MessageResponseModel;
      // Assert chatRoomId is a string since we validated it above
      const chatRoomId = newMessage.chatRoomId as string;

      socket.join(chatRoomId);
      this.server.to(chatRoomId).emit('groupMessage', newMessage);

      return new CommonResponse(true, 200, 'Group message sent successfully', newMessage);
    } catch (error) {
      return new CommonResponse(false, 500, 'Group Messege Sending failed', error)
    }
  }

  // EVENT: Get online users
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(): CommonResponse {
    try {
      return new CommonResponse(true, 200, 'Online users retrieved successfully', Array.from(this.activeUsers.keys()));
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving online users', error)
    }
  }

  // EVENT: Initiate a call
  @SubscribeMessage('callUser')
  async handleCallUser(@MessageBody() data: { userToCall: string; signalData: RTCSessionDescriptionInit; from: string; callId: string; callType: string }, @ConnectedSocket() socket: Socket): Promise<CommonResponse> {
    try {
      if (!data.userToCall || !data.signalData || !data.from || !data.callId || !data.callType) {
        throw new ErrorResponse(52011, 'User to call, signal data, caller ID, call ID, and call type must be provided');
      }

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

      return new CommonResponse(true, 200, 'Call initiated successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Error initiating call', error)
    }
  }

  // EVENT: Answer a call
  @SubscribeMessage('answerCall')
  async handleAnswerCall(@MessageBody() data: { signal: RTCSessionDescriptionInit; to: string; callId: string }, @ConnectedSocket() socket: Socket): Promise<CommonResponse> {
    try {
      if (!data.signal || !data.to || !data.callId) {
        throw new ErrorResponse(52014, 'Signal data, target user ID, and call ID must be provided');
      }

      const targetSocketId = this.activeUsers.get(data.to);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('callAccepted', data);
      } else {
        this.logger.warn(`User ${data.to} not found`);
        throw new ErrorResponse(52015, `User ${data.to} not found`);
      }

      return new CommonResponse(true, 200, 'Call answered successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Error in answerCall', error)
    }
  }

  // EVENT: Handle ICE candidate
  @SubscribeMessage('iceCandidate')
  async handleIceCandidate(@MessageBody() data: { candidate: RTCIceCandidateInit; to: string }, @ConnectedSocket() socket: Socket): Promise<CommonResponse> {
    try {
      if (!data.candidate || !data.to) {
        throw new ErrorResponse(52017, 'Candidate and target user ID must be provided');
      }

      const targetSocketId = this.activeUsers.get(data.to);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('iceCandidate', { candidate: data.candidate });
      } else {
        this.logger.warn(`User ${data.to} not found`);
        throw new ErrorResponse(52018, `User ${data.to} not found`);
      }

      return new CommonResponse(true, 200, 'ICE candidate sent successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Error in iceCandidate', error)
    }
  }

  // EVENT: End a call
  @SubscribeMessage('endCall')
  async handleEndCall(@MessageBody() data: { to: string }, @ConnectedSocket() socket: Socket): Promise<CommonResponse> {
    try {
      if (!data.to) {
        throw new ErrorResponse(52020, 'Target user ID must be provided');
      }

      const targetSocketId = this.activeUsers.get(data.to);
      if (targetSocketId) {
        this.server.to(targetSocketId).emit('callEnded');
      } else {
        this.logger.warn(`User ${data.to} not found`);
        throw new ErrorResponse(52021, `User ${data.to} not found`);
      }

      return new CommonResponse(true, 200, 'Call ended successfully');
    } catch (error) {
      this.logger.error(`Error in endCall: ${error}`);
      return new CommonResponse(false, 500, 'Error in endCall', error)
    }
  }
}
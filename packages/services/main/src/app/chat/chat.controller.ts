import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  ChatRoomIdRequestModel,
  CommonResponse,
  CreateChatRoomModel,
  CreateMessageModel,
  EditMessageModel,
  MessageResponseModel,
  MessegeIdRequestModel,
  PrivateMessegeModel,
  UserIdRequestModel,
} from '@in-one/shared-models';
import { ExceptionHandler } from '@in-one/shared-models';
import { ApiBody } from '@nestjs/swagger';

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

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sendMessage')
  @ApiBody({ type: CreateMessageModel })
  async sendMessage(@Body() reqModel: CreateMessageModel): Promise<CommonResponse> {
    try {
      const message = await this.chatService.createMessage(reqModel);
      return new CommonResponse(true, 200, 'Message sent successfully', message);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to send message');
    }
  }

  @Post('sendPrivateMessage')
  @ApiBody({ type: PrivateMessegeModel })
  async sendPrivateMessage(@Body() reqModel: PrivateMessegeModel): Promise<CommonResponse> {
    try {
      const message = await this.chatService.sendPrivateMessage(reqModel);
      return message; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to send private message');
    }
  }

  @Post('getAllMessages')
  @ApiBody({ type: ChatRoomIdRequestModel })
  async getMessages(@Body() reqModel: ChatRoomIdRequestModel): Promise<CommonResponse> {
    try {
      const messages = await this.chatService.getChatHistory(reqModel);
      return new CommonResponse(true, 200, 'Chat history retrieved', messages);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat history');
    }
  }

  @Post('getPrivateChatHistory')
  @ApiBody({ schema: { properties: { senderId: { type: 'string' }, receiverId: { type: 'string' } } } })
  async getPrivateChatHistory(@Body() reqModel: { senderId: string; receiverId: string }): Promise<CommonResponse> {
    try {
      const messages = await this.chatService.getPrivateChatHistory(reqModel);
      return new CommonResponse(true, 200, 'Private chat history retrieved', messages);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve private chat history');
    }
  }

  @Post('editMessage')
  @ApiBody({ type: EditMessageModel })
  async editMessage(@Body() reqModel: EditMessageModel): Promise<CommonResponse> {
    try {
      const updatedMessage = await this.chatService.editMessage(reqModel);
      return new CommonResponse(true, 200, 'Message updated successfully', updatedMessage);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to edit message');
    }
  }

  @Post('editPrivateMessage')
  @ApiBody({ type: EditMessageModel })
  async editPrivateMessage(@Body() reqModel: EditMessageModel): Promise<CommonResponse> {
    try {
      const updatedMessage = await this.chatService.editPrivateMessage(reqModel);
      return new CommonResponse(true, 200, 'Private message updated successfully', updatedMessage);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to edit private message');
    }
  }

  @Post('deleteMessage')
  @ApiBody({ type: MessegeIdRequestModel })
  async deleteMessage(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      const result = await this.chatService.deleteMessage(reqModel);
      return result; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to delete message');
    }
  }

  @Post('deletePrivateMessage')
  @ApiBody({ type: MessegeIdRequestModel })
  async deletePrivateMessage(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      const result = await this.chatService.deletePrivateMessage(reqModel);
      return result; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to delete private message');
    }
  }

  @Post('getChatRooms')
  @ApiBody({ type: UserIdRequestModel })
  async getChatRooms(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const chatRooms = await this.chatService.getChatRoomsForUser(reqModel);
      return chatRooms; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat rooms');
    }
  }

  @Post('createChatRoom')
  @ApiBody({ type: CreateChatRoomModel })
  async createChatRoom(@Body() reqModel: CreateChatRoomModel): Promise<CommonResponse> {
    try {
      const chatRoom = await this.chatService.createChatRoom(reqModel);
      return chatRoom; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to create chat room');
    }
  }

  @Post('getAllUsers')
  async getAllUsers(): Promise<CommonResponse> {
    try {
      const users = await this.chatService.getAllUsers();
      return users; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve users');
    }
  }

  @Post('getMessageById')
  @ApiBody({ type: MessegeIdRequestModel })
  async getMessageById(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      const message = await this.chatService.getMessageById(reqModel);
      return message; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve message');
    }
  }

  @Post('getPrivateMessageById')
  @ApiBody({ type: MessegeIdRequestModel })
  async getPrivateMessageById(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      const message = await this.chatService.getPrivateMessageById(reqModel);
      return message; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve private message');
    }
  }

  @Post('initiateCall')
  @ApiBody({ schema: { properties: { callerId: { type: 'string' }, userToCall: { type: 'string' }, signalData: { type: 'object' } } } })
  async initiateCall(@Body() reqModel: { callerId: string; userToCall: string; signalData: RTCSessionDescriptionInit }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.initiateCall(reqModel.callerId, reqModel.userToCall, reqModel.signalData);
      return result; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to initiate call');
    }
  }

  @Post('answerCall')
  @ApiBody({ schema: { properties: { callId: { type: 'string' }, signalData: { type: 'object' }, answererId: { type: 'string' } } } })
  async answerCall(@Body() reqModel: { callId: string; signalData: RTCSessionDescriptionInit; answererId: string }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.answerCall(reqModel.callId, reqModel.signalData, reqModel.answererId);
      return result; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to answer call');
    }
  }

  @Post('iceCandidate')
  @ApiBody({ schema: { properties: { callId: { type: 'string' }, candidate: { type: 'object' }, userId: { type: 'string' } } } })
  async handleIceCandidate(@Body() reqModel: { callId: string; candidate: RTCIceCandidateInit; userId: string }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.handleIceCandidate(reqModel.callId, reqModel.candidate, reqModel.userId);
      return result; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to handle ICE candidate');
    }
  }

  @Post('endCall')
  @ApiBody({ schema: { properties: { callId: { type: 'string' }, userId: { type: 'string' } } } })
  async endCall(@Body() reqModel: { callId: string; userId: string }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.endCall(reqModel.callId, reqModel.userId);
      return result; // Already returns CommonResponse
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to end call');
    }
  }
}
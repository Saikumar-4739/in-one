import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRoomIdRequestModel, CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, MessageResponse, MessegeIdRequestModel, PrivateMessegeModel, returnException, UserIdRequestModel } from '@in-one/shared-models';
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
  constructor(private readonly chatService: ChatService) { }

  @Post('sendMessage')
  @ApiBody({ type: CreateMessageModel })
  async sendMessage(@Body() reqModel: CreateMessageModel): Promise<MessageResponse> {
    try {
      return await this.chatService.createMessage(reqModel);
    } catch (error) {
      return returnException(MessageResponse, error);
    }
  }

  @Post('sendPrivateMessage')
  @ApiBody({ type: PrivateMessegeModel })
  async sendPrivateMessage(@Body() reqModel: PrivateMessegeModel): Promise<CommonResponse> {
    try {
      return await this.chatService.sendPrivateMessage(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getAllMessages')
  @ApiBody({ type: ChatRoomIdRequestModel })
  async getMessages(@Body() reqModel: ChatRoomIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.chatService.getChatHistory(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getPrivateChatHistory')
  @ApiBody({ schema: { properties: { senderId: { type: 'string' }, receiverId: { type: 'string' } } } })
  async getPrivateChatHistory(@Body() reqModel: { senderId: string; receiverId: string }): Promise<CommonResponse> {
    try {
      return await this.chatService.getPrivateChatHistory(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('editMessage')
  @ApiBody({ type: EditMessageModel })
  async editMessage(@Body() reqModel: EditMessageModel): Promise<CommonResponse> {
    try {
      return await this.chatService.editMessage(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('editPrivateMessage')
  @ApiBody({ type: EditMessageModel })
  async editPrivateMessage(@Body() reqModel: EditMessageModel): Promise<CommonResponse> {
    try {
      return await this.chatService.editPrivateMessage(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('deleteMessage')
  @ApiBody({ type: MessegeIdRequestModel })
  async deleteMessage(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.chatService.deleteMessage(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('deletePrivateMessage')
  @ApiBody({ type: MessegeIdRequestModel })
  async deletePrivateMessage(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.chatService.deletePrivateMessage(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getChatRooms')
  @ApiBody({ type: UserIdRequestModel })
  async getChatRooms(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.chatService.getChatRoomsForUser(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('createChatRoom')
  @ApiBody({ type: CreateChatRoomModel })
  async createChatRoom(@Body() reqModel: CreateChatRoomModel): Promise<CommonResponse> {
    try {
      return await this.chatService.createChatRoom(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getAllUsers')
  async getAllUsers(): Promise<CommonResponse> {
    try {
      return await this.chatService.getAllUsers();
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getMessageById')
  @ApiBody({ type: MessegeIdRequestModel })
  async getMessageById(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.chatService.getMessageById(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('getPrivateMessageById')
  @ApiBody({ type: MessegeIdRequestModel })
  async getPrivateMessageById(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.chatService.getPrivateMessageById(reqModel);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('initiateCall')
  @ApiBody({ schema: { properties: { callerId: { type: 'string' }, userToCall: { type: 'string' }, signalData: { type: 'object' } } } })
  async initiateCall(@Body() reqModel: { callerId: string; userToCall: string; signalData: RTCSessionDescriptionInit }): Promise<CommonResponse> {
    try {
      return await this.chatService.initiateCall(reqModel.callerId, reqModel.userToCall, reqModel.signalData);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('answerCall')
  @ApiBody({ schema: { properties: { callId: { type: 'string' }, signalData: { type: 'object' }, answererId: { type: 'string' } } } })
  async answerCall(@Body() reqModel: { callId: string; signalData: RTCSessionDescriptionInit; answererId: string }): Promise<CommonResponse> {
    try {
      return await this.chatService.answerCall(reqModel.callId, reqModel.signalData, reqModel.answererId);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('iceCandidate')
  @ApiBody({ schema: { properties: { callId: { type: 'string' }, candidate: { type: 'object' }, userId: { type: 'string' } } } })
  async handleIceCandidate(@Body() reqModel: { callId: string; candidate: RTCIceCandidateInit; userId: string }): Promise<CommonResponse> {
    try {
      return await this.chatService.handleIceCandidate(reqModel.callId, reqModel.candidate, reqModel.userId);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }

  @Post('endCall')
  @ApiBody({ schema: { properties: { callId: { type: 'string' }, userId: { type: 'string' } } } })
  async endCall(@Body() reqModel: { callId: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.chatService.endCall(reqModel.callId, reqModel.userId);
    } catch (error) {
      return returnException(CommonResponse, error);
    }
  }
}
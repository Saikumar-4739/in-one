import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, EndCallModel, MessageResponseModel, MessegeIdRequestModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models'; // ✅ Import CommonResponse
import { ExceptionHandler } from '@in-one/shared-models';
import { ApiBody } from '@nestjs/swagger';
import { ChatRoomIdRequestModel } from './dto\'s/chat.room.id';


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
  async sendMessage(@Body() reqModel: CreateMessageModel): Promise<CommonResponse> {
    try {
      const message = await this.chatService.createMessage(reqModel);
      return new CommonResponse(true, 200, 'Message sent successfully', message);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to send message');
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

  @Post('deleteMessage')
  @ApiBody({ type: MessegeIdRequestModel })
  async deleteMessage(@Body() reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      await this.chatService.deleteMessage(reqModel);
      return new CommonResponse(true, 200, 'Message deleted successfully');
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to delete message');
    }
  }

  @Post('getChatRooms')
  @ApiBody({ type: UserIdRequestModel })
  async getChatRooms(@Body('userId') reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const chatRooms = await this.chatService.getChatRoomsForUser(reqModel);
      return new CommonResponse(true, 200, 'Chat rooms retrieved successfully', chatRooms);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat rooms');
    }
  }

  @Post('createChatroom')
  @ApiBody({ type: CreateChatRoomModel })
  async createChatRoom(@Body() body: CreateChatRoomModel): Promise<CommonResponse> {
    try {
      const chatRoom = await this.chatService.createChatRoom(body);
      return new CommonResponse(true, 200, 'Chat room created successfully', chatRoom);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to create chat room');
    }
  }

  @Post('getAllUsers')
  async getAllUsers(): Promise<CommonResponse> {
    try {
      const users = await this.chatService.getAllUsers();
      return new CommonResponse(true, 200, 'All users retrieved successfully', users);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve users');
    }
  }

  @Post('privateMessege')
  @ApiBody({ type: PrivateMessegeModel })
  async sendPrivateMessage(@Body() reqModel: PrivateMessegeModel): Promise<CommonResponse> {
    try {
      return await this.chatService.sendPrivateMessage(reqModel);
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error sending private message', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('getChatHistoryByUsers')
  @ApiBody({ type: Object, schema: { properties: { senderId: { type: 'string' }, receiverId: { type: 'string' } } } })
  async getChatHistoryByUsers(@Body() reqModel: { senderId: string; receiverId: string }): Promise<CommonResponse> {
    try {
      const messages = await this.chatService.getChatHistoryByUsers(reqModel);
      return new CommonResponse(true, 200, 'Chat history retrieved', messages);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat history');
    }
  }

  @Post('initiateCall')
  async initiateCall(@Body() body: { callerId: string; userToCall: string; signalData: RTCSessionDescriptionInit }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.initiateCall(body.callerId, body.userToCall, body.signalData);
      return result;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to initiate call');
    }
  }

  @Post('answerCall')
  async answerCall(@Body() body: { callId: string; signalData: RTCSessionDescriptionInit; answererId: string }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.answerCall(body.callId, body.signalData, body.answererId);
      return result;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to answer call');
    }
  }

  @Post('iceCandidate')
  async handleIceCandidate(@Body() body: { callId: string; candidate: RTCIceCandidateInit; userId: string }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.handleIceCandidate(body.callId, body.candidate, body.userId);
      return result;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to handle ICE candidate');
    }
  }

  @Post('endCall')
  async endCall(@Body() body: { callId: string; userId: string }): Promise<CommonResponse> {
    try {
      const result = await this.chatService.endCall(body.callId, body.userId);
      return result;
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to end call');
    }
  }

}

import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, MessageResponseModel } from '@in-one/shared-models'; // ✅ Import CommonResponse
import { ExceptionHandler } from '@in-one/shared-models';
import { ApiBody } from '@nestjs/swagger';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @ApiBody({ type: CreateMessageModel })
  async sendMessage(@Body() body: CreateMessageModel): Promise<CommonResponse> {
    try {
      const message = await this.chatService.createMessage(body);
      return new CommonResponse(true, 200, 'Message sent successfully', message);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to send message');
    }
  }

  @Post('messages')
  @ApiBody({ schema: { properties: { chatRoomId: { type: 'string' } } } })
  async getMessages(@Body('chatRoomId') chatRoomId: string): Promise<CommonResponse> {
    try {
      const messages = await this.chatService.getChatHistory(chatRoomId);
      return new CommonResponse(true, 200, 'Chat history retrieved', messages);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat history');
    }
  }

  @Post('edit-message')
  @ApiBody({ type: EditMessageModel })
  async editMessage(@Body() body: EditMessageModel): Promise<CommonResponse> {
    try {
      const updatedMessage = await this.chatService.editMessage(body);
      return new CommonResponse(true, 200, 'Message updated successfully', updatedMessage);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to edit message');
    }
  }

  @Post('delete-message')
  @ApiBody({ schema: { properties: { messageId: { type: 'string' } } }})
  async deleteMessage(@Body('messageId') messageId: string): Promise<CommonResponse> {
    try {
      await this.chatService.deleteMessage(messageId);
      return new CommonResponse(true, 200, 'Message deleted successfully');
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to delete message');
    }
  }

  @Post('chatrooms')
  @ApiBody({ schema:  { properties: { userId: { type: 'string' } } } })
  async getChatRooms(@Body('userId') userId: string): Promise<CommonResponse> {
    try {
      const chatRooms = await this.chatService.getChatRoomsForUser(userId);
      return new CommonResponse(true, 200, 'Chat rooms retrieved successfully', chatRooms);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat rooms');
    }
  }

  @Post('create-chatroom')
  @ApiBody({ type: CreateChatRoomModel })
  async createChatRoom(@Body() body: CreateChatRoomModel): Promise<CommonResponse> {
    try {
      const chatRoom = await this.chatService.createChatRoom(body);
      return new CommonResponse(true, 200, 'Chat room created successfully', chatRoom);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to create chat room');
    }
  }

  @Post('users')
  @ApiBody({ type: Object })
  async getAllUsers(): Promise<CommonResponse> {
    try {
      const users = await this.chatService.getAllUsers();
      return new CommonResponse(true, 200, 'All users retrieved successfully', users);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve users');
    }
  }

  @Post('private')
  @ApiBody({ schema: { properties: { senderId: { type: 'string' }, receiverId: { type: 'string' },text: { type: 'string' }}}})
  async sendPrivateMessage( @Body('senderId') senderId: string, @Body('receiverId') receiverId: string, @Body('text') text: string): Promise<CommonResponse> {
    try {
      return await this.chatService.sendPrivateMessage(senderId, receiverId, text);
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error sending private message', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('start')
  @ApiBody({ schema: { properties: { senderId: { type: 'string' }, receiverId: { type: 'string' },text: { type: 'string' }}}})
  async startCall(@Body() data: { callerId: string; receiverId: string; callType: 'audio' | 'video' }): Promise<CommonResponse> {
    try {
      return await this.chatService.startCall(data);
    } catch (error) {
      throw new HttpException({ success: false, message: 'Error starting call', error }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('end')
  @ApiBody({ schema: { properties: { senderId: { type: 'string' }, receiverId: { type: 'string' }, text: { type: 'string' }}}})
  async endCall(@Body() data: { callId: string; status: 'missed' | 'completed' | 'declined' }): Promise<CommonResponse> {
    try {
      const call = await this.chatService.endCall(data.callId, data.status);
      if (!call) {
        throw new HttpException({ success: false, message: 'Call not found' }, HttpStatus.NOT_FOUND);
      }
      return call;
    } catch (error) {
      throw new HttpException({ success: false, message: 'Error ending call', error }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

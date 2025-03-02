import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, MessageResponseModel } from '@in-one/shared-models'; // ✅ Import CommonResponse
import { ExceptionHandler } from '@in-one/shared-models'; // ✅ Import ExceptionHandler
import { ApiBody } from '@nestjs/swagger';
import { CallDocument } from './schema/call.schema';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(@Body() body: CreateMessageModel): Promise<CommonResponse<any>> {
    try {
      const message = await this.chatService.createMessage(body);
      return new CommonResponse(true, 200, 'Message sent successfully', message);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to send message');
    }
  }

  @Post('messages')
  async getMessages(@Body('chatRoomId') chatRoomId: string): Promise<CommonResponse<any>> {
    try {
      const messages = await this.chatService.getChatHistory(chatRoomId);
      return new CommonResponse(true, 200, 'Chat history retrieved', messages);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat history');
    }
  }

  @Post('edit-message')
  async editMessage(@Body() body: EditMessageModel): Promise<CommonResponse<any>> {
    try {
      const updatedMessage = await this.chatService.editMessage(body);
      return new CommonResponse(true, 200, 'Message updated successfully', updatedMessage);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to edit message');
    }
  }

  @Post('delete-message')
  async deleteMessage(@Body('messageId') messageId: string): Promise<CommonResponse<null>> {
    try {
      await this.chatService.deleteMessage(messageId);
      return new CommonResponse(true, 200, 'Message deleted successfully');
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to delete message');
    }
  }

  @Post('chatrooms')
  async getChatRooms(@Body('userId') userId: string): Promise<CommonResponse<any>> {
    try {
      const chatRooms = await this.chatService.getChatRoomsForUser(userId);
      return new CommonResponse(true, 200, 'Chat rooms retrieved successfully', chatRooms);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve chat rooms');
    }
  }

  @Post('create-chatroom')
  async createChatRoom(@Body() body: CreateChatRoomModel): Promise<CommonResponse<any>> {
    try {
      const chatRoom = await this.chatService.createChatRoom(body);
      return new CommonResponse(true, 200, 'Chat room created successfully', chatRoom);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to create chat room');
    }
  }

  @Post('users')
  async getAllUsers(): Promise<CommonResponse<any>> {
    try {
      const users = await this.chatService.getAllUsers();
      return new CommonResponse(true, 200, 'All users retrieved successfully', users);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Failed to retrieve users');
    }
  }

  @Post('private')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        senderId: { type: 'string', example: 'user123' },
        receiverId: { type: 'string', example: 'user456' },
        text: { type: 'string', example: 'Hello, how are you?' },
      },
      required: ['senderId', 'receiverId', 'text'],
    },
  })
  async sendPrivateMessage(
    @Body('senderId') senderId: string,
    @Body('receiverId') receiverId: string,
    @Body('text') text: string,
  ): Promise<MessageResponseModel> {
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
  async startCall(@Body() data: { callerId: string; receiverId: string; callType: string }): Promise<CallDocument> {
    try {
      return await this.chatService.startCall(data);
    } catch (error) {
      throw new HttpException({ success: false, message: 'Error starting call', error }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('end')
  async endCall(@Body() data: { callId: string; status: string }): Promise<CallDocument | null> {
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

  @Post('getAllCalls')
  async getAllCalls(): Promise<CallDocument[]> {
    try {
      return await this.chatService.getAllCalls();
    } catch (error) {
      throw new HttpException({ success: false, message: 'Error retrieving calls', error }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

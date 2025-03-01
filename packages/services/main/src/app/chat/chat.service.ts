import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserEntity, UserDocument } from '../authentication/schema/user.schema';
import { ChatRoom, ChatRoomDocument } from './schema/chat-room.schema';
import { MessageEntity, MessageDocument } from './schema/message.schema';
import { ChatRoomResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, MessageResponseModel } from '@in-one/shared-models';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(MessageEntity.name) private messageModel: Model<MessageDocument>,
    @InjectModel(UserEntity.name) private userModel: Model<UserDocument>,
  ) {}

  async createMessage(req: CreateMessageModel): Promise<MessageResponseModel> {
    try {
      const newMessage = await this.messageModel.create(req);
      await this.chatRoomModel.findByIdAndUpdate( req.chatRoomId, { lastMessage: req.text }, { new: true });
      return {
        _id: String(newMessage._id), 
        senderId: String(newMessage.senderId),
        chatRoomId: String(newMessage.chatRoomId),
        text: newMessage.text,
        createdAt: newMessage.createdAt,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error creating message', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  async getChatHistory(chatRoomId: string): Promise<MessageResponseModel[]> {
    try {
      const messages = await this.messageModel.find({ chatRoomId }).populate('senderId').lean(); 
      return messages.map(msg => ({
        _id: msg._id.toString(),
        senderId: msg.senderId.toString(),
        chatRoomId: msg.chatRoomId.toString(),
        text: msg.text,
        createdAt: msg.createdAt, // Ensure createdAt is included
      }));
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error retrieving chat history', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  async editMessage(data: EditMessageModel): Promise<MessageResponseModel> {
    try {
      const updatedMessage = await this.messageModel.findByIdAndUpdate(
        data.messageId,
        { text: data.newText },
        { new: true },
      ).lean(); // ✅ Convert to plain object
  
      if (!updatedMessage) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
  
      return {
        _id: String(updatedMessage._id), // ✅ Explicitly convert _id to string
        senderId: String(updatedMessage.senderId),
        chatRoomId: String(updatedMessage.chatRoomId),
        text: updatedMessage.text,
        createdAt: updatedMessage.createdAt,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error editing message', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      const deletedMessage = await this.messageModel.findByIdAndDelete(messageId);

      if (!deletedMessage) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error deleting message', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all users (excluding passwords)
   */
  async getAllUsers(): Promise<UserEntity[]> {
    try {
      return await this.userModel.find({}, { password: 0 }); // Excluding passwords for security
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error retrieving users', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a single message by ID
   */
  async getMessageById(messageId: string): Promise<MessageResponseModel> {
    try {
      const message = await this.messageModel.findById(messageId).populate('senderId').lean();
  
      if (!message) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
  
      return {
        _id: String(message._id),
        senderId: String(message.senderId),
        chatRoomId: String(message.chatRoomId),
        text: message.text,
        createdAt: message.createdAt,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error retrieving message', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  /**
   * Get all chat rooms for a user
   */
  async getChatRoomsForUser(userId: string): Promise<ChatRoomResponse[]> {
    try {
      const chatRooms = await this.chatRoomModel.find({ participants: userId }).lean(); // ✅ Convert to plain objects
  
      if (!chatRooms.length) {
        throw new HttpException('No chat rooms found', HttpStatus.NOT_FOUND);
      }
  
      return chatRooms.map(room => ({
        _id: String(room._id), // ✅ Convert ObjectId to string
        participants: room.participants.map((p: Types.ObjectId) => String(p)), // ✅ Convert participant IDs to strings
        name: room.name,
        isGroup: room.isGroup,
        lastMessage: room.lastMessage,
      }));
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error retrieving chat rooms', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  /**
   * Create a new chat room
   */
  async createChatRoom(data: CreateChatRoomModel): Promise<ChatRoomResponse> {
    try {
      const newChatRoom = await this.chatRoomModel.create({
        participants: data.participants,
        name: data.name || '',
        isGroup: data.participants.length > 1,
      });
  
      return {
        _id: String(newChatRoom._id),
        participants: newChatRoom.participants.map((p: Types.ObjectId) => String(p)),
        name: newChatRoom.name,
        isGroup: newChatRoom.isGroup,
        lastMessage: newChatRoom.lastMessage,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error creating chat room', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  /**
   * Get all messages for a group chat room
   */
  async getAllMessagesForGroup(chatRoomId: string): Promise<MessageResponseModel[]> {
    try {
      const messages = await this.messageModel
        .find({ chatRoomId })
        .populate('senderId')
        .lean(); // ✅ Convert to plain objects
  
      if (!messages.length) {
        throw new HttpException('No messages found', HttpStatus.NOT_FOUND);
      }
  
      return messages.map(msg => ({
        _id: String(msg._id), // ✅ Convert ObjectId to string
        senderId: String(msg.senderId._id), // ✅ Ensure senderId is string
        chatRoomId: String(msg.chatRoomId),
        text: msg.text,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error retrieving messages for group', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendPrivateMessage(senderId: string, receiverId: string, text: string): Promise<MessageResponseModel> {
    try {
      // Check if a chat room exists for these two users
      let chatRoom = await this.chatRoomModel.findOne({
        isGroup: false,
        participants: { $all: [senderId, receiverId] },
      });
  
      // If no chat room exists, create a new one
      if (!chatRoom) {
        chatRoom = await this.chatRoomModel.create({
          participants: [senderId, receiverId],
          isGroup: false,
          lastMessage: text,
        });
      }
  
      // Create the new message
      const newMessage = await this.messageModel.create({
        senderId,
        receiverId,
        chatRoomId: chatRoom._id,
        text,
      });
  
      // Update the chat room's last message
      await this.chatRoomModel.findByIdAndUpdate(
        chatRoom._id,
        { lastMessage: text },
        { new: true }
      );
  
      return {
        _id: String(newMessage._id),
        senderId: String(newMessage.senderId),
        chatRoomId: String(newMessage.chatRoomId),
        text: newMessage.text,
        createdAt: newMessage.createdAt,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: 'Error sending private message', error: error },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
  
}

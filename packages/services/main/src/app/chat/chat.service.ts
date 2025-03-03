import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../authentication/entities/user.entity';
import { ChatRoomResponse, CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, MessageResponseModel } from '@in-one/shared-models';
import { ChatRoomRepository } from './repository/chatroom.repository';
import { MessegeRepository } from './repository/messege.repository';
import { CallRepository } from './repository/call.repository';
import { AudioRepository } from './repository/audio.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomRepository) private readonly chatRoomRepository: ChatRoomRepository,
    @InjectRepository(MessegeRepository) private readonly messageRepository: MessegeRepository,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CallRepository) private readonly callRepository: CallRepository,
    @InjectRepository(AudioRepository) private readonly audioMessageRepository: AudioRepository,
    private readonly transactionManager: GenericTransactionManager
  ) { }

  async createMessage(req: CreateMessageModel): Promise<MessageResponseModel> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const chatRoomRepo = this.transactionManager.getRepository(this.chatRoomRepository);
      const newMessage = messageRepo.create(req);
      const savedMessage = await messageRepo.save(newMessage);
      await chatRoomRepo.update(req.chatRoomId, { lastMessage: req.text });
      await this.transactionManager.commitTransaction();
      return {
        _id: savedMessage.id,
        senderId: savedMessage.sender.id,
        chatRoomId: savedMessage.chatRoom.id,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      };
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating message:', error);
      throw new HttpException('Error creating message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChatHistory(chatRoomId: string): Promise<MessageResponseModel[]> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const messages = await messageRepo.find({
        where: { chatRoom: { id: chatRoomId } },
        relations: ['sender', 'chatRoom'],
      });
      await this.transactionManager.commitTransaction();
      return messages.map((msg) => ({
        _id: msg.id,
        senderId: msg.sender?.id ?? null,
        chatRoomId: msg.chatRoom?.id ?? null,
        text: msg.text,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error fetching chat history:', error);
      throw new HttpException('Error fetching chat history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editMessage(data: EditMessageModel): Promise<MessageResponseModel> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const updatedMessage = await messageRepo.findOne({ where: { id: data.messageId }, relations: ['sender', 'chatRoom'] });

      if (!updatedMessage) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      updatedMessage.text = data.newText;
      const savedMessage = await messageRepo.save(updatedMessage);
      await this.transactionManager.commitTransaction();
      return {
        _id: savedMessage.id,
        senderId: savedMessage.sender.id,
        chatRoomId: savedMessage.chatRoom.id,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      };
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error editing message:', error);
      throw new HttpException('Error editing message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteMessage(messageId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const deleted = await messageRepo.delete(messageId);
      if (!deleted.affected) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Message deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting message:', error);
      return new CommonResponse(false, 500, 'Error deleting message');
    }
  }

  async getAllUsers(): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const users = await userRepo.find({
        select: ['id', 'username', 'email', 'profilePicture']
      });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Users retrieved successfully', users);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error fetching users:', error);
      return new CommonResponse(false, 500, 'Error fetching users', []);
    }
  }

  async getMessageById(messageId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId },
        relations: ['sender', 'chatRoom'],
      });
      if (!message) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Message not found', null);
      }
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Message retrieved successfully', {
        _id: message.id,
        senderId: message.sender.id,
        chatRoomId: message.chatRoom.id,
        text: message.text,
        createdAt: message.createdAt,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error getting message:', error);
      return new CommonResponse(false, 500, 'Error retrieving message', null);
    }
  }

  async getChatRoomsForUser(userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const chatRooms = await this.chatRoomRepository.find({
        where: { participants: { id: userId } },
        relations: ['participants'],
      });

      if (!chatRooms || chatRooms.length === 0) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'No chat rooms found for user', []);
      }
      const chatRoomResponses = chatRooms.map((room) => ({
        _id: room.id,
        participants: room.participants.map((p) => p.id),
        name: room.name,
        isGroup: room.isGroup,
        lastMessage: room.lastMessage,
      }));
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Chat rooms fetched successfully', chatRoomResponses);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error fetching chat rooms:', error);
      return new CommonResponse(false, 500, 'Error fetching chat rooms', []);
    }
  }

  async createChatRoom(data: CreateChatRoomModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();

    try {
      const participants = await this.userRepository.findByIds(data.participants);
      if (!participants || participants.length === 0) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 400, 'No participants found', null);
      }
      const newChatRoom = this.chatRoomRepository.create({
        participants,
        name: data.name || '',
        isGroup: data.participants.length > 1,
      });
      const savedChatRoom = await this.chatRoomRepository.save(newChatRoom);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Chat room created successfully', {
        _id: savedChatRoom.id,
        participants: savedChatRoom.participants.map((p) => p.id),
        name: savedChatRoom.name,
        isGroup: savedChatRoom.isGroup,
        lastMessage: savedChatRoom.lastMessage,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating chat room:', error);
      return new CommonResponse(false, 500, 'Error creating chat room', null);
    }
  }

  async sendPrivateMessage(senderId: string, receiverId: string, text: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      let chatRoom = await this.chatRoomRepository.findOne({
        where: { isGroup: false, participants: [{ id: senderId }, { id: receiverId }] },
      });
      if (!chatRoom) {
        chatRoom = this.chatRoomRepository.create({
          participants: await this.userRepository.findByIds([senderId, receiverId]),
          isGroup: false,
          lastMessage: text,
        });
        await this.chatRoomRepository.save(chatRoom);
      }
      const newMessage = this.messageRepository.create({
        sender: { id: senderId } as UserEntity,
        receiver: { id: receiverId } as UserEntity,
        chatRoom,
        text,
      });
      const savedMessage = await this.messageRepository.save(newMessage);
      await this.chatRoomRepository.update(chatRoom.id, { lastMessage: text });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Message sent successfully', {
        _id: savedMessage.id,
        senderId: savedMessage.sender.id,
        chatRoomId: savedMessage.chatRoom.id,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error sending private message:', error);
      return new CommonResponse(false, 500, 'Error sending private message', null);
    }
  }
 
  async sendAudioMessage(data: { senderId: string; receiverId: string; chatRoomId: string; audioUrl: string; duration: number }): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newAudioMessage = this.audioMessageRepository.create(data);
      const savedAudioMessage = await this.audioMessageRepository.save(newAudioMessage);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Audio message sent successfully', savedAudioMessage);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error sending audio message:', error);
      return new CommonResponse(false, 500, 'Error sending audio message', null);
    }
  }

  async startCall(data: { callerId: string; receiverId: string; callType: 'audio' | 'video' }): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const newCall = this.callRepository.create({
        ...data, 
        status: 'ongoing', 
      });
      const savedCall = await this.callRepository.save(newCall);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Call started successfully', savedCall);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error starting call:', error);
      return new CommonResponse(false, 500, 'Error starting call', null);
    }
  }
  
  async endCall(callId: string, status: 'missed' | 'completed' | 'declined'): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const validStatuses = ['missed', 'completed', 'declined'] as const;
      if (!validStatuses.includes(status)) {
        throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
      }
      const updatedCall = await this.callRepository.update(callId, { status });
      if (updatedCall.affected === 0) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Call ended successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error ending call:', error);
      return new CommonResponse(false, 500, 'Error ending call', null);
    }
  }
}

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../authentication/entities/user.entity';
import { AudioMessegeModel, CallModel, ChatRoomIdRequestModel, CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, EndCallModel, MessageResponseModel, MessegeIdRequestModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models';
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

  async createMessage(reqModel: CreateMessageModel): Promise<MessageResponseModel> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const chatRoomRepo = this.transactionManager.getRepository(this.chatRoomRepository);
  
      const sender = await this.userRepository.findOne({ where: { id: reqModel.senderId } });
      if (!sender) {
        throw new HttpException('Sender not found', HttpStatus.NOT_FOUND);
      }
  
      const chatRoom = await chatRoomRepo.findOne({ where: { id: reqModel.chatRoomId } });
      if (!chatRoom) {
        throw new HttpException('Chat room not found', HttpStatus.NOT_FOUND);
      }
  
      const newMessage = messageRepo.create({
        sender,
        chatRoom,
        text: reqModel.text,
        createdAt: new Date(),
      });
  
      const savedMessage = await messageRepo.save(newMessage);  
      await chatRoomRepo.update(reqModel.chatRoomId, { lastMessage: reqModel.text });
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
      throw new HttpException(`Error creating message: ${error}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChatHistory(reqModel: ChatRoomIdRequestModel): Promise<MessageResponseModel[]> {
    try {
      const messages = await this.messageRepository.find({
        where: { chatRoom: { id: reqModel.chatRoomId } },
        relations: ['sender', 'chatRoom'],
      });
      return messages.map((msg) => ({
        _id: msg.id,
        senderId: msg.sender?.id ?? null,
        chatRoomId: msg.chatRoom?.id ?? null,
        text: msg.text,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      throw new HttpException('Error fetching chat history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editMessage(reqModel: EditMessageModel): Promise<MessageResponseModel> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const updatedMessage = await messageRepo.findOne({ where: { id: reqModel.messageId }, relations: ['sender', 'chatRoom'] });

      if (!updatedMessage) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      updatedMessage.text = reqModel.newText;
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
      throw new HttpException('Error editing message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteMessage(reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const deleted = await messageRepo.delete(reqModel.messageId);
      if (!deleted.affected) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Message deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error deleting message');
    }
  }

  async getAllUsers(): Promise<CommonResponse> {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'username', 'email', 'profilePicture']
      });
      return new CommonResponse(true, 200, 'Users retrieved successfully', users);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching users', []);
    }
  }

  async getMessageById(reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id: reqModel.messageId },
        relations: ['sender', 'chatRoom'],
      });
      if (!message) {
        return new CommonResponse(false, 404, 'Message not found', null);
      }
      return new CommonResponse(true, 200, 'Message retrieved successfully', {
        _id: message.id,
        senderId: message.sender.id,
        chatRoomId: message.chatRoom.id,
        text: message.text,
        createdAt: message.createdAt,
      });
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving message', null);
    }
  }

  async getChatRoomsForUser(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const chatRooms = await this.chatRoomRepository.find({
        where: { participants: { id: reqModel.userId } },
        relations: ['participants'],
      });
  
      if (!chatRooms || chatRooms.length === 0) {
        return new CommonResponse(false, 404, 'No chat rooms found for user', []);
      }
      const chatRoomResponses = chatRooms.map((room) => ({
        _id: room.id,
        participants: room.participants.map((p) => p.id),
        name: room.name,
        isGroup: room.isGroup,
        lastMessage: room.lastMessage,
      }));
      return new CommonResponse(true, 200, 'Chat rooms fetched successfully', chatRoomResponses);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching chat rooms', []);
    }
  }

  async createChatRoom(reqModel: CreateChatRoomModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();

    try {
      const participants = await this.userRepository.findByIds(reqModel.participants);
      if (!participants || participants.length === 0) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 400, 'No participants found', null);
      }
      const newChatRoom = this.chatRoomRepository.create({
        participants,
        name: reqModel.name || '',
        isGroup: reqModel.participants.length > 1,
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
      return new CommonResponse(false, 500, 'Error creating chat room', null);
    }
  }

  async sendPrivateMessage(reqModel: PrivateMessegeModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      let chatRoom = await this.chatRoomRepository.findOne({
        where: {
          isGroup: false,
          participants: { id: In([reqModel.senderId, reqModel.receiverId]) },
        },
        relations: ['participants'],
      });
  
      if (!chatRoom) {
        chatRoom = this.chatRoomRepository.create({
          participants: await this.userRepository.findByIds([reqModel.senderId, reqModel.receiverId]),
          isGroup: false,
          lastMessage: reqModel.text,
        });
        chatRoom = await this.chatRoomRepository.save(chatRoom); // Ensure saved
      }
  
      const newMessage = this.messageRepository.create({
        sender: { id: reqModel.senderId } as UserEntity,
        receiver: { id: reqModel.receiverId } as UserEntity,
        chatRoom,
        text: reqModel.text,
        createdAt: new Date(),
      });
  
      const savedMessage = await this.messageRepository.save(newMessage);
      await this.chatRoomRepository.update(chatRoom.id, { lastMessage: reqModel.text });
      await this.transactionManager.commitTransaction();
  
      return new CommonResponse(true, 200, 'Message sent successfully', {
        _id: savedMessage.id,
        senderId: savedMessage.sender.id,
        receiverId: savedMessage.receiver?.id,
        chatRoomId: savedMessage.chatRoom.id,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error sending private message', null);
    }
  }

  async sendAudioMessage(reqModel: AudioMessegeModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const chatRoom = await this.chatRoomRepository.findOne({ where: { id: reqModel.chatRoomId } });
      if (!chatRoom) {
        throw new Error('Chat room not found');
      }

      const sender = await this.userRepository.findOne({ where: { id: reqModel.senderId } });
      if (!sender) {
        throw new Error('Sender not found');
      }

      const receiver = await this.userRepository.findOne({ where: { id: reqModel.receiverId } });
      if (!receiver) {
        throw new Error('Receiver not found');
      }

      const newAudioMessage = this.audioMessageRepository.create({
        sender: sender,
        receiver: receiver,
        chatRoom: chatRoom,
        audioUrl: reqModel.audioUrl,
        duration: reqModel.duration,
      });

      const savedAudioMessage = await this.audioMessageRepository.save(newAudioMessage);
      await this.chatRoomRepository.update(reqModel.chatRoomId, { lastMessage: 'Audio Message' });
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Audio message sent successfully', savedAudioMessage);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error sending audio message', null);
    }
  }

  async startCall(reqModel: CallModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const caller = await this.userRepository.findOne({ where: { id: reqModel.callerId } });
      const receiver = await this.userRepository.findOne({ where: { id: reqModel.receiverId } });

      if (!caller || !receiver) {
        throw new HttpException('Caller or receiver not found', HttpStatus.NOT_FOUND);
      }

      const newCall = this.callRepository.create({
        caller: caller,
        receiver: receiver,
        callType: reqModel.callType,
        status: 'ongoing',
      });

      const savedCall = await this.callRepository.save(newCall);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Call started successfully', savedCall);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error starting call', null);
    }
  }

  async endCall(reqModel: EndCallModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const { callId, status } = reqModel; // Extracting callId and status properly

      const validStatuses: ReadonlyArray<string> = ['missed', 'completed', 'declined'];
      if (!validStatuses.includes(status)) {
        throw new HttpException('Invalid status', HttpStatus.BAD_REQUEST);
      }

      const updatedCall = await this.callRepository.update(callId, { status });

      if (!updatedCall || updatedCall.affected === 0) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Call ended successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error ending call', error);
    }
  }

  async getChatHistoryByUsers(reqModel: { senderId: string; receiverId: string }): Promise<MessageResponseModel[]> {
    try {
      const messages = await this.messageRepository.find({
        where: [
          { sender: { id: reqModel.senderId }, receiver: { id: reqModel.receiverId } },
          { sender: { id: reqModel.receiverId }, receiver: { id: reqModel.senderId } },
        ],
        relations: ['sender', 'receiver', 'chatRoom'],
        order: { createdAt: 'ASC' },
      });
      return messages.map((msg) => ({
        _id: msg.id,
        senderId: msg.sender?.id ?? null,
        receiverId: msg.receiver?.id ?? null,
        chatRoomId: msg.chatRoom?.id ?? null,
        text: msg.text,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      throw new HttpException('Error fetching chat history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

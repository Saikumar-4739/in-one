import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { In, Repository, DataSource } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import {
  CommonResponse,
  CreateChatRoomModel,
  CreateMessageModel,
  EditMessageModel,
  MessageResponseModel,
  MessegeIdRequestModel,
  PrivateMessegeModel,
  UserIdRequestModel,
} from '@in-one/shared-models';
import { ChatRoomRepository } from './repository/chatroom.repository';
import { PrivateMessageRepository } from './repository/private-messege.repository';
import { CallRepository } from './repository/call.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { ChatRoomParticipantRepository } from './repository/chat_room_participants.repo';
import { ChatRoomEntity } from './entities/chatroom.entity';
import { ChatRoomParticipantEntity } from './entities/chat.room.participants';
import { MessageEntity } from './entities/messege.entity';
import { CallEntity } from './entities/call.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import { MessegeRepository } from './repository/messege.repository';
import { PrivateMessageEntity } from './entities/private-messege-entity';

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

interface ChatRoomIdRequestModel {
  chatRoomId: string;
}

@Injectable()
export class ChatService {
  private readonly encryptionKey = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') // if ENV key provided, treat as HEX
  : Buffer.from('12345678901234567890123456789012'); // fallback is already plain text

  private readonly ivLength = 16; // AES block size

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ChatRoomRepository)
    private readonly chatRoomRepository: ChatRoomRepository,
    @InjectRepository(MessegeRepository)
    private readonly messageRepository: MessegeRepository,
    @InjectRepository(PrivateMessageRepository)
    private readonly privateMessageRepository: PrivateMessageRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CallRepository)
    private readonly callRepository: CallRepository,
    @InjectRepository(ChatRoomParticipantEntity)
    private readonly participantRepository: ChatRoomParticipantRepository,
  ) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  private decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  async createMessage(reqModel: CreateMessageModel): Promise<MessageResponseModel> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const sender = await this.userRepository.findOne({ where: { id: reqModel.senderId } });
      if (!sender) {
        throw new Error('Sender not found');
      }

      let chatRoom: ChatRoomEntity;
      if (reqModel.chatRoomId) {
        const foundChatRoom = await this.chatRoomRepository.findOne({ where: { id: reqModel.chatRoomId } });
        if (!foundChatRoom) {
          throw new Error('Chat room not found');
        }
        chatRoom = foundChatRoom;
      } else {
        const participantIds = reqModel.participants?.length
          ? [sender.id, ...reqModel.participants]
          : [sender.id];

        const participants = await this.userRepository.find({ where: { id: In(participantIds) } });
        if (participants.length !== participantIds.length) {
          throw new Error('One or more participants not found');
        }

        await transactionManager.startTransaction();

        const newChatRoom = transactionManager.getRepository(ChatRoomEntity).create({
          name: reqModel.groupName || `Group-${Date.now()}`,
          isGroup: participantIds.length > 1,
          lastMessage: reqModel.text,
        });
        chatRoom = await transactionManager.getRepository(ChatRoomEntity).save(newChatRoom);

        const participantEntries = participantIds.map((userId) => ({
          chatRoomId: chatRoom.id,
          userId,
        }));
        await transactionManager.getRepository(ChatRoomParticipantEntity).save(participantEntries);
      }

      if (reqModel.chatRoomId) {
        await transactionManager.startTransaction();
        await transactionManager.getRepository(ChatRoomEntity).update(chatRoom.id, { lastMessage: reqModel.text });
      }

      const newMessage = transactionManager.getRepository(MessageEntity).create({
        senderId: sender.id,
        chatRoomId: chatRoom.id,
        text: reqModel.text,
        createdAt: new Date(),
        status: 'delivered',
      });

      const savedMessage = await transactionManager.getRepository(MessageEntity).save(newMessage);
      await transactionManager.commitTransaction();

      return {
        _id: savedMessage.id,
        senderId: savedMessage.senderId,
        chatRoomId: savedMessage.chatRoomId,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      };
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error creating message';
      throw new HttpException(errorMessage, errorMessage.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getChatHistory(reqModel: ChatRoomIdRequestModel): Promise<MessageResponseModel[]> {
    try {
      const messages = await this.messageRepository.find({
        where: { chatRoomId: reqModel.chatRoomId },
        order: { createdAt: 'ASC' },
      });
      return messages.map((msg) => ({
        _id: msg.id,
        senderId: msg.senderId,
        chatRoomId: msg.chatRoomId,
        text: msg.text,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching chat history';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPrivateChatHistory(reqModel: { senderId: string; receiverId: string }): Promise<MessageResponseModel[]> {
    try {
      const messages = await this.privateMessageRepository.find({
        where: [
          { senderId: reqModel.senderId, receiverId: reqModel.receiverId },
          { senderId: reqModel.receiverId, receiverId: reqModel.senderId },
        ],
        order: { createdAt: 'ASC' },
      });
      return messages.map((msg) => ({
        _id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        text: msg.text ? this.decrypt(msg.text) : null,
        createdAt: msg.createdAt,
        emoji: msg.emoji,
        fileUrl: msg.fileUrl,
        fileType: msg.fileType,
        status: msg.status,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching private chat history';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editMessage(reqModel: EditMessageModel): Promise<MessageResponseModel> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const message = await this.messageRepository.findOne({ where: { id: reqModel.messageId } });
      if (!message) {
        throw new Error('Message not found');
      }

      await transactionManager.startTransaction();

      message.text = reqModel.newText;
      const savedMessage = await transactionManager.getRepository(MessageEntity).save(message);
      await transactionManager.commitTransaction();

      return {
        _id: savedMessage.id,
        senderId: savedMessage.senderId,
        chatRoomId: savedMessage.chatRoomId,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      };
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error editing message';
      throw new HttpException(errorMessage, errorMessage.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editPrivateMessage(reqModel: EditMessageModel): Promise<MessageResponseModel> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const message = await this.privateMessageRepository.findOne({ where: { id: reqModel.messageId } });
      if (!message) {
        throw new Error('Private message not found');
      }

      await transactionManager.startTransaction();

      message.text = this.encrypt(reqModel.newText);
      const savedMessage = await transactionManager.getRepository(PrivateMessageEntity).save(message);
      await transactionManager.commitTransaction();

      return {
        _id: savedMessage.id,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        text: this.decrypt(savedMessage.text),
        createdAt: savedMessage.createdAt,
      };
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error editing private message';
      throw new HttpException(errorMessage, errorMessage.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteMessage(reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const message = await this.messageRepository.findOne({ where: { id: reqModel.messageId } });
      if (!message) {
        throw new Error('Message not found');
      }

      await transactionManager.startTransaction();

      await transactionManager.getRepository(MessageEntity).delete(reqModel.messageId);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Message deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error deleting message';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async deletePrivateMessage(reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const message = await this.privateMessageRepository.findOne({ where: { id: reqModel.messageId } });
      if (!message) {
        throw new Error('Private message not found');
      }

      await transactionManager.startTransaction();

      await transactionManager.getRepository(PrivateMessageEntity).delete(reqModel.messageId);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Private message deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error deleting private message';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async getAllUsers(): Promise<CommonResponse> {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'username', 'email', 'profilePicture'],
      });
      return new CommonResponse(true, 200, 'Users retrieved successfully', users);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching users';
      return new CommonResponse(false, 500, errorMessage, []);
    }
  }

  async getMessageById(reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      const message = await this.messageRepository.findOne({ where: { id: reqModel.messageId } });
      if (!message) {
        return new CommonResponse(false, 404, 'Message not found', null);
      }
      return new CommonResponse(true, 200, 'Message retrieved successfully', {
        _id: message.id,
        senderId: message.senderId,
        chatRoomId: message.chatRoomId,
        text: message.text,
        createdAt: message.createdAt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error retrieving message';
      return new CommonResponse(false, 500, errorMessage, null);
    }
  }

  async getPrivateMessageById(reqModel: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      const message = await this.privateMessageRepository.findOne({ where: { id: reqModel.messageId } });
      if (!message) {
        return new CommonResponse(false, 404, 'Private message not found', null);
      }
      return new CommonResponse(true, 200, 'Private message retrieved successfully', {
        _id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        text: message.text ? this.decrypt(message.text) : null,
        createdAt: message.createdAt,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error retrieving private message';
      return new CommonResponse(false, 500, errorMessage, null);
    }
  }

  async getChatRoomsForUser(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const participants = await this.participantRepository.find({
        where: { userId: reqModel.userId },
      });
      const chatRoomIds = participants.map((p) => p.chatRoomId);
      if (!chatRoomIds.length) {
        return new CommonResponse(false, 404, 'No chat rooms found for user', []);
      }

      const chatRooms = await this.chatRoomRepository.find({
        where: { id: In(chatRoomIds) },
      });

      const chatRoomResponses = await Promise.all(
        chatRooms.map(async (room) => {
          const roomParticipants = await this.participantRepository.find({
            where: { chatRoomId: room.id },
          });
          return {
            _id: room.id,
            participantIds: roomParticipants.map((p) => p.userId),
            name: room.name,
            isGroup: room.isGroup,
            lastMessage: room.lastMessage,
          };
        }),
      );

      return new CommonResponse(true, 200, 'Chat rooms fetched successfully', chatRoomResponses);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error fetching chat rooms';
      return new CommonResponse(false, 500, errorMessage, []);
    }
  }

  async createChatRoom(reqModel: CreateChatRoomModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const participants = await this.userRepository.find({
        where: { id: In(reqModel.participants) },
      });
      if (!participants.length) {
        throw new Error('No participants found');
      }

      await transactionManager.startTransaction();

      const newChatRoom = transactionManager.getRepository(ChatRoomEntity).create({
        name: reqModel.name || '',
        isGroup: reqModel.participants.length > 1,
      });
      const savedChatRoom = await transactionManager.getRepository(ChatRoomEntity).save(newChatRoom);

      const participantEntries = reqModel.participants.map((userId) => ({
        chatRoomId: savedChatRoom.id,
        userId,
      }));
      await transactionManager.getRepository(ChatRoomParticipantEntity).save(participantEntries);

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Chat room created successfully', {
        _id: savedChatRoom.id,
        participantIds: reqModel.participants,
        name: savedChatRoom.name,
        isGroup: savedChatRoom.isGroup,
        lastMessage: savedChatRoom.lastMessage,
      });
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error creating chat room';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 400 : 500,
        errorMessage,
        null
      );
    }
  }

  async sendPrivateMessage(reqModel: PrivateMessegeModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const sender = await this.userRepository.findOne({ where: { id: reqModel.senderId } });
      const receiver = await this.userRepository.findOne({ where: { id: reqModel.receiverId } });
      if (!sender || !receiver) {
        throw new Error('Sender or receiver not found');
      }
  
      await transactionManager.startTransaction();
  
      const newMessage = transactionManager.getRepository(PrivateMessageEntity).create({
        senderId: reqModel.senderId,
        receiverId: reqModel.receiverId,
        text: this.encrypt(reqModel.text),
        createdAt: new Date(),
        status: 'delivered',
      });
  
      const savedMessage = await transactionManager.getRepository(PrivateMessageEntity).save(newMessage);
      await transactionManager.commitTransaction();
  
      return new CommonResponse(
        true,
        200,
        'Private message sent successfully',
        new MessageResponseModel(
          savedMessage.id,
          savedMessage.senderId,
          this.decrypt(savedMessage.text),
          savedMessage.createdAt,
          undefined, // chatRoomId is undefined for private messages
          savedMessage.receiverId,
          savedMessage.emoji,
          savedMessage.fileUrl,
          savedMessage.fileType,
          savedMessage.status
        )
      );
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error sending private message';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
    }
  }

  async initiateCall(callerId: string, userToCall: string, signalData: RTCSessionDescriptionInit): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const caller = await this.userRepository.findOne({ where: { id: callerId } });
      const receiver = await this.userRepository.findOne({ where: { id: userToCall } });
      if (!caller || !receiver) {
        throw new Error('Caller or receiver not found');
      }

      await transactionManager.startTransaction();

      const newCall = transactionManager.getRepository(CallEntity).create({
        callerId,
        receiverId: userToCall,
        callType: 'video',
        status: 'ongoing',
        signalData: JSON.stringify(signalData),
      });

      const savedCall = await transactionManager.getRepository(CallEntity).save(newCall);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call initiated successfully', {
        callId: savedCall.id,
        callerId: savedCall.callerId,
        receiverId: savedCall.receiverId,
        callType: savedCall.callType,
        signalData,
        status: savedCall.status,
      });
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error initiating call';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
    }
  }

  async answerCall(callId: string, signalData: RTCSessionDescriptionInit, answererId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const call = await this.callRepository.findOne({ where: { id: callId } });
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.receiverId !== answererId) {
        throw new Error('Unauthorized to answer this call');
      }

      await transactionManager.startTransaction();

      await transactionManager.getRepository(CallEntity).update(callId, {
        status: 'ongoing',
        answerTime: new Date(),
        signalData: JSON.stringify(signalData),
      });

      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call answered successfully', {
        callId,
        signalData,
        status: 'ongoing',
        answerTime: new Date(),
      });
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error answering call';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') || errorMessage.includes('Unauthorized') ? 400 : 500,
        errorMessage,
        null
      );
    }
  }

  async handleIceCandidate(callId: string, candidate: RTCIceCandidateInit, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const call = await this.callRepository.findOne({ where: { id: callId } });
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.callerId !== userId && call.receiverId !== userId) {
        throw new Error('Unauthorized to modify this call');
      }

      await transactionManager.startTransaction();

      const existingCandidates = call.iceCandidates ? JSON.parse(call.iceCandidates) : [];
      existingCandidates.push(candidate);

      await transactionManager.getRepository(CallEntity).update(callId, {
        iceCandidates: JSON.stringify(existingCandidates),
      });

      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'ICE candidates stored successfully', null);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error storing ICE candidates';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') || errorMessage.includes('Unauthorized') ? 400 : 500,
        errorMessage,
        null
      );
    }
  }

  async endCall(callId: string, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const call = await this.callRepository.findOne({ where: { id: callId } });
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.callerId !== userId && call.receiverId !== userId) {
        throw new Error('Unauthorized to end this call');
      }

      await transactionManager.startTransaction();

      const endTime = new Date();
      const duration = call.answerTime
        ? Math.floor((endTime.getTime() - call.answerTime.getTime()) / 1000)
        : 0;

      await transactionManager.getRepository(CallEntity).update(callId, {
        status: 'completed',
        endTime,
        duration,
      });

      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call ended successfully', {
        callId,
        status: 'completed',
        endTime,
        duration,
      });
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error ending call';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') || errorMessage.includes('Unauthorized') ? 400 : 500,
        errorMessage,
        null
      );
    }
  }
}
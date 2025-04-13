import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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
import { MessegeRepository } from './repository/messege.repository';
import { CallRepository } from './repository/call.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { ChatRoomParticipantRepository } from './repository/chat_room_participants.repo';
import { ChatRoomEntity } from './entities/chatroom.entity';

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
  constructor(
    @InjectRepository(ChatRoomRepository) private readonly chatRoomRepository: ChatRoomRepository,
    @InjectRepository(MessegeRepository) private readonly messageRepository: MessegeRepository,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CallRepository) private readonly callRepository: CallRepository,
    @InjectRepository(ChatRoomParticipantRepository)
    private readonly participantRepository: ChatRoomParticipantRepository,
    private readonly transactionManager: GenericTransactionManager,
  ) { }

  async createMessage(reqModel: CreateMessageModel): Promise<MessageResponseModel> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const chatRoomRepo = this.transactionManager.getRepository(this.chatRoomRepository);
      const participantRepo = this.transactionManager.getRepository(this.participantRepository);

      const sender = await this.userRepository.findOne({ where: { id: reqModel.senderId } });
      if (!sender) {
        throw new HttpException('Sender not found', HttpStatus.NOT_FOUND);
      }

      let chatRoom: ChatRoomEntity;
      if (reqModel.chatRoomId) {
        const foundChatRoom = await chatRoomRepo.findOne({ where: { id: reqModel.chatRoomId } });
        if (!foundChatRoom) {
          throw new HttpException('Chat room not found', HttpStatus.NOT_FOUND);
        }
        chatRoom = foundChatRoom;
      } else {
        // Create a new chat room
        const participantIds = reqModel.participants?.length
          ? [sender.id, ...reqModel.participants]
          : [sender.id];

        const participants = await this.userRepository.find({ where: { id: In(participantIds) } });
        if (participants.length !== participantIds.length) {
          throw new HttpException('One or more participants not found', HttpStatus.NOT_FOUND);
        }

        const newChatRoom = chatRoomRepo.create({
          name: reqModel.groupName || `Group-${Date.now()}`,
          isGroup: participantIds.length > 1,
          lastMessage: reqModel.text,
        });
        chatRoom = await chatRoomRepo.save(newChatRoom);

        // Add participants to chat_room_participants
        const participantEntries = participantIds.map((userId) => ({
          chatRoomId: chatRoom.id,
          userId,
        }));
        await participantRepo.save(participantEntries);
      }

      // Update last message if chat room existed
      if (reqModel.chatRoomId) {
        await chatRoomRepo.update(chatRoom.id, { lastMessage: reqModel.text });
      }

      const newMessage = messageRepo.create({
        senderId: sender.id,
        chatRoomId: chatRoom.id,
        text: reqModel.text,
        createdAt: new Date(),
        status: 'delivered',
      });

      const savedMessage = await messageRepo.save(newMessage);
      await this.transactionManager.commitTransaction();

      return {
        _id: savedMessage.id,
        senderId: savedMessage.senderId,
        chatRoomId: savedMessage.chatRoomId,
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
      throw new HttpException('Error fetching chat history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editMessage(reqModel: EditMessageModel): Promise<MessageResponseModel> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const message = await messageRepo.findOne({ where: { id: reqModel.messageId } });

      if (!message) {
        throw new HttpException('Message not found', HttpStatus.NOT_FOUND);
      }
      message.text = reqModel.newText;
      const savedMessage = await messageRepo.save(message);
      await this.transactionManager.commitTransaction();
      return {
        _id: savedMessage.id,
        senderId: savedMessage.senderId,
        chatRoomId: savedMessage.chatRoomId,
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
        select: ['id', 'username', 'email', 'profilePicture'],
      });
      return new CommonResponse(true, 200, 'Users retrieved successfully', users);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching users', []);
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
      return new CommonResponse(false, 500, 'Error retrieving message', null);
    }
  }

  async getChatRoomsForUser(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      // Find chat rooms where user is a participant
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
      return new CommonResponse(false, 500, 'Error fetching chat rooms', []);
    }
  }

  async createChatRoom(reqModel: CreateChatRoomModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const participantRepo = this.transactionManager.getRepository(this.participantRepository);
      const chatRoomRepo = this.transactionManager.getRepository(this.chatRoomRepository);

      const participants = await this.userRepository.find({
        where: { id: In(reqModel.participants) },
      });
      if (!participants.length) {
        throw new HttpException('No participants found', HttpStatus.BAD_REQUEST);
      }

      const newChatRoom = chatRoomRepo.create({
        name: reqModel.name || '',
        isGroup: reqModel.participants.length > 1,
      });
      const savedChatRoom = await chatRoomRepo.save(newChatRoom);

      // Add participants
      const participantEntries = reqModel.participants.map((userId) => ({
        chatRoomId: savedChatRoom.id,
        userId,
      }));
      await participantRepo.save(participantEntries);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Chat room created successfully', {
        _id: savedChatRoom.id,
        participantIds: reqModel.participants,
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
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const chatRoomRepo = this.transactionManager.getRepository(this.chatRoomRepository);
      const participantRepo = this.transactionManager.getRepository(this.participantRepository);

      const sender = await this.userRepository.findOne({ where: { id: reqModel.senderId } });
      const receiver = await this.userRepository.findOne({ where: { id: reqModel.receiverId } });
      if (!sender || !receiver) {
        throw new HttpException('Sender or receiver not found', HttpStatus.NOT_FOUND);
      }

      // Find private chat room (exactly two participants: sender and receiver)
      const senderRooms = await participantRepo.find({ where: { userId: reqModel.senderId } });
      const receiverRooms = await participantRepo.find({ where: { userId: reqModel.receiverId } });
      const commonRoomIds = senderRooms
        .map((p) => p.chatRoomId)
        .filter((id) => receiverRooms.some((rp) => rp.chatRoomId === id));

      let chatRoom: ChatRoomEntity | null = null;
      for (const roomId of commonRoomIds) {
        const room = await chatRoomRepo.findOne({ where: { id: roomId, isGroup: false } });
        if (room) {
          const participants = await participantRepo.find({ where: { chatRoomId: roomId } });
          if (participants.length === 2) {
            chatRoom = room;
            break;
          }
        }
      }

      if (!chatRoom) {
        chatRoom = chatRoomRepo.create({
          isGroup: false,
          lastMessage: reqModel.text,
        });
        chatRoom = await chatRoomRepo.save(chatRoom);

        await participantRepo.save([
          { chatRoomId: chatRoom.id, userId: reqModel.senderId },
          { chatRoomId: chatRoom.id, userId: reqModel.receiverId },
        ]);
      } else {
        await chatRoomRepo.update(chatRoom.id, { lastMessage: reqModel.text });
      }

      const newMessage = messageRepo.create({
        senderId: reqModel.senderId,
        receiverId: reqModel.receiverId,
        chatRoomId: chatRoom.id,
        text: reqModel.text,
        createdAt: new Date(),
        status: 'delivered',
      });

      const savedMessage = await messageRepo.save(newMessage);
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Private message sent successfully', {
        _id: savedMessage.id,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        chatRoomId: savedMessage.chatRoomId,
        text: savedMessage.text,
        createdAt: savedMessage.createdAt,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, `Error sending private message: ${error}`, null);
    }
  }

  async getChatHistoryByUsers(reqModel: { senderId: string; receiverId: string }): Promise<MessageResponseModel[]> {
    try {
      const messages = await this.messageRepository.find({
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
        chatRoomId: msg.chatRoomId,
        text: msg.text,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      throw new HttpException('Error fetching chat history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async initiateCall(callerId: string, userToCall: string, signalData: RTCSessionDescriptionInit): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const callRepo = this.transactionManager.getRepository(this.callRepository);

      const caller = await this.userRepository.findOne({ where: { id: callerId } });
      const receiver = await this.userRepository.findOne({ where: { id: userToCall } });
      if (!caller || !receiver) {
        throw new HttpException('Caller or receiver not found', HttpStatus.NOT_FOUND);
      }

      const newCall = callRepo.create({
        callerId,
        receiverId: userToCall,
        callType: 'video',
        status: 'ongoing',
        signalData: JSON.stringify(signalData),
      });

      const savedCall = await callRepo.save(newCall);
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call initiated successfully', {
        callId: savedCall.id,
        callerId: savedCall.callerId,
        receiverId: savedCall.receiverId,
        callType: savedCall.callType,
        signalData,
        status: savedCall.status,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error initiating call', null);
    }
  }

  async answerCall(callId: string, signalData: RTCSessionDescriptionInit, answererId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const callRepo = this.transactionManager.getRepository(this.callRepository);
      const call = await callRepo.findOne({ where: { id: callId } });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      if (call.receiverId !== answererId) {
        throw new HttpException('Unauthorized to answer this call', HttpStatus.UNAUTHORIZED);
      }

      const updatedCall = await callRepo.update(callId, {
        status: 'ongoing',
        answerTime: new Date(),
        signalData: JSON.stringify(signalData),
      });

      if (!updatedCall.affected) {
        throw new HttpException('Failed to update call', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call answered successfully', {
        callId,
        signalData,
        status: 'ongoing',
        answerTime: new Date(),
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error answering call', null);
    }
  }

  async handleIceCandidate(callId: string, candidate: RTCIceCandidateInit, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const callRepo = this.transactionManager.getRepository(this.callRepository);
      const call = await callRepo.findOne({ where: { id: callId } });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      if (call.callerId !== userId && call.receiverId !== userId) {
        throw new HttpException('Unauthorized to modify this call', HttpStatus.UNAUTHORIZED);
      }

      const existingCandidates = call.iceCandidates ? JSON.parse(call.iceCandidates) : [];
      existingCandidates.push(candidate);

      await callRepo.update(callId, {
        iceCandidates: JSON.stringify(existingCandidates),
      });

      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'ICE candidates stored successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error storing ICE candidates', null);
    }
  }

  async endCall(callId: string, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const callRepo = this.transactionManager.getRepository(this.callRepository);
      const call = await callRepo.findOne({ where: { id: callId } });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      if (call.callerId !== userId && call.receiverId !== userId) {
        throw new HttpException('Unauthorized to end this call', HttpStatus.UNAUTHORIZED);
      }

      const endTime = new Date();
      const duration = call.answerTime
        ? Math.floor((endTime.getTime() - call.answerTime.getTime()) / 1000)
        : 0;

      const updatedCall = await callRepo.update(callId, {
        status: 'completed',
        endTime,
        duration,
      });

      if (!updatedCall.affected) {
        throw new HttpException('Failed to end call', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call ended successfully', {
        callId,
        status: 'completed',
        endTime,
        duration,
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error ending call', null);
    }
  }
}

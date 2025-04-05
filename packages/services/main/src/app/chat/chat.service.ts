import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../authentication/entities/user.entity';
import { CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, MessageResponseModel, MessegeIdRequestModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models';
import { ChatRoomRepository } from './repository/chatroom.repository';
import { MessegeRepository } from './repository/messege.repository';
import { CallRepository } from './repository/call.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { ChatRoomIdRequestModel } from './dto\'s/chat.room.id';
import { CallEntity } from './entities/call.entity';
import { PrivateMessageDto } from './dto\'s/private-messege-model';

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

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoomRepository) private readonly chatRoomRepository: ChatRoomRepository,
    @InjectRepository(MessegeRepository) private readonly messageRepository: MessegeRepository,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CallRepository) private readonly callRepository: CallRepository,
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

      let chatRoom = reqModel.chatRoomId
        ? await chatRoomRepo.findOne({ where: { id: reqModel.chatRoomId }, relations: ['participants'] })
        : null;

      if (!chatRoom) {
        // Create a new group if chatRoomId is not provided
        const participants = reqModel.participants?.length
          ? await this.userRepository.findByIds([sender.id, ...reqModel.participants])
          : [sender]; // Default to sender only if no participants

        chatRoom = chatRoomRepo.create({
          participants,
          name: reqModel.groupName || `Group-${Date.now()}`,
          isGroup: participants.length > 1,
          lastMessage: reqModel.text,
          groupCreator: sender, // Assuming groupCreator is added to ChatRoomEntity
        });
        chatRoom = await chatRoomRepo.save(chatRoom);
      } else {
        // Update existing chat room
        await chatRoomRepo.update(chatRoom.id, { lastMessage: reqModel.text });
      }

      const newMessage = messageRepo.create({
        sender,
        chatRoom,
        text: reqModel.text,
        createdAt: new Date(),
        status: 'delivered', // Assuming status is added to MessageEntity
      });

      const savedMessage = await messageRepo.save(newMessage);
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

  async sendPrivateMessage(reqModel: PrivateMessageDto): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const messageRepo = this.transactionManager.getRepository(this.messageRepository);
      const chatRoomRepo = this.transactionManager.getRepository(this.chatRoomRepository);

      const sender = await this.userRepository.findOne({ where: { id: reqModel.senderId } });
      const receiver = await this.userRepository.findOne({ where: { id: reqModel.receiverId } });
      if (!sender || !receiver) {
        throw new HttpException('Sender or receiver not found', HttpStatus.NOT_FOUND);
      }

      let chatRoom = await chatRoomRepo.findOne({
        where: {
          isGroup: false,
          participants: { id: In([reqModel.senderId, reqModel.receiverId]) },
        },
        relations: ['participants'],
      });

      if (!chatRoom) {
        chatRoom = chatRoomRepo.create({
          participants: [sender, receiver],
          isGroup: false,
          lastMessage: reqModel.text,
        });
        chatRoom = await chatRoomRepo.save(chatRoom);
      } else {
        await chatRoomRepo.update(chatRoom.id, { lastMessage: reqModel.text });
      }

      const newMessage = messageRepo.create({
        sender,
        receiver,
        chatRoom,
        text: reqModel.text,
        createdAt: new Date(),
        status: 'delivered',
      });

      const savedMessage = await messageRepo.save(newMessage);
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Private message sent successfully', {
        _id: savedMessage.id,
        senderId: savedMessage.sender.id,
        receiverId: savedMessage.receiver?.id,
        chatRoomId: savedMessage.chatRoom.id,
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

  async initiateCall(callerId: string, userToCall: string, signalData: RTCSessionDescriptionInit): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const caller = await this.userRepository.findOne({ where: { id: callerId } });
      const receiver = await this.userRepository.findOne({ where: { id: userToCall } });

      if (!caller || !receiver) {
        throw new HttpException('Caller or receiver not found', HttpStatus.NOT_FOUND);
      }

      const newCall = new CallEntity();
      newCall.caller = caller;
      newCall.receiver = receiver;
      newCall.callType = 'video';
      newCall.status = 'ongoing';

      const savedCall = await this.callRepository.save(newCall);
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call initiated successfully', {
        callId: savedCall.id,
        callerId: savedCall.caller.id,
        receiverId: savedCall.receiver.id,
        callType: savedCall.callType,
        signalData: signalData,
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
      const call = await this.callRepository.findOne({
        where: { id: callId },
        relations: ['caller', 'receiver']
      });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      if (call.receiver.id !== answererId) {
        throw new HttpException('Unauthorized to answer this call', HttpStatus.UNAUTHORIZED);
      }

      const updatedCall = await this.callRepository.update(callId, {
        status: 'ongoing', // Changed from 'accepted' to 'ongoing'
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
      const call = await this.callRepository.findOne({
        where: { id: callId },
        relations: ['caller', 'receiver']
      });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      if (call.caller.id !== userId && call.receiver.id !== userId) {
        throw new HttpException('Unauthorized to modify this call', HttpStatus.UNAUTHORIZED);
      }

      // Store ICE candidates - you might want to create a separate table for this in production
      const existingCandidates = call.iceCandidates ? JSON.parse(call.iceCandidates) : [];
      existingCandidates.push(candidate);

      await this.callRepository.update(callId, {
        iceCandidates: JSON.stringify(existingCandidates)
      });

      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'ICE Ascending ICE candidates stored successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error storing ICE candidates', null);
    }
  }

  async endCall(callId: string, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const call = await this.callRepository.findOne({
        where: { id: callId },
        relations: ['caller', 'receiver']
      });

      if (!call) {
        throw new HttpException('Call not found', HttpStatus.NOT_FOUND);
      }

      if (call.caller.id !== userId && call.receiver.id !== userId) {
        throw new HttpException('Unauthorized to end this call', HttpStatus.UNAUTHORIZED);
      }

      const updatedCall = await this.callRepository.update(callId, {
        status: 'completed',
        endTime: new Date()
      });

      if (!updatedCall.affected) {
        throw new HttpException('Failed to end call', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Call ended successfully', {
        callId,
        status: 'completed',
        endTime: new Date()
      });
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Error ending call', null);
    }
  }
}

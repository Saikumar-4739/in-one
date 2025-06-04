import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { CommonResponse, CreateChatRoomModel, CreateMessageModel, EditMessageModel, ErrorResponse, MessageResponse, MessageResponseModel, MessegeIdRequestModel, PrivateMessegeModel, UserIdRequestModel } from '@in-one/shared-models';
import { ChatRoomRepository } from './repository/chatroom.repository';
import { PrivateMessageRepository } from './repository/private-messege.repository';
import { CallRepository } from './repository/call.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { ChatRoomParticipantRepository } from './repository/chat_room_participants.repo';
import { ChatRoomEntity } from './entities/chatroom.entity';
import { ChatRoomParticipantEntity } from './entities/chat.room.participants';
import { MessageEntity } from './entities/messege.entity';
import { CallEntity } from './entities/call.entity';
import { MessegeRepository } from './repository/messege.repository';
import { ChatHelperService } from './chat.helper.services';
import { PrivateMessageEntity } from './entities/private-messege-entity';
import { InjectRepository } from '@nestjs/typeorm';


interface ChatRoomIdRequestModel {
  chatRoomId: string;
}

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
    private readonly dataSource: DataSource,
    private readonly chatRoomRepository: ChatRoomRepository,
    private readonly messageRepository: MessegeRepository,
    private readonly privateMessageRepository: PrivateMessageRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly callRepository: CallRepository,
    private readonly participantRepository: ChatRoomParticipantRepository,
    private readonly chatHelperService: ChatHelperService,
  ) { }

  async createMessage(reqModel: CreateMessageModel): Promise<MessageResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);

    try {
      const { senderId, chatRoomId, text, groupName, participants = [] } = reqModel;

      const sender = await this.userRepository.findOne({ where: { id: senderId } });
      if (!sender) {
        throw new ErrorResponse(10001, 'Sender not found');
      }

      let chatRoom: ChatRoomEntity;
      if (chatRoomId) {
        const found = await this.chatRoomRepository.findOne({ where: { id: chatRoomId } });
        if (!found) {
          throw new ErrorResponse(10002, 'Chat room not found');
        }
        chatRoom = found;

        await transactionManager.startTransaction();
        chatRoom.lastMessage = text;
        await transactionManager.getRepository(ChatRoomEntity).save(chatRoom);
      } else {
        const participantIds = [sender.id, ...participants];
        const users = await this.userRepository.find({ where: { id: In(participantIds) } });

        if (users.length !== participantIds.length) {
          throw new ErrorResponse(10003, 'One or more participants not found');
        }

        await transactionManager.startTransaction();

        const newChatRoom = new ChatRoomEntity();
        newChatRoom.name = groupName || `Group-${Date.now()}`;
        newChatRoom.isGroup = participantIds.length > 1;
        newChatRoom.lastMessage = text;
        chatRoom = await transactionManager.getRepository(ChatRoomEntity).save(newChatRoom);

        const participantEntities: ChatRoomParticipantEntity[] = [];
        for (const userId of participantIds) {
          const participant = new ChatRoomParticipantEntity();
          participant.chatRoomId = chatRoom.id;
          participant.userId = userId;
          participantEntities.push(participant);
        }
        await transactionManager.getRepository(ChatRoomParticipantEntity).save(participantEntities);
      }

      const message = new MessageEntity();
      message.senderId = sender.id;
      message.chatRoomId = chatRoom.id;
      message.text = text;
      message.createdAt = new Date();
      message.status = 'delivered';

      const savedMessage = await transactionManager.getRepository(MessageEntity).save(message);
      await transactionManager.commitTransaction();
      const messageResponse = new MessageResponseModel(savedMessage.id, savedMessage.senderId, savedMessage.text, savedMessage.createdAt, savedMessage.chatRoomId, undefined, undefined, undefined, undefined, savedMessage.status);
      return new MessageResponse(true, 200, 'Message sending successful', messageResponse);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new MessageResponse(false, 500, 'Message sending unsuccessful',);
    }
  }

  // ENDPOINT: Get chat history for a chat room
  async getChatHistory(req: ChatRoomIdRequestModel): Promise<CommonResponse> {
    try {
      if (!req.chatRoomId) {
        throw new ErrorResponse(10004, 'Chat room ID must be provided');
      }

      const messages = await this.messageRepository.find({ where: { chatRoomId: req.chatRoomId }, order: { createdAt: 'ASC' } });

      const response = messages.map(
        (msg) =>
          new MessageResponseModel(msg.id, msg.senderId, msg.text, msg.createdAt, msg.chatRoomId, undefined, undefined, undefined, undefined, msg.status),
      );

      return new CommonResponse(true, 200, 'Chat history retrieved successfully', response);
    } catch (error) {
      return new CommonResponse(true, 500, 'Error fetching chat history', error);
    }
  }

  // ENDPOINT: Get private chat history between two users
  async getPrivateChatHistory(req: { senderId: string; receiverId: string }): Promise<CommonResponse> {
    try {
      if (!req.senderId || !req.receiverId) {
        throw new ErrorResponse(10005, 'Sender and receiver IDs must be provided');
      }

      const messages = await this.privateMessageRepository.find({
        where: [
          { senderId: req.senderId, receiverId: req.receiverId },
          { senderId: req.receiverId, receiverId: req.senderId },
        ],
        order: { createdAt: 'ASC' },
      });

      const response = messages.map(
        (msg) =>
          new MessageResponseModel(msg.id, msg.senderId, msg.text ? this.chatHelperService.decrypt(msg.text) : null, msg.createdAt, undefined, msg.receiverId, msg.emoji, msg.fileUrl, msg.fileType, msg.status),
      );

      return new CommonResponse(true, 200, 'Private chat history retrieved successfully', response);
    } catch (error) {
      return new CommonResponse(true, 500, 'Error fetching private chat history', error);
    }
  }

  // ENDPOINT: Edit a message in a chat room
  async editMessage(req: EditMessageModel): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!req.messageId || !req.newText) {
        throw new ErrorResponse(10006, 'Message ID and new text must be provided');
      }

      const message = await this.messageRepository.findOne({ where: { id: req.messageId } });
      if (!message) {
        throw new ErrorResponse(10007, 'Message not found');
      }

      await transManager.startTransaction();
      message.text = req.newText;
      const savedMessage = await transManager.getRepository(MessageEntity).save(message);
      await transManager.commitTransaction();

      const response = new MessageResponseModel(savedMessage.id, savedMessage.senderId, savedMessage.text, savedMessage.createdAt, savedMessage.chatRoomId, undefined, undefined, undefined, undefined, savedMessage.status);
      return new CommonResponse(true, 200, 'Message updated successfully', response);
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error editing message', error);
    }
  }

  // ENDPOINT: Edit a private message
  async editPrivateMessage(req: EditMessageModel): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!req.messageId || !req.newText) {
        throw new ErrorResponse(10008, 'Message ID and new text must be provided');
      }

      const message = await this.privateMessageRepository.findOne({ where: { id: req.messageId } });
      if (!message) {
        throw new ErrorResponse(10009, 'Private message not found');
      }

      await transManager.startTransaction();
      message.text = this.chatHelperService.encrypt(req.newText);
      const savedMessage = await transManager.getRepository(PrivateMessageEntity).save(message);
      await transManager.commitTransaction();

      const response = new MessageResponseModel(savedMessage.id, savedMessage.senderId, this.chatHelperService.decrypt(savedMessage.text), savedMessage.createdAt, undefined, savedMessage.receiverId, savedMessage.emoji, savedMessage.fileUrl, savedMessage.fileType, savedMessage.status);
      return new CommonResponse(true, 200, 'Private message updated successfully', response);
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error editing private message', error);
    }
  }

  // ENDPOINT: Delete a message from a chat room
  async deleteMessage(req: MessegeIdRequestModel): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!req.messageId) {
        throw new ErrorResponse(10010, 'Message ID must be provided');
      }

      const message = await this.messageRepository.findOne({ where: { id: req.messageId } });
      if (!message) {
        throw new ErrorResponse(10011, 'Message not found');
      }

      await transManager.startTransaction();
      await transManager.getRepository(MessageEntity).delete({ id: req.messageId });
      await transManager.commitTransaction();

      return new CommonResponse(true, 200, 'Message deleted successfully');
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error deleting message', error);
    }
  }

  // ENDPOINT: Delete a private message
  async deletePrivateMessage(req: MessegeIdRequestModel): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!req.messageId) {
        throw new ErrorResponse(10012, 'Message ID must be provided');
      }

      const message = await this.privateMessageRepository.findOne({ where: { id: req.messageId } });
      if (!message) {
        throw new ErrorResponse(10013, 'Private message not found');
      }

      await transManager.startTransaction();
      await transManager.getRepository(PrivateMessageEntity).delete({ id: req.messageId });
      await transManager.commitTransaction();

      return new CommonResponse(true, 200, 'Private message deleted successfully');
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error deleting private message', error);
    }
  }

  // ENDPOINT: Get all users
  async getAllUsers(): Promise<CommonResponse> {
    try {
      const users = await this.userRepository.find({ select: ['id', 'username', 'email', 'profilePicture'] });
      return new CommonResponse(true, 200, 'Users retrieved successfully', users);
    } catch (error) {
      return new CommonResponse(true, 500, 'Error fetching users', error);
    }
  }

  // ENDPOINT: Get a message by ID
  async getMessageById(req: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      if (!req.messageId) {
        throw new ErrorResponse(51023, 'Message ID must be provided');
      }

      const message = await this.messageRepository.findOne({ where: { id: req.messageId } });
      if (!message) {
        throw new ErrorResponse(51024, 'Message not found');
      }

      const response = new MessageResponseModel(message.id, message.senderId, message.text, message.createdAt, message.chatRoomId, undefined, undefined, undefined, undefined, message.status);
      return new CommonResponse(true, 200, 'Message retrieved successfully', response);
    } catch (error) {
      return new CommonResponse(true, 500, 'Error retrieving message', error);
    }
  }

  // ENDPOINT: Get a private message by ID
  async getPrivateMessageById(req: MessegeIdRequestModel): Promise<CommonResponse> {
    try {
      if (!req.messageId) {
        throw new ErrorResponse(51026, 'Message ID must be provided');
      }

      const message = await this.privateMessageRepository.findOne({ where: { id: req.messageId } });
      if (!message) {
        throw new ErrorResponse(51027, 'Private message not found');
      }

      const response = new MessageResponseModel(message.id, message.senderId, message.text ? this.chatHelperService.decrypt(message.text) : null, message.createdAt, undefined, message.receiverId, message.emoji, message.fileUrl, message.fileType, message.status);
      return new CommonResponse(true, 200, 'Private message retrieved successfully', response);
    } catch (error) {
      return new CommonResponse(true, 500, 'Error retrieving private message', error);
    }
  }

  // ENDPOINT: Get chat rooms for a user
  async getChatRoomsForUser(req: UserIdRequestModel): Promise<CommonResponse> {
    try {
      if (!req.userId) {
        throw new ErrorResponse(51029, 'User ID must be provided');
      }

      const participants = await this.participantRepository.find({ where: { userId: req.userId } });

      const chatRoomIds = participants.map((p) => p.chatRoomId);
      if (!chatRoomIds.length) {
        throw new ErrorResponse(51030, 'No chat rooms found for user');
      }

      const chatRooms = await this.chatRoomRepository.find({ where: { id: In(chatRoomIds) } });

      const chatRoomResponses = await Promise.all(
        chatRooms.map(async (room) => {
          const roomParticipants = await this.participantRepository.find({ where: { chatRoomId: room.id } });
          return { _id: room.id, participantIds: roomParticipants.map((p) => p.userId), name: room.name, isGroup: room.isGroup, lastMessage: room.lastMessage };
        }),
      );

      return new CommonResponse(true, 200, 'Chat rooms fetched successfully', chatRoomResponses);
    } catch (error) {
      return new CommonResponse(true, 500, 'Error fetching chat rooms', error);
    }
  }

  // ENDPOINT: Create a chat room
  async createChatRoom(req: CreateChatRoomModel): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!req.participants?.length) {
        throw new ErrorResponse(51032, 'Participants must be provided');
      }

      const participants = await this.userRepository.find({ where: { id: In(req.participants) } });
      if (participants.length !== req.participants.length) {
        throw new ErrorResponse(51033, 'One or more participants not found');
      }

      await transManager.startTransaction();

      const chatRoom = this.chatHelperService.getChatRoomEntity(req.name ?? '', req.participants.length > 1, '');
      const savedChatRoom = await transManager.getRepository(ChatRoomEntity).save(chatRoom);

      const participantEntities = req.participants.map((userId) =>
        this.chatHelperService.getChatRoomParticipantEntity(savedChatRoom.id, userId),
      );
      await transManager.getRepository(ChatRoomParticipantEntity).save(participantEntities);

      await transManager.commitTransaction();

      const response = { _id: savedChatRoom.id, participantIds: req.participants, name: savedChatRoom.name, isGroup: savedChatRoom.isGroup, lastMessage: savedChatRoom.lastMessage };
      return new CommonResponse(true, 200, 'Chat room created successfully', response);
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error creating chat room', error);
    }
  }

  // ENDPOINT: Send a private message
  async sendPrivateMessage(req: PrivateMessegeModel): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!req.senderId || !req.receiverId || !req.text) {
        throw new ErrorResponse(51035, 'Sender ID, receiver ID, and text must be provided');
      }

      const sender = await this.userRepository.findOne({ where: { id: req.senderId } });
      const receiver = await this.userRepository.findOne({ where: { id: req.receiverId } });
      if (!sender || !receiver) {
        throw new ErrorResponse(51036, 'Sender or receiver not found');
      }

      await transManager.startTransaction();

      const message = this.chatHelperService.getPrivateMessageEntity(req.senderId, req.receiverId, req.text);
      const savedMessage = await transManager.getRepository(PrivateMessageEntity).save(message);
      await transManager.commitTransaction();

      const response = new MessageResponseModel(savedMessage.id, savedMessage.senderId, this.chatHelperService.decrypt(savedMessage.text), savedMessage.createdAt, undefined, savedMessage.receiverId, savedMessage.emoji, savedMessage.fileUrl, savedMessage.fileType, savedMessage.status);
      return new CommonResponse(true, 200, 'Private message sent successfully', response);
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error sending private message', error);
    }
  }

  // ENDPOINT: Initiate a call
  async initiateCall(callerId: string, userToCall: string, signalData: RTCSessionDescriptionInit): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!callerId || !userToCall || !signalData) {
        throw new ErrorResponse(51038, 'Caller ID, receiver ID, and signal data must be provided');
      }

      const caller = await this.userRepository.findOne({ where: { id: callerId } });
      const receiver = await this.userRepository.findOne({ where: { id: userToCall } });
      if (!caller || !receiver) {
        throw new ErrorResponse(51039, 'Caller or receiver not found');
      }

      await transManager.startTransaction();

      const call = this.chatHelperService.getCallEntity(callerId, userToCall, signalData);
      const savedCall = await transManager.getRepository(CallEntity).save(call);
      await transManager.commitTransaction();

      const response = { callId: savedCall.id, callerId: savedCall.callerId, receiverId: savedCall.receiverId, callType: savedCall.callType, signalData, status: savedCall.status };
      return new CommonResponse(true, 200, 'Call initiated successfully', response);
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error initiating call', error);
    }
  }

  // ENDPOINT: Answer a call
  async answerCall(callId: string, signalData: RTCSessionDescriptionInit, answererId: string): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!callId || !answererId || !signalData) {
        throw new ErrorResponse(51041, 'Call ID, answerer ID, and signal data must be provided');
      }

      const call = await this.callRepository.findOne({ where: { id: callId } });
      if (!call) {
        throw new ErrorResponse(51042, 'Call not found');
      }

      if (call.receiverId !== answererId) {
        throw new ErrorResponse(51043, 'Unauthorized to answer this call');
      }

      await transManager.startTransaction();
      await transManager.getRepository(CallEntity).update({ id: callId }, { status: 'ongoing', answerTime: new Date(), signalData: JSON.stringify(signalData) },);
      await transManager.commitTransaction();
      const response = { callId, signalData, status: 'ongoing', answerTime: new Date() };
      return new CommonResponse(true, 200, 'Call answered successfully', response);
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error answering call', error);
    }
  }

  // ENDPOINT: Handle ICE candidates for a call
  async handleIceCandidate(callId: string, candidate: RTCIceCandidateInit, userId: string): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!callId || !candidate || !userId) {
        throw new ErrorResponse(51045, 'Call ID, candidate, and user ID must be provided');
      }

      const call = await this.callRepository.findOne({ where: { id: callId } });
      if (!call) {
        throw new ErrorResponse(51046, 'Call not found');
      }

      if (call.callerId !== userId && call.receiverId !== userId) {
        throw new ErrorResponse(51047, 'Unauthorized to modify this call');
      }

      await transManager.startTransaction();

      const existingCandidates = call.iceCandidates ? JSON.parse(call.iceCandidates) : [];
      existingCandidates.push(candidate);

      await transManager.getRepository(CallEntity).update({ id: callId }, { iceCandidates: JSON.stringify(existingCandidates) });
      await transManager.commitTransaction();
      return new CommonResponse(true, 200, 'ICE candidates stored successfully');
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error storing ICE candidates', error);
    }
  }

  // ENDPOINT: End a call
  async endCall(callId: string, userId: string): Promise<CommonResponse> {
    const transManager = new GenericTransactionManager(this.dataSource);
    try {
      if (!callId || !userId) {
        throw new ErrorResponse(51049, 'Call ID and user ID must be provided');
      }

      const call = await this.callRepository.findOne({ where: { id: callId } });
      if (!call) {
        throw new ErrorResponse(51050, 'Call not found');
      }

      
      if (call.callerId !== userId && call.receiverId !== userId) {
        throw new ErrorResponse(51051, 'Unauthorized to end this call');
      }

      await transManager.startTransaction();

      const endTime = new Date();
      const duration = call.answerTime ? Math.floor((endTime.getTime() - call.answerTime.getTime()) / 1000) : 0;
      await transManager.getRepository(CallEntity).update({ id: callId }, { status: 'completed', endTime, duration });
      await transManager.commitTransaction();
      const response = { callId, status: 'completed', endTime, duration };
      return new CommonResponse(true, 200, 'Call ended successfully', response);
    } catch (error) {
      await transManager.rollbackTransaction();
      return new CommonResponse(true, 500, 'Error ending call', error);
    }
  }
}
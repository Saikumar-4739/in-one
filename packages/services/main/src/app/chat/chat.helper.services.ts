import { Injectable } from '@nestjs/common';
import { ChatRoomEntity } from './entities/chatroom.entity';
import { ChatRoomParticipantEntity } from './entities/chat.room.participants';
import { CallEntity } from './entities/call.entity';
import * as crypto from 'crypto';
import { MessageEntity } from './entities/messege.entity';
import { PrivateMessageEntity } from './entities/private-messege-entity';

type RTCSessionDescriptionInit = {
  type?: 'offer' | 'answer' | 'rollback';
  sdp?: string;
};

@Injectable()
export class ChatHelperService {
  private readonly encryptionKey = process.env.ENCRYPTION_KEY
    ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex')
    : Buffer.from('12345678901234567890123456789012');
  private readonly ivLength = 16;

  // HELPER: Encrypt text
  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  // HELPER: Decrypt text
  decrypt(text: string): string {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  // HELPER: Create MessageEntity
  getMessageEntity(senderId: string, chatRoomId: string, text: string): MessageEntity {
    const message = new MessageEntity();
    message.senderId = senderId;
    message.chatRoomId = chatRoomId;
    message.text = text;
    message.createdAt = new Date();
    message.status = 'delivered';
    return message;
  }

  // HELPER: Create PrivateMessageEntity
  getPrivateMessageEntity(senderId: string, receiverId: string, text: string): PrivateMessageEntity {
    const message = new PrivateMessageEntity();
    message.senderId = senderId;
    message.receiverId = receiverId;
    message.text = this.encrypt(text);
    message.createdAt = new Date();
    message.status = 'delivered';
    return message;
  }

  // HELPER: Create ChatRoomEntity
  getChatRoomEntity(name: string, isGroup: boolean, lastMessage: string): ChatRoomEntity {
    const chatRoom = new ChatRoomEntity();
    chatRoom.name = name || `Group-${Date.now()}`;
    chatRoom.isGroup = isGroup;
    chatRoom.lastMessage = lastMessage;
    return chatRoom;
  }

  // HELPER: Create ChatRoomParticipantEntity
  getChatRoomParticipantEntity(chatRoomId: string, userId: string): ChatRoomParticipantEntity {
    const participant = new ChatRoomParticipantEntity();
    participant.chatRoomId = chatRoomId;
    participant.userId = userId;
    return participant;
  }

  // HELPER: Create CallEntity
  getCallEntity( callerId: string, receiverId: string, signalData: RTCSessionDescriptionInit): CallEntity {
    const call = new CallEntity();
    call.callerId = callerId;
    call.receiverId = receiverId;
    call.callType = 'video';
    call.status = 'ongoing';
    call.signalData = JSON.stringify(signalData);
    return call;
  }
}
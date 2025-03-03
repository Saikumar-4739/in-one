import { AudioMessageEntity } from 'src/app/chat/entities/audio.entity';
import { CallEntity } from 'src/app/chat/entities/call.entity';
import { ChatRoomEntity } from 'src/app/chat/entities/chatroom.entity';
import { MessageEntity } from 'src/app/chat/entities/messege.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  profilePicture?: string;

  @Column({ nullable: true })
  resetPasswordOtp?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  @Column({ nullable: true })
  twoFactorOtp?: string;

  @Column({ type: 'timestamp', nullable: true })
  twoFactorExpires?: Date;

  @Column({ type: 'enum', enum: ['online', 'offline', 'busy'], default: 'offline', nullable: true })
  status?: 'online' | 'offline' | 'busy';

  @Column({ type: 'text', array: true, default: [], nullable: true })
  contacts?: string[];

  @CreateDateColumn({ nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;

  @OneToMany(() => AudioMessageEntity, (audioMessage) => audioMessage.sender)
  sentAudioMessages: AudioMessageEntity[];

  @OneToMany(() => AudioMessageEntity, (audioMessage) => audioMessage.receiver)
  receivedAudioMessages: AudioMessageEntity[];

  @OneToMany(() => CallEntity, call => call.caller)
  callsMade: CallEntity[];

  @OneToMany(() => CallEntity, call => call.receiver)
  callsReceived: CallEntity[];

  @ManyToMany(() => ChatRoomEntity, chatRoom => chatRoom.participants)
  chatRooms: ChatRoomEntity[];

  @OneToMany(() => MessageEntity, (message) => message.sender)
  sentMessages: MessageEntity[];

  @OneToMany(() => MessageEntity, (message) => message.receiver)
  receivedMessages: MessageEntity[];
}

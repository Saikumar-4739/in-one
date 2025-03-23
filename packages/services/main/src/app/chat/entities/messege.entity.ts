import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { ChatRoomEntity } from './chatroom.entity';
import { FileType } from '@in-one/shared-models';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.sentMessages, { nullable: false, onDelete: 'CASCADE' })
  sender: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.receivedMessages, { nullable: true, onDelete: 'CASCADE' })
  receiver: UserEntity;

  @ManyToOne(() => ChatRoomEntity, (chatRoom) => chatRoom.messages, { nullable: false, onDelete: 'CASCADE',})
  chatRoom: ChatRoomEntity;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'varchar', nullable: true })
  emoji: string;

  @Column({ type: 'varchar', nullable: true })
  fileUrl: string;

  @Column({ type: 'enum', enum: FileType, nullable: true})
  fileType: FileType;

  @ManyToMany(() => UserEntity)
  @JoinTable({ name: 'message_reads' })
  readBy: UserEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

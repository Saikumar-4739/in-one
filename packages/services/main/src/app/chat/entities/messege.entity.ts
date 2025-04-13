// messages.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FileType } from '@in-one/shared-models';

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ type: 'varchar', nullable: true })
  emoji: string;

  @Column({ type: 'varchar', nullable: true })
  fileUrl: string;

  @Column({ type: 'enum', enum: FileType, nullable: true })
  fileType: FileType;

  @Column({ type: 'enum', enum: ['pending', 'delivered', 'read', 'failed'], default: 'pending' })
  status: 'pending' | 'delivered' | 'read' | 'failed';

  @Column({ type: 'varchar', nullable: true })
  senderId: string;

  @Column({ type: 'varchar', nullable: true })
  chatRoomId: string;

  @Column({ type: 'varchar', nullable: true })
  receiverId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

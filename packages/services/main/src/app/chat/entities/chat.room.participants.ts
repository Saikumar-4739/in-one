import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_room_participants')
export class ChatRoomParticipantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  chatRoomId: string;

  @Column({ type: 'varchar' })
  userId: string;
}
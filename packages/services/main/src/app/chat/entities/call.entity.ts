import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('calls')
export class CallEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['audio', 'video'], default: 'audio' })
  callType: 'audio' | 'video';

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'enum', enum: ['missed', 'completed', 'declined', 'ongoing'], default: 'missed' })
  status: 'missed' | 'completed' | 'declined' | 'ongoing';

  @Column({ type: 'text', nullable: true })
  signalData: string;

  @Column({ type: 'timestamp', nullable: true })
  answerTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'text', nullable: true })
  iceCandidates: string;

  @Column({ type: 'varchar', nullable: true })
  callerId: string;

  @Column({ type: 'varchar', nullable: true })
  receiverId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
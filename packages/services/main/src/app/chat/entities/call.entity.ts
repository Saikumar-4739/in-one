import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { ChatRoomEntity } from './chatroom.entity'; // Add this import
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('calls')
export class CallEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, user => user.callsMade, { nullable: false })
    caller: UserEntity;

    @ManyToOne(() => UserEntity, user => user.callsReceived, { nullable: false })
    receiver: UserEntity; 

    @ManyToOne(() => ChatRoomEntity, (chatRoom) => chatRoom.calls, { nullable: true }) // New relation
    chatRoom: ChatRoomEntity;

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

    @CreateDateColumn()
    createdAt: Date; 

    @UpdateDateColumn()
    updatedAt: Date; 
}
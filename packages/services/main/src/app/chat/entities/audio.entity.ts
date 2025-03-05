import {  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { ChatRoomEntity } from './chatroom.entity';

@Entity('audio_messages')
export class AudioMessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => UserEntity, (user) => user.sentAudioMessages, { nullable: false, onDelete: 'CASCADE' }) 
    sender: UserEntity;

    @ManyToOne(() => UserEntity, (user) => user.receivedAudioMessages, { nullable: false, onDelete: 'CASCADE' }) 
    receiver: UserEntity;

    @ManyToOne(() => ChatRoomEntity, (chatRoom) => chatRoom.messages, { nullable: false, onDelete: 'CASCADE' })
    chatRoom: ChatRoomEntity;


    @Column({ type: 'text', nullable: false }) 
    audioUrl: string;

    @Column({ type: 'int', nullable: false }) 
    duration: number;

    @Column({ type: 'boolean', default: false }) 
    isDeleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

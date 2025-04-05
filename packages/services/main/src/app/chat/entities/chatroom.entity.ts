import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MessageEntity } from './messege.entity';

@Entity('chat_rooms')
export class ChatRoomEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: '' })
    name: string;

    @ManyToMany(() => UserEntity, user => user.chatRooms)
    @JoinTable({ name: 'chat_room_participants' })
    participants: UserEntity[];

    @OneToMany(() => MessageEntity, (message) => message.chatRoom)
    messages: MessageEntity[];

    @Column({ default: false })
    isGroup: boolean;

    @Column({ default: false })
    isSecret: boolean;

    @Column({ default: '' })
    lastMessage: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

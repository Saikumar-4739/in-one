import { UserRole } from '@in-one/shared-models';
import { AudioMessageEntity } from 'src/app/chat/entities/audio.entity';
import { CallEntity } from 'src/app/chat/entities/call.entity';
import { ChatRoomEntity } from 'src/app/chat/entities/chatroom.entity';
import { MessageEntity } from 'src/app/chat/entities/messege.entity';
import { LikeEntity } from 'src/app/entertainment/entities/like.entity';
import { PhotoEntity } from 'src/app/entertainment/entities/photo.entity';
import { ReelEntity } from 'src/app/entertainment/entities/reel.entity';
import { VideoEntity } from 'src/app/entertainment/entities/video.entity';
import { CommentEntity } from 'src/app/news/entities/comment.entity';
import { NewsEntity } from 'src/app/news/entities/news.entity';
import { CalendarEntity } from 'src/app/notes-calender/entities/calender.entity';
import { NoteEntity } from 'src/app/notes-calender/entities/notes.entity';
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

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  resetPasswordOtp?: string;

  @Column({ nullable: true })
  resetPasswordExpires?: Date;

  @Column({ nullable: true })
  twoFactorOtp?: string;

  @Column({ nullable: true })
  twoFactorExpires?: Date;

  @Column({ type: 'enum', enum: ['online', 'offline', 'busy'], default: 'offline', nullable: true })
  status?: 'online' | 'offline' | 'busy';

  @Column({ type: 'text', default: [], nullable: true })
  contacts?: string[];

  @CreateDateColumn()  // ✅ FIX: Auto-sets createdAt
  createdAt: Date;

  @UpdateDateColumn()  // ✅ FIX: Auto-updates on changes
  updatedAt: Date;

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

  @OneToMany(() => NoteEntity, (note) => note.user)
  notes: NoteEntity[];

  @OneToMany(() => CalendarEntity, (calendar) => calendar.user)
  calendars: CalendarEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.author, { cascade: true })
  comments: CommentEntity[];

  @OneToMany(() => NewsEntity, (news) => news.author, { cascade: true })
  news: NewsEntity[];

  @OneToMany(() => VideoEntity, (video) => video.author)
  videos: VideoEntity[];

  @OneToMany(() => PhotoEntity, (photo) => photo.author)
  photos: PhotoEntity[];

  @OneToMany(() => ReelEntity, (reel) => reel.author)
  reels: ReelEntity[];

  @OneToMany(() => CommentEntity, (comment) => comment.author)
  userComments: CommentEntity[];

  @OneToMany(() => LikeEntity, (like) => like.user)
  likes: LikeEntity[];

}

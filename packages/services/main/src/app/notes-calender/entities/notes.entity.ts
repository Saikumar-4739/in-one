import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('notes')
export class NoteEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.notes)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity; 

  @Column({ default: '' })
  title: string;

  @Column('text', { default: '' })
  content: string; 

  @Column('text', { array: true, default: [] })
  attachments: string[];

  @Column({ default: false })
  isArchived: boolean; 

  @Column({ default: false })
  isPinned: boolean; 

  @Column({ default: '' })
  voiceNoteUrl: string; 

  @Column('text', { array: true, default: [] })
  sharedWith: string[]; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

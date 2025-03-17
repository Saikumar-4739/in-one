import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notes')
export class NoteEntity {
  @PrimaryGeneratedColumn('uuid')  // ✅ Ensure UUID is used
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.notes)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity; 

  @Column({ type: 'varchar', length: 255, default: '' })  // ✅ Define length explicitly
  title: string;

  @Column({ type: 'text', nullable: false })  // ✅ Ensure `nullable: false`
  content: string; 

  @Column({ type: 'json', nullable: false })  // ✅ Fix JSON default
  attachments: string[];

  @Column({ type: 'boolean', default: false, nullable: false })
  isArchived: boolean; 

  @Column({ type: 'boolean', default: false, nullable: false })
  isPinned: boolean; 

  @Column({ type: 'varchar', length: 500, default: '' })  // ✅ Define varchar length
  voiceNoteUrl: string; 

  @Column({ type: 'json', nullable: false })  // ✅ Fix JSON default
  sharedWith: string[];
  
  @CreateDateColumn()  // ✅ FIX: Auto-sets createdAt
  createdAt: Date;

  @UpdateDateColumn()  // ✅ FIX: Auto-updates on changes
  updatedAt: Date;
}

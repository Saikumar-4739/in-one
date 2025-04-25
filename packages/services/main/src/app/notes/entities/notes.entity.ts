import { UserEntity } from 'src/app/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notes')
export class NoteEntity {
  @PrimaryGeneratedColumn('uuid')  
  id: string;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'varchar', length: 255, default: '' }) 
  title: string;

  @Column({ type: 'text', nullable: false }) 
  content: string;

  @Column({ type: 'text', nullable: false }) 
  color: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  isArchived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date | null;

  @Column({ type: 'boolean', default: false, nullable: false })
  isPinned: boolean;

  @Column({ type: 'json', nullable: true})
  sharedWith: string[];

  @Column({ type: 'json', nullable: true})
  tags: string[];

  @Column({ type: 'boolean', default: false, nullable: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  trashedAt: Date | null;

  @Column({ type: 'integer', default: 0, nullable: false })
  priority: number;

  @Column({ type: 'timestamp', nullable: true })
  reminderAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
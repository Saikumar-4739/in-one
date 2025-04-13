import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'varchar', nullable: false })
  userId: string; // Plain column for user

  @Column({ type: 'varchar', nullable: true })
  newsId?: string; // Added for news comments

  @Column({ type: 'varchar', nullable: true })
  videoId?: string; // Optional, for video comments

  @Column({ type: 'varchar', nullable: true })
  photoId?: string; // Optional, for photo comments

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

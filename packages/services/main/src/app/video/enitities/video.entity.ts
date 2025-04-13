import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('videos')
export class VideoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: false })
  videoUrl: string;

  @Column({ nullable: true })
  thumbnailUrl?: string; // For video preview images

  @Column({ type: 'varchar', nullable: false })
  userId: string; // Stores the ID of the user who uploaded the video

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likes: number; // Tracks total likes for the video

  @Column({ type: 'int', default: 0 })
  dislikes: number;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'enum', enum: ['public', 'private', 'unlisted'], default: 'public' })
  visibility: 'public' | 'private' | 'unlisted';

  @Column({ type: 'int', nullable: true })
  duration?: number; // Video duration in seconds

  @Column({
    type: 'enum',
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
  })
  status: 'processing' | 'ready' | 'failed'; // Tracks video processing status

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

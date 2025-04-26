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
  thumbnailUrl?: string;

  @Column({ type: 'varchar', nullable: false })
  userId: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ nullable: true })
  userAvatar?: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  dislikes: number;

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'enum', enum: ['public', 'private', 'unlisted'], default: 'public' })
  visibility: 'public' | 'private' | 'unlisted';

  @Column({ type: 'int', nullable: true })
  duration?: number;

  @Column({ type: 'enum', enum: ['processing', 'ready', 'failed'], default: 'processing', })
  status: 'processing' | 'ready' | 'failed';

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ type: 'varchar', nullable: true })
  category?: string;

  @Column({ type: 'varchar', nullable: true })
  language?: string;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'int', default: 0 })
  reportCount: number;

  @Column({ type: 'int', default: 0 })
  commentsCount: number;

  @Column({ type: 'boolean', default: false })
  allowComments: boolean;

  @Column({ type: 'boolean', default: true })
  allowEmbedding: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

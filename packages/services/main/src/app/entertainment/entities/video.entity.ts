import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CommentEntity } from './comment.entity';

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

  @ManyToOne(() => UserEntity, (user) => user.videos, { onDelete: 'CASCADE' })
  author: UserEntity;

  @OneToMany(() => CommentEntity, (comment) => comment.video, { cascade: true })
  comments: CommentEntity[]; 

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

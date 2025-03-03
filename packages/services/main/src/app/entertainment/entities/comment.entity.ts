import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { VideoEntity } from './video.entity';
import { ReelEntity } from './reel.entity';
import { PhotoEntity } from './photo.entity';


@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @ManyToOne(() => UserEntity, (user) => user.comments, { onDelete: 'CASCADE' })
  author: UserEntity;

  @ManyToOne(() => VideoEntity, (video) => video.comments, { nullable: true, onDelete: 'CASCADE' })
  video?: VideoEntity;

  @ManyToOne(() => PhotoEntity, (photo) => photo.comments, { nullable: true, onDelete: 'CASCADE' })
  photo?: PhotoEntity;

  @ManyToOne(() => ReelEntity, (reel) => reel.comments, { nullable: true, onDelete: 'CASCADE' })
  reel?: ReelEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

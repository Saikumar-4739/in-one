import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from 'src/app/authentication/entities/user.entity';

@Entity('stories')
export class StoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.stories, { nullable: false })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  storyUrl: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'enum', enum: ['public', 'private', 'friends'], default: 'public' })
  visibility: 'public' | 'private' | 'friends';

  @Column({ type: 'int', default: 0 })
  views: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'json', nullable: true })
  additionalMedia: string[];

  @Column({ type: 'boolean', default: false })
  isHighlighted: boolean;

  constructor() {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}
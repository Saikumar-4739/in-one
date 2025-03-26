import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from 'src/app/authentication/entities/user.entity';

@Entity('stories')
export class StoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string; // Using UUID like NewsEntity for consistency

  @ManyToOne(() => UserEntity, (user) => user.stories, { nullable: false })
  user: UserEntity; // Relationship to UserEntity instead of just userId

  @Column({ type: 'varchar', length: 255, nullable: false })
  username: string; // Retained for quick access, though derivable from user

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string; // URL or path to the story image

  @Column({ type: 'varchar', length: 500, nullable: true })
  storyUrl: string; // Could be a video or additional media URL

  @Column({ type: 'text', nullable: true })
  content: string; // Optional text content for the story

  @Column({ type: 'enum', enum: ['public', 'private', 'friends'], default: 'public' })
  visibility: 'public' | 'private' | 'friends'; // Visibility control like NewsEntity

  @Column({ type: 'int', default: 0 })
  views: number; // Track how many times the story was viewed

  @CreateDateColumn()
  createdAt: Date; // When the story was created

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date; // When the story expires (set to 24 hours from creation)

  @UpdateDateColumn()
  updatedAt: Date; // Tracks updates to the story

  // Optional additional fields inspired by NewsEntity
  @Column({ type: 'json', nullable: true })
  additionalMedia: string[]; // Array of additional media URLs

  @Column({ type: 'boolean', default: false })
  isHighlighted: boolean; // Flag to highlight certain stories

  // Constructor to set expiresAt automatically
  constructor() {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to 24 hours from now
  }
}
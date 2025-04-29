import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('news')
export class NewsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ type: 'enum', enum: ['public', 'private'], default: 'public' })
  visibility: 'public' | 'private';

  @Column({ type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ type: 'boolean', default: false })
  isBreaking: boolean;

  @Column({ nullable: true })
  publishedAt?: Date;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  likes: number;

  @Column({ type: 'int', default: 0 })
  dislikes: number;

  @Column({ type: 'int', default: 0 })
  shares: number;

  @Column({ type: 'boolean', default: false })
  isImportant: boolean;

  @Column({ type: 'varchar', nullable: false })
  authorId: string;

  @Column({ type: 'json', nullable: true })
  commentIds: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  seoTitle: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  seoDescription: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  seoKeywords: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('likes')
export class LikeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  userId: string; // Plain column for user

  @Column({ type: 'varchar', nullable: true })
  newsId?: string; // Added for news likes

  @Column({ type: 'varchar', nullable: true })
  videoId?: string; // Optional, for video likes

  @Column({ type: 'varchar', nullable: true })
  photoId?: string; // Optional, for photo likes

  @CreateDateColumn()
  createdAt: Date;
}

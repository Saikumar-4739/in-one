import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('likes')
export class LikeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  entityId: string; // videoId, newsId, or photoId

  @Column({ type: 'enum', enum: ['video', 'news', 'photo'] })
  entityType: 'video' | 'news' | 'photo';

  @Column({ type: 'varchar', nullable: true })
  newsId?: string;

  @Column({ type: 'varchar', nullable: true })
  photoId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('likes')
export class LikeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  entityId: string; 

  @Column({ type: 'enum', enum: ['video', 'news', 'photo'] })
  entityType: 'video' | 'news' | 'photo';

  @CreateDateColumn()
  createdAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  username: string;

  @Column()
  imageUrl: string; 

  @Column()
  storyUrl: string; 

  @CreateDateColumn()
  createdAt: Date;
}

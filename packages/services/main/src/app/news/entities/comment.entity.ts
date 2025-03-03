import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { NewsEntity } from 'src/app/news/entities/news.entity';
  
  @Entity('comments')
  export class CommentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string; 
  
    @Column({ type: 'text', nullable: false })
    content: string; 
  
    @Column({ type: 'int', default: 0 })
    likes: number; 
  
    @ManyToOne(() => UserEntity, (user) => user.comments, { nullable: false, onDelete: 'CASCADE' })
    author: UserEntity; 
  
    @ManyToOne(() => NewsEntity, (news) => news.comments, { nullable: false, onDelete: 'CASCADE' })
    news: NewsEntity;
  
    @ManyToOne(() => CommentEntity, (comment) => comment.replies, { nullable: true, onDelete: 'CASCADE' })
    parentComment?: CommentEntity; 
  
    @OneToMany(() => CommentEntity, (comment) => comment.parentComment, { cascade: true })
    replies: CommentEntity[]; 
  
    @Column({ type: 'enum', enum: ['visible', 'hidden', 'deleted'], default: 'visible' })
    status: 'visible' | 'hidden' | 'deleted'; 
  
    @CreateDateColumn()
    createdAt: Date; 
  
    @UpdateDateColumn()
    updatedAt: Date; 
  }
  
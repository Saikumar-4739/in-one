import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { VideoEntity } from './video.entity';
import { PhotoEntity } from './photo.entity';


@Entity('likes')
export class LikeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, (user) => user.likes, { onDelete: 'CASCADE' })
  user: UserEntity;

  @ManyToOne(() => VideoEntity, (video) => video.likes, { nullable: true, onDelete: 'CASCADE' })
  video?: VideoEntity;

  @ManyToOne(() => PhotoEntity, (photo) => photo.likes, { nullable: true, onDelete: 'CASCADE' })
  photo?: PhotoEntity;

  @CreateDateColumn()
  createdAt: Date;
}

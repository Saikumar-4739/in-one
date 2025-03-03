import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { VideoRepository } from '../repository/video.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { VideoEntity } from '../entities/video.entity';
import { UserEntity } from 'src/app/authentication/entities/user.entity';
import { CommentEntity } from '../entities/comment.entity';
import { LikeEntity } from '../entities/like.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VideoEntity, UserEntity, CommentEntity, LikeEntity])],
  providers: [VideoService, GenericTransactionManager, VideoRepository],
  controllers: [VideoController],
  exports: [VideoService],
})
export class VideoModule {}
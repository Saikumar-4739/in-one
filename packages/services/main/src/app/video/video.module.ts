import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { VideoEntity } from './enitities/video.entity';
import { UserEntity } from 'src/app/user/entities/user.entity';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { CloudinaryModule } from '../masters/cloudinary/cloudinary.module';
import { VideoRepository } from './repository/video.repository';

@Module({
  imports: [TypeOrmModule.forFeature([VideoEntity, UserEntity, CommentEntity, LikeEntity]),
    CloudinaryModule
  ],
  providers: [VideoService, GenericTransactionManager, VideoRepository],
  controllers: [VideoController],
  exports: [VideoService],
})
export class VideoModule { }

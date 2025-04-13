import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhotoRepository } from './repository/photo.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { PhotoEntity } from './entities/photo.entity';
import { UserEntity } from 'src/app/user/entities/user.entity';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { CloudinaryModule } from '../masters/cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([PhotoEntity, UserEntity, CommentEntity, LikeEntity]),
    CloudinaryModule],
  controllers: [PhotoController],
  providers: [PhotoService, GenericTransactionManager, PhotoRepository],
  exports: [PhotoService],
})
export class PhotoModule { }

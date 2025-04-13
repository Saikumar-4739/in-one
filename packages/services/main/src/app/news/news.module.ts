import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsEntity } from './entities/news.entity';
import { NewsRepository } from './repository/news.repository';
import { UserEntity } from '../user/entities/user.entity';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsEntity, UserEntity, CommentEntity, LikeEntity]),
  ],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository, GenericTransactionManager],
  exports: [NewsService],
})
export class NewsModule { }

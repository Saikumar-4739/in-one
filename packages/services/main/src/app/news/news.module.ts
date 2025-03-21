import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { NewsEntity } from './entities/news.entity';
import { NewsCommentEntity } from './entities/comment.entity';
import { NewsRepository } from './repository/news.repository';
import { UserEntity } from '../authentication/entities/user.entity';
import { CommentRepository } from './repository/comment.repository';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsEntity, NewsCommentEntity, UserEntity]), 
  ],
  controllers: [NewsController],
  providers: [ NewsService, NewsRepository, CommentRepository, GenericTransactionManager],
  exports: [NewsService],
})
export class NewsModule {}

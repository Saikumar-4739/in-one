import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { ReelEntity } from '../entities/reel.entity';
import { CommentEntity } from '../entities/comment.entity';
import { LikeEntity } from '../entities/like.entity';
import { ReelController } from './reels.controller';
import { ReelService } from './reels.service';
import { ReelsRepository } from '../repository/reels.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ReelEntity, CommentEntity, LikeEntity])],
  controllers: [ReelController],
  providers: [ReelService, GenericTransactionManager, ReelsRepository],
  exports: [ReelService],
})
export class ReelModule {}

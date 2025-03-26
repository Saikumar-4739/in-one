import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoryEntity } from './entities/story.entity';
import { UserEntity } from '../authentication/entities/user.entity';
import { StoriesRepository } from './repository/story.repository';
import { StoriesController } from './story.controller';
import { StoriesService } from './story.service';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { CloudinaryProvider } from '../entertainment/cloudinary/cloudinary.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([StoryEntity, UserEntity, StoriesRepository]),
  ],
  controllers: [StoriesController],
  providers: [
    StoriesService,
    GenericTransactionManager,
    CloudinaryProvider,
    StoriesRepository
  ],
})
export class StoriesModule {}
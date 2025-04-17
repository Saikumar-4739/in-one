import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan, DataSource } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { CommonResponse, CreateStoryModel, UpdateStoryModel } from '@in-one/shared-models';
import { StoriesRepository } from './repository/story.repository';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Inject } from '@nestjs/common';
import { Readable } from 'stream';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { StoryEntity } from './entities/story.entity';

@Injectable()
export class StoriesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StoriesRepository)
    private readonly storiesRepository: StoriesRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @Inject('CLOUDINARY') private readonly cloudinary: any
  ) {
    setInterval(() => this.cleanupExpiredStories(), 1000 * 60 * 60);
  }

  private async uploadToCloudinary(base64Image: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!base64Image) {
        reject(new Error('No image provided'));
        return;
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      stream.pipe(
        this.cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'stories' },
          (error: any, result: UploadApiResponse) => {
            if (error || !result) {
              reject(error || new Error('Upload failed'));
            } else {
              resolve(result);
            }
          }
        )
      );
    });
  }

  async createStory(createStoryDto: CreateStoryModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate user
      const user = await this.userRepository.findOne({ where: { id: createStoryDto.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      let imageUrl: string | undefined;
      if (createStoryDto.image) {
        const base64Match = createStoryDto.image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
        if (base64Match) {
          const uploadResult = await this.uploadToCloudinary(createStoryDto.image);
          imageUrl = uploadResult.secure_url;
        } else {
          imageUrl = createStoryDto.image; // Assume it's a URL if not base64
        }
      }

      await transactionManager.startTransaction();

      const newStory = transactionManager.getRepository(StoryEntity).create({
        userId: user.id,
        username: user.username,
        imageUrl: imageUrl,
        storyUrl: undefined,
        content: createStoryDto.content ?? '',
        visibility: createStoryDto.visibility ?? 'public',
        views: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        updatedAt: new Date(),
        additionalMedia: [],
        isHighlighted: false
      });

      const savedStory = await transactionManager.getRepository(StoryEntity).save(newStory);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 201, 'Story created successfully', savedStory);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error creating story';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
    }
  }

  async updateStory(id: string, updateStoryDto: UpdateStoryModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const existingStory = await this.storiesRepository.findOne({
        where: {
          id,
          expiresAt: MoreThan(new Date())
        }
      });
      if (!existingStory) {
        throw new Error('Story not found or has expired');
      }

      await transactionManager.startTransaction();

      const updatedStory = transactionManager.getRepository(StoryEntity).merge(existingStory, updateStoryDto);
      const savedStory = await transactionManager.getRepository(StoryEntity).save(updatedStory);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Story updated successfully', savedStory);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error updating story';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
    }
  }

  async deleteStory(id: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const story = await this.storiesRepository.findOne({ where: { id } });
      if (!story) {
        throw new Error('Story not found');
      }

      await transactionManager.startTransaction();

      await transactionManager.getRepository(StoryEntity).remove(story);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Story deleted successfully', null);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error deleting story';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
    }
  }

  async getAllStories(page: number, limit: number): Promise<CommonResponse> {
    try {
      const [stories, total] = await this.storiesRepository.findAndCount({
        where: {
          expiresAt: MoreThan(new Date())
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
      return new CommonResponse(true, 200, 'Stories retrieved successfully', { stories, total });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error retrieving stories';
      return new CommonResponse(false, 500, errorMessage, null);
    }
  }

  async getUserStories(userId: string, page: number, limit: number): Promise<CommonResponse> {
    try {
      const [stories, total] = await this.storiesRepository.findAndCount({
        where: {
          userId,
          expiresAt: MoreThan(new Date()),
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
      return new CommonResponse(true, 200, 'User stories retrieved successfully', { stories, total });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error retrieving user stories';
      return new CommonResponse(false, 500, errorMessage, null);
    }
  }

  async searchStories(query: string): Promise<CommonResponse> {
    try {
      const stories = await this.storiesRepository.find({
        where: [
          {
            content: Like(`%${query}%`),
            expiresAt: MoreThan(new Date())
          },
        ],
      });
      return new CommonResponse(true, 200, 'Search results retrieved', stories);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error searching stories';
      return new CommonResponse(false, 500, errorMessage, null);
    }
  }

  async cleanupExpiredStories(): Promise<void> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      await transactionManager.startTransaction();

      await transactionManager.getRepository(StoryEntity)
        .createQueryBuilder()
        .delete()
        .from('stories')
        .where('expiresAt <= :now', { now: new Date() })
        .execute();

      await transactionManager.commitTransaction();
    } catch (error) {
      await transactionManager.rollbackTransaction();
      console.error('❌ Error cleaning up expired stories:', error);
    }
  }

  async markStoryAsViewed(id: string, userId: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const story = await this.storiesRepository.findOne({
        where: {
          id: id,
          expiresAt: MoreThan(new Date())
        }
      });
      if (!story) {
        throw new Error('Story not found or has expired');
      }

      await transactionManager.startTransaction();

      story.views = story.views ? story.views + 1 : 1;
      const updatedStory = await transactionManager.getRepository(StoryEntity).save(story);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Story marked as viewed', updatedStory);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Error marking story as viewed';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage,
        null
      );
    }
  }
}

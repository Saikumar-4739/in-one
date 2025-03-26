import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan } from 'typeorm';
import { UserEntity } from '../authentication/entities/user.entity';
import { CommonResponse, CreateStoryModel, UpdateStoryModel } from '@in-one/shared-models';
import { StoriesRepository } from './repository/story.repository';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Inject } from '@nestjs/common';
import { Readable } from 'stream';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(StoriesRepository) private readonly storiesRepository: StoriesRepository,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    private readonly transactionManager: GenericTransactionManager,
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
    await this.transactionManager.startTransaction();
    try {
      const storiesRepo = this.transactionManager.getRepository(this.storiesRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      const user = await userRepo.findOne({ where: { id: createStoryDto.userId } });
      if (!user) throw new Error('User not found');

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

      const newStory = storiesRepo.create({
        user: user,
        username: user.username, // Assuming UserEntity has a username field
        imageUrl: imageUrl,
        storyUrl: undefined, // Not provided in DTO, set as needed
        content: createStoryDto.content ?? '',
        visibility: createStoryDto.visibility ?? 'public',
        views: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        updatedAt: new Date(),
        additionalMedia: [],
        isHighlighted: false
      });

      const savedStory = await storiesRepo.save(newStory);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Story created successfully', savedStory);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating story:', error);
      return new CommonResponse(false, 500, 'Error creating story', error);
    }
  }

  async updateStory(id: string, updateStoryDto: UpdateStoryModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const storiesRepo = this.transactionManager.getRepository(this.storiesRepository);
      const existingStory = await storiesRepo.findOne({
        where: {
          id,
          expiresAt: MoreThan(new Date())
        }
      });
      if (!existingStory) throw new Error('Story not found or has expired');

      const updatedStory = storiesRepo.merge(existingStory, updateStoryDto);
      const savedStory = await storiesRepo.save(updatedStory);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Story updated successfully', savedStory);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating story:', error);
      return new CommonResponse(false, 500, 'Error updating story', error);
    }
  }

  async deleteStory(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const storiesRepo = this.transactionManager.getRepository(this.storiesRepository);
      const story = await storiesRepo.findOne({ where: { id } });
      if (!story) throw new Error('Story not found');

      await storiesRepo.remove(story);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Story deleted successfully', null);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting story:', error);
      return new CommonResponse(false, 500, 'Error deleting story', error);
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
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      return new CommonResponse(true, 200, 'Stories retrieved successfully', { stories, total });
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving stories', error);
    }
  }

  async getUserStories(userId: string, page: number, limit: number): Promise<CommonResponse> {
    try {
      const [stories, total] = await this.storiesRepository.findAndCount({
        where: {
          user: { id: userId },
          expiresAt: MoreThan(new Date())
        },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
      return new CommonResponse(true, 200, 'User stories retrieved successfully', { stories, total });
    } catch (error) {
      return new CommonResponse(false, 500, 'Error retrieving user stories', error);
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
      return new CommonResponse(false, 500, 'Error searching stories', error);
    }
}

  async cleanupExpiredStories(): Promise<void> {
    try {
      await this.storiesRepository
        .createQueryBuilder()
        .delete()
        .from('stories')
        .where('expiresAt <= :now', { now: new Date() })
        .execute();
    } catch (error) {
      console.error('❌ Error cleaning up expired stories:', error);
    }
  }

  async markStoryAsViewed(id: string, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const storiesRepo = this.transactionManager.getRepository(this.storiesRepository);
      const story = await storiesRepo.findOne({
        where: {
          id: id,
          expiresAt: MoreThan(new Date())
        }
      });
      if (!story) throw new Error('Story not found or has expired');
      story.views = story.views ? story.views + 1 : 1;
      const updatedStory = await storiesRepo.save(story);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Story marked as viewed', updatedStory);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error marking story as viewed:', error);
      return new CommonResponse(false, 500, 'Error marking story as viewed', error);
    }
  }
}
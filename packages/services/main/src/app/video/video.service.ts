import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CommonResponse, CreateVideoModel, LikeVideoModel, UpdateVideoModel, VideoIdRequestModel } from '@in-one/shared-models';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import { UserEntity } from '../user/entities/user.entity';
import { VideoEntity } from './enitities/video.entity';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { GetVideoByIdModel } from './models/get-video-by-id.model';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { VideoRepository } from './repository/video.repository';

@Injectable()
export class VideoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(VideoRepository)
    private readonly videoRepository: VideoRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @Inject('CLOUDINARY') private readonly cloudinary: any,
  ) { }

  private async uploadToCloudinary(
    file: Express.Multer.File,
    resourceType: 'video' | 'image' = 'video',
    folder: string = 'videos'
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      // Handle memory storage (file.buffer)
      if (file.buffer) {
        const stream = new Readable();
        stream.push(file.buffer);
        stream.push(null);
        stream.pipe(
          this.cloudinary.uploader.upload_stream(
            { resource_type: resourceType, folder },
            (error: any, result: UploadApiResponse) => {
              if (error || !result) reject(error || new Error('Upload failed'));
              else resolve(result);
            }
          )
        );
      }
      // Handle disk storage (file.path)
      else if (file.path) {
        const stream = fs.createReadStream(file.path);
        stream.pipe(
          this.cloudinary.uploader.upload_stream(
            { resource_type: resourceType, folder },
            (error: any, result: UploadApiResponse) => {
              if (error || !result) reject(error || new Error('Upload failed'));
              else {
                // Clean up the temporary file after upload
                fs.unlink(file.path, (err) => {
                  if (err) console.error('Failed to delete temp file:', err);
                });
                resolve(result);
              }
            }
          )
        );
      } else {
        reject(new Error('File buffer and path are both unavailable'));
      }
    });
  }

  async createVideo(reqModel: CreateVideoModel, videoFile: Express.Multer.File, thumbnailFile?: Express.Multer.File): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate userId
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      // Upload video to Cloudinary
      const videoUploadResult = await this.uploadToCloudinary(videoFile, 'video', 'videos');

      // Upload thumbnail if provided
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        const thumbnailUploadResult = await this.uploadToCloudinary(thumbnailFile, 'image', 'thumbnails');
        thumbnailUrl = thumbnailUploadResult.secure_url;
      }

      await transactionManager.startTransaction();

      const newVideo = transactionManager.getRepository(VideoEntity).create({
        title: reqModel.title,
        description: reqModel.description,
        videoUrl: videoUploadResult.secure_url,
        thumbnailUrl,
        userId: reqModel.userId,
        visibility: reqModel.visibility || 'public',
        duration: reqModel.duration,
        status: 'processing',
        likes: 0,
        views: 0,
        dislikes: 0,
        isFeatured: reqModel.isFeatured || false,
      });

      const savedVideo = await transactionManager.getRepository(VideoEntity).save(newVideo);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Video uploaded successfully', savedVideo);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload video';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async getAllVideos(): Promise<CommonResponse> {
    try {
      const videos = await this.videoRepository.find();
      return new CommonResponse(true, 200, 'Videos fetched successfully', videos);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch videos';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async getVideoById(reqModel: GetVideoByIdModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      await transactionManager.startTransaction();

      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('Video not found');
      }

      const author = await this.userRepository.findOne({ where: { id: video.userId } });
      if (!author) {
        throw new Error('Author not found');
      }

      const comments = await this.commentRepository.find({ where: { videoId: reqModel.videoId } });
      const likes = await this.likeRepository.find({ where: { videoId: reqModel.videoId } });

      // Fetch authors for comments
      const commentAuthors = await Promise.all(
        comments.map(async (comment) => {
          const commentAuthor = await this.userRepository.findOne({ where: { id: comment.userId } });
          return {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            author: commentAuthor
              ? {
                id: commentAuthor.id,
                username: commentAuthor.username,
                avatarUrl: commentAuthor.profilePicture,
              }
              : null,
          };
        }),
      );

      const formattedVideo = {
        id: video.id,
        videoUrl: video.videoUrl,
        title: video.title,
        description: video.description,
        createdAt: video.createdAt.toISOString(),
        views: video.views,
        likes: likes.map((like) => ({ user: { id: like.userId } })),
        author: {
          id: author.id,
          username: author.username,
          avatarUrl: author.profilePicture,
        },
        comments: commentAuthors.filter((comment) => comment.author !== null),
      };

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video retrieved successfully', formattedVideo);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch video';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async updateVideo(reqModel: UpdateVideoModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('Video not found');
      }

      await transactionManager.startTransaction();

      // Update only provided fields
      const updateData: Partial<VideoEntity> = {};
      if (reqModel.title) updateData.title = reqModel.title;
      if (reqModel.description !== undefined) updateData.description = reqModel.description;
      if (reqModel.visibility) updateData.visibility = reqModel.visibility;
      if (reqModel.thumbnailUrl) updateData.thumbnailUrl = reqModel.thumbnailUrl;
      if (reqModel.duration !== undefined) updateData.duration = reqModel.duration;
      if (reqModel.status) updateData.status = reqModel.status;
      if (reqModel.isFeatured !== undefined) updateData.isFeatured = reqModel.isFeatured;

      await transactionManager.getRepository(VideoEntity).update(reqModel.videoId, updateData);
      const updatedVideo = await transactionManager.getRepository(VideoEntity).findOneOrFail({ where: { id: reqModel.videoId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video updated successfully', updatedVideo);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to update video';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async deleteVideo(reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('Video not found');
      }

      await transactionManager.startTransaction();

      // Delete video from Cloudinary
      const videoPublicId = video.videoUrl.split('/').pop()?.split('.')[0];
      if (videoPublicId) {
        await this.cloudinary.uploader.destroy(videoPublicId, { resource_type: 'video' });
      }

      // Delete thumbnail from Cloudinary if exists
      if (video.thumbnailUrl) {
        const thumbnailPublicId = video.thumbnailUrl.split('/').pop()?.split('.')[0];
        if (thumbnailPublicId) {
          await this.cloudinary.uploader.destroy(thumbnailPublicId, { resource_type: 'image' });
        }
      }

      await transactionManager.getRepository(VideoEntity).delete(reqModel.videoId);
      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete video';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async likeVideo(reqModel: LikeVideoModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate userId
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('Video not found');
      }

      await transactionManager.startTransaction();

      // Increment likes
      await transactionManager.getRepository(VideoEntity).update(reqModel.videoId, { likes: video.likes + 1 });
      const updatedVideo = await transactionManager.getRepository(VideoEntity).findOneOrFail({ where: { id: reqModel.videoId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video liked successfully', updatedVideo);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to like video';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async unlikeVideo(reqModel: LikeVideoModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate userId
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('Video not found');
      }

      await transactionManager.startTransaction();

      // Decrement likes, ensuring it doesn't go below 0
      const newLikes = video.likes > 0 ? video.likes - 1 : 0;
      await transactionManager.getRepository(VideoEntity).update(reqModel.videoId, { likes: newLikes });
      const updatedVideo = await transactionManager.getRepository(VideoEntity).findOneOrFail({ where: { id: reqModel.videoId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video unliked successfully', updatedVideo);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlike video';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }
}

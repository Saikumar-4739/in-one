import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CommentIdRequestModel, CommonResponse, CreateVideoModel, TogglelikeModel, UpdateVideoModel, UserIdRequestModel, VideoCommentModel, VideoIdRequestModel, VideoUpdateCommentModel } from '@in-one/shared-models';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import { UserEntity } from '../user/entities/user.entity';
import { VideoEntity } from './enitities/video.entity';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
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
      const videos = await this.videoRepository.find({ where: { isDeleted: false }});

      const videoIds = videos.filter((video) => video !== null && video !== undefined).map((video) => video.id);

      let likes: LikeEntity[] = [];
      if (videoIds.length > 0) {
        likes = await this.likeRepository
          .createQueryBuilder('like')
          .select(['like.entityId', 'like.userId'])
          .where('like.entityId IN (:...videoIds)', { videoIds })
          .andWhere('like.entityType = :entityType', { entityType: 'video' })
          .andWhere('like.userId IS NOT NULL')
          .getMany();
      }

      const likesByVideoId = likes.reduce((acc, like) => {
        if (!acc[like.entityId]) {
          acc[like.entityId] = [];
        }
        acc[like.entityId].push({ user: { id: like.userId } });
        return acc;
      }, {} as Record<string, { user: { id: string } }[]>);

      const formattedVideos = videos
        .filter((video) => video !== null && video !== undefined)
        .map((video) => ({
          id: video.id,
          videoUrl: video.videoUrl,
          title: video.title,
          description: video.description,
          createdAt: video.createdAt.toISOString(),
          views: video.views ?? 0,
          likes: likesByVideoId[video.id] || [],
          likeCount: video.likes ?? 0,
        }));
      return new CommonResponse(true, 200, 'Videos fetched successfully', formattedVideos);
    } catch (error) {
      return new CommonResponse(false, 500, 'Videos Fetching Failed');
    }
  }

  async getVideoById(reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('Video not found');
      }

      const author = await this.userRepository.findOne({ where: { id: video.userId } });
      if (!author) {
        throw new Error('Author not found');
      }

      const comments = await this.commentRepository.find({ where: { videoId: reqModel.videoId } });
      const likes = await this.likeRepository.find({where: { entityId: reqModel.videoId, entityType: 'video' }});

      const commentAuthors = await Promise.all( comments.map(async (comment) => {
          const commentAuthor = await this.userRepository.findOne({ where: { id: comment.userId } });
          return {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt.toISOString(),
            author: commentAuthor ? { id: commentAuthor.id, username: commentAuthor.username, avatarUrl: commentAuthor.profilePicture,}: null,
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
        likeCount: likes.length, 
        author: {
          id: author.id,
          username: author.username,
          avatarUrl: author.profilePicture,
        },
        comments: commentAuthors.filter((comment) => comment.author !== null),
      };

      return new CommonResponse(true, 200, 'Video retrieved successfully', formattedVideo);
    } catch (error) {
      return new CommonResponse( false, 1, 'Failed to fetch video', error);
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
      return new CommonResponse( false, 1, 'Video Update failed', error);
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
      return new CommonResponse( false, 1, 'Failed to delete video', error);
    }
  }

  async getFeaturedVideos(): Promise<CommonResponse> {
    try {
      const featuredVideos = await this.videoRepository.find({ where: { isFeatured: true } });
      return new CommonResponse(true, 200, 'Featured videos fetched successfully', featuredVideos);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch featured videos';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async incrementViews(reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('Video not found');
      }

      await transactionManager.startTransaction();
      await transactionManager.getRepository(VideoEntity).update(reqModel.videoId, { views: video.views + 1 });
      const updatedVideo = await transactionManager.getRepository(VideoEntity).findOneOrFail({ where: { id: reqModel.videoId } });
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Video views incremented', updatedVideo);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to increment views';
      return new CommonResponse(false, errorMessage.includes('not found') ? 404 : 500, errorMessage);
    }
  }

  async searchVideos(query: string): Promise<CommonResponse> {
    try {
      const videos = await this.videoRepository
        .createQueryBuilder('video')
        .where('video.title LIKE :query OR video.description LIKE :query', { query: `%${query}%` })
        .getMany();

      return new CommonResponse(true, 200, 'Search results fetched', videos);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search videos';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async markAsFeatured(reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      await this.videoRepository.update(reqModel.videoId, { isFeatured: true });
      return new CommonResponse(true, 200, 'Video marked as featured');
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to mark video as featured');
    }
  }

  async getVideosByUser(reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      const videos = await this.videoRepository.find({ where: { userId: reqModel.userId } });
      return new CommonResponse(true, 200, 'Videos fetched by user', videos);
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to fetch videos by user');
    }
  }

  async toggleLike(reqModel: TogglelikeModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      await transactionManager.startTransaction();
      const existing = await this.likeRepository.findOne({
        where: { entityId: reqModel.videoId, userId: reqModel.userId, entityType: 'video' },
      });
      const video = await this.videoRepository.findOne({
        where: { id: reqModel.videoId },
      });

      if (!video) {
        throw new Error('Video not found');
      }

      if (existing) {
        await this.likeRepository.delete({
          entityId: reqModel.videoId,
          userId: reqModel.userId,
          entityType: 'video',
        });
        await this.videoRepository.update(reqModel.videoId, {
          likes: video.likes - 1,
        });
        await transactionManager.commitTransaction();
        return new CommonResponse(true, 200, 'Video unliked');
      } else {
        const like = this.likeRepository.create({
          entityId: reqModel.videoId,
          userId: reqModel.userId,
          entityType: 'video',
        });
        await this.likeRepository.save(like);
        await this.videoRepository.update(reqModel.videoId, {
          likes: video.likes + 1,
        });
        await transactionManager.commitTransaction();
        return new CommonResponse(true, 200, 'Video liked');
      }
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Video Like Failed', error);
    }
  }

  async createComment(reqModel: VideoCommentModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) {
        throw new Error('video not found');
      }

      await transactionManager.startTransaction();

      const newComment = transactionManager.getRepository(CommentEntity).create({
        content: reqModel.content,
        userId: reqModel.userId,
        videoId: reqModel.videoId,
      });

      const savedComment = await transactionManager.getRepository(CommentEntity).save(newComment);
      await transactionManager.getRepository(VideoEntity).update(reqModel.videoId, { commentsCount: video.commentsCount + 1 });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Comment created successfully', savedComment);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, `Error cretae comment: ${error}`);
    }
  }

  async getVideoComments(reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      const comments = await this.commentRepository.find({
        where: { videoId: reqModel.videoId },
        order: { createdAt: 'DESC' },
      });
      return new CommonResponse(true, 200, 'Comments fetched successfully', comments);
    } catch (error) {
      return new CommonResponse(false, 500, `Error fetching comments: ${error}`);
    }
  }

  async updateComment(reqModel: VideoUpdateCommentModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const comment = await this.commentRepository.findOne({ where: { id: reqModel.commentId } });
      if (!comment) {
        throw new Error('Comment not found');
      }

      await transactionManager.startTransaction();

      await transactionManager.getRepository(CommentEntity).update(reqModel.commentId, { content: reqModel.content });
      const updatedComment = await this.commentRepository.findOneOrFail({ where: { id: reqModel.commentId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment updated successfully', updatedComment);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, `Error updating comment: ${error}`);
    }
  }

  async deleteComment(reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const comment = await this.commentRepository.findOne({ where: { id: reqModel.commentId } });
      if (!comment) {
        throw new Error('Comment not found');
      }

      await transactionManager.startTransaction();

      const videoId = comment.videoId;
      if (videoId) {
        const video = await this.videoRepository.findOne({ where: { id: videoId } });
        if (video && video.commentsCount > 0) {
          await transactionManager.getRepository(VideoEntity).update(videoId, { commentsCount: video.commentsCount - 1 });
        }
      }

      await transactionManager.getRepository(CommentEntity).delete({ id: reqModel.commentId });
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Comment deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, `Error deleting comment: ${error}`);
    }
  }
}

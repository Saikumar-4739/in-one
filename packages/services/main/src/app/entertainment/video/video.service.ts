import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoEntity } from '../entities/video.entity';
import { CommentEntity } from '../entities/comment.entity';
import { LikeEntity } from '../entities/like.entity';
import { CommonResponse, CreateVideoModel, LikeVideoModel, UpdateVideoModel, VideoIdRequestModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(VideoEntity) private readonly videoRepository: Repository<VideoEntity>,
    @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity) private readonly likeRepository: Repository<LikeEntity>,
    private readonly transactionManager: GenericTransactionManager,
    @Inject('CLOUDINARY') private readonly cloudinary: any,
  ) {}

  private async uploadToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
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
            { resource_type: 'video', folder: 'videos' },
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
            { resource_type: 'video', folder: 'videos' },
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

  async createVideo(reqModel: CreateVideoModel, file: Express.Multer.File): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const videoRepo = this.transactionManager.getRepository(this.videoRepository);
      const uploadResult = await this.uploadToCloudinary(file);
      const newVideo = videoRepo.create({
        ...reqModel,
        author: { id: reqModel.userId },
        videoUrl: uploadResult.secure_url,
      });
      const savedVideo = await videoRepo.save(newVideo);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Video uploaded successfully', savedVideo);
    } catch (error) {
      console.error('Create video error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to upload video');
    }
  }
  
  async getAllVideos(): Promise<CommonResponse> {
    try {
      const videos = await this.videoRepository.find({ relations: ['author', 'comments', 'likes'] });
      return new CommonResponse(true, 200, 'Videos fetched successfully', videos);
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to fetch videos');
    }
  }

  async updateVideo(reqModel: UpdateVideoModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const videoRepo = this.transactionManager.getRepository(this.videoRepository);
      await videoRepo.update(reqModel.videoId, reqModel);
      const updatedVideo = await videoRepo.findOneOrFail({ where: { id: reqModel.videoId } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video updated successfully', updatedVideo);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to update video');
    }
  }

  async deleteVideo(reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const video = await this.videoRepository.findOneOrFail({ where: { id: reqModel.videoId } });
      const publicId = video.videoUrl.split('/').pop()?.split('.')[0];
      if (publicId) await this.cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      
      await Promise.all([
        this.commentRepository.delete({ video: { id: reqModel.videoId } }),
        this.likeRepository.delete({ video: { id: reqModel.videoId } }),
        this.videoRepository.delete(reqModel.videoId)
      ]);
      
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, error instanceof Error && error.message.includes('not found') ? 404 : 500, 
       'Failed to delete video');
    }
  }

  async likeVideo(reqModel: LikeVideoModel): Promise<CommonResponse> {
    try {
      const video = await this.videoRepository.findOneOrFail({ where: { id: reqModel.videoId } });
      const like = this.likeRepository.create({ video, user: { id: reqModel.userId } });
      await this.likeRepository.save(like);
      return new CommonResponse(true, 200, 'Video liked successfully');
    } catch (error) {
      return new CommonResponse(false, error instanceof Error && error.message.includes('not found') ? 404 : 500, 
         'Failed to like video');
    }
  }

  async unlikeVideo(reqModel: LikeVideoModel): Promise<CommonResponse> {
    try {
      const like = await this.likeRepository.findOneOrFail({ 
        where: { video: { id: reqModel.videoId }, user: { id: reqModel.userId } }
      });
      await this.likeRepository.delete(like.id);
      return new CommonResponse(true, 200, 'Video unliked successfully');
    } catch (error) {
      return new CommonResponse(false, error instanceof Error && error.message.includes('not found') ? 404 : 500, 
         'Failed to unlike video');
    }
  }
}
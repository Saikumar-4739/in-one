import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VideoEntity } from '../entities/video.entity';
import { CommentEntity } from '../entities/comment.entity';
import { LikeEntity } from '../entities/like.entity';
import { CommonResponse, CreateVideoModel, LikeVideoModel, UpdateVideoModel, VideoIdRequestModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { v2 as cloudinary, UploadApiResponse, ConfigOptions } from 'cloudinary';
import * as cloudinaryInterface from '../cloudinary/cloudinary.interface';
import { Readable } from 'stream';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(VideoEntity) private readonly videoRepository: Repository<VideoEntity>,
    @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity) private readonly likeRepository: Repository<LikeEntity>,
    private readonly transactionManager: GenericTransactionManager,
    @Inject('CLOUDINARY') private readonly cloudinary: cloudinaryInterface.CloudinaryService,
  ) {}

  async uploadToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'videos' },
        (error, result) => {
          if (error || !result) {
            reject(new Error('Cloudinary upload failed: ' + (error?.message || 'Unknown error')));
          } else {
            resolve(result);
          }
        },
      );
      readableStream.pipe(uploadStream); 
    });
  }

  async createVideo(reqModel: CreateVideoModel, file: Express.Multer.File): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const uploadResult = await this.uploadToCloudinary(file);
      const videoRepo = this.transactionManager.getRepository(this.videoRepository);
      const newVideo = videoRepo.create({
        ...reqModel,
        author: { id: reqModel.userId },
        videoUrl: uploadResult.secure_url,
      });
      const savedVideo = await videoRepo.save(newVideo);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Video uploaded successfully', savedVideo);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to upload video');
    }
  }

  async getAllVideos(): Promise<CommonResponse> {
    try {
      const videos = await this.videoRepository.find({
        relations: ['author', 'comments', 'likes'],
      });
      return new CommonResponse(true, 200, 'Videos fetched successfully', videos);
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to fetch videos');
    }
  }

  async updateVideo(reqModel: UpdateVideoModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const videoRepo = this.transactionManager.getRepository(this.videoRepository);
      await videoRepo.update(reqModel.videoId, reqModel);
      const updatedVideo = await videoRepo.findOne({ where: { id: reqModel.videoId } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video updated successfully', updatedVideo);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to update video');
    }
  }

  async deleteVideo(reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) return new CommonResponse(false, 404, 'Video not found');
      const cloudinaryPublicId = video.videoUrl.split('/').pop()?.split('.')[0];
      if (cloudinaryPublicId) {
        await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'video' });
      }
      await this.commentRepository.delete({ video: { id : reqModel.videoId } });
      await this.likeRepository.delete({ video: { id: reqModel.videoId } });
      await this.videoRepository.delete(reqModel.videoId);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to delete video');
    }
  }

  async likeVideo(reqModel: LikeVideoModel): Promise<CommonResponse> {
    try {
      const video = await this.videoRepository.findOne({ where: { id: reqModel.videoId } });
      if (!video) return new CommonResponse(false, 404, 'Video not found');
      const like = this.likeRepository.create({ video, user: { id: reqModel.userId } });
      await this.likeRepository.save(like);
      return new CommonResponse(true, 200, 'Video liked successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to like video');
    }
  }

  async unlikeVideo(reqModel: LikeVideoModel): Promise<CommonResponse> {
    try {
      const like = await this.likeRepository.findOne({ where: { video: { id: reqModel.videoId }, user: { id: reqModel.userId } } });
      if (!like) return new CommonResponse(false, 404, 'Like not found');
      await this.likeRepository.delete({ id: like.id });
      return new CommonResponse(true, 200, 'Video unliked successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to unlike video');
    }
  }
}

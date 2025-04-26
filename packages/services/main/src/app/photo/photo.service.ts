import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PhotoEntity } from './entities/photo.entity';
import { UserEntity } from '../user/entities/user.entity';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { CommentIdRequestModel, CommonResponse, CreatePhotoModel, PhotoCommentModel, PhotoIdRequestModel, PhotoTogglelikeModel, UpdatePhotoModel, VideoUpdateCommentModel } from '@in-one/shared-models';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as cloudinaryInterface from '../masters/cloudinary/cloudinary.interface';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { PhotoRepository } from './repository/photo.repository';

@Injectable()
export class PhotoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PhotoRepository)
    private readonly photoRepository: PhotoRepository,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,
    @Inject('CLOUDINARY') private readonly cloudinary: cloudinaryInterface.CloudinaryService
  ) { }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const uploadOptions = { resource_type: 'image', folder: 'photos' };

      if (file.buffer) {
        const stream = new Readable();
        stream.push(file.buffer);
        stream.push(null);
        stream.pipe(
          this.cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: any, result?: UploadApiResponse) => {
              if (error || !result) reject(error || new Error('Upload failed'));
              else resolve(result.secure_url);
            }
          )
        );
      } else if (file.path) {
        const stream = fs.createReadStream(file.path);
        stream.pipe(
          this.cloudinary.uploader.upload_stream(
            uploadOptions,
            (error: any, result?: UploadApiResponse) => {
              if (error || !result) {
                reject(error || new Error('Upload failed'));
              } else {
                fs.unlink(file.path, (err) => {
                  if (err) console.error('Failed to delete temp file:', err);
                });
                resolve(result.secure_url);
              }
            }
          )
        );
      } else {
        reject(new Error('File buffer and path are both unavailable'));
      }
    });
  }

  async createPhoto(reqModel: CreatePhotoModel, file: Express.Multer.File): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const imageUrl = await this.uploadToCloudinary(file);

      await transactionManager.startTransaction();

      const newPhoto = transactionManager.getRepository(PhotoEntity).create({
        caption: reqModel.caption,
        imageUrl,
        userId: reqModel.userId,
        visibility: reqModel.visibility || 'public',
        likes: 0,
        commentsCount: 0,
      });

      const savedPhoto = await transactionManager.getRepository(PhotoEntity).save(newPhoto);
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 0, 'Photo uploaded successfully', savedPhoto);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse( false, 1, 'upload photo failed', error);
    }
  }

  async getAllPhotos(): Promise<CommonResponse> {
    try {
      const photos = await this.photoRepository.find();
      return new CommonResponse(true, 0, 'Photos fetched successfully', photos);
    } catch (error) {
      return new CommonResponse( false, 1, 'Failed to fetch photos', error);
    }
  }

  async updatePhoto(reqModel: UpdatePhotoModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        throw new Error('Photo not found');
      }

      await transactionManager.startTransaction();

      const updateData: Partial<PhotoEntity> = {};
      if (reqModel.caption !== undefined) updateData.caption = reqModel.caption;
      if (reqModel.visibility) updateData.visibility = reqModel.visibility;

      await transactionManager.getRepository(PhotoEntity).update(reqModel.photoId, updateData);
      const updatedPhoto = await this.photoRepository.findOneOrFail({ where: { id: reqModel.photoId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo updated successfully', updatedPhoto);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse( false, 1, 'Failed to update photo', error);
    }
  }

  async deletePhoto(reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        throw new Error('Photo not found');
      }

      await transactionManager.startTransaction();

      const cloudinaryPublicId = photo.imageUrl.split('/').pop()?.split('.')[0];
      if (cloudinaryPublicId) {
        await this.cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'image' });
      }

      // Delete associated comments and likes
      await transactionManager.getRepository(CommentEntity).delete({ photoId: reqModel.photoId });
      await transactionManager.getRepository(LikeEntity).delete({ entityId: reqModel.photoId });

      await transactionManager.getRepository(PhotoEntity).delete({ id: reqModel.photoId });
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Photo deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo';
      return new CommonResponse( false, 1, 'Failed to delete photo', error);
    }
  }

  async toggleLike(reqModel: PhotoTogglelikeModel): Promise<CommonResponse> {
      const transactionManager = new GenericTransactionManager(this.dataSource);
      try {
        await transactionManager.startTransaction();
        const existing = await this.likeRepository.findOne({ where: { entityId: reqModel.photoId, userId: reqModel.userId, entityType: 'photo' }});
        const video = await this.photoRepository.findOne({ where: { id: reqModel.photoId }});
  
        if (!video) {
          throw new Error('Photo not found');
        }
  
        if (existing) {
          await this.likeRepository.delete({ entityId: reqModel.photoId, userId: reqModel.userId, entityType: 'photo'});
          await this.photoRepository.update(reqModel.photoId, { likes: video.likes - 1});
          await transactionManager.commitTransaction();
          return new CommonResponse(true, 200, 'Photo unliked');
        } else {
          const like = this.likeRepository.create({ entityId: reqModel.photoId, userId: reqModel.userId, entityType: 'photo'});
          await this.likeRepository.save(like);
          await this.photoRepository.update(reqModel.photoId, { likes: video.likes + 1});
          await transactionManager.commitTransaction();
          return new CommonResponse(true, 200, 'Photo liked');
        }
      } catch (error) {
        await transactionManager.rollbackTransaction();
        return new CommonResponse(false, 500, 'Photo Like Failed', error);
      }
    }

  async createComment(reqModel: PhotoCommentModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        throw new Error('Photo not found');
      }

      await transactionManager.startTransaction();

      const newComment = transactionManager.getRepository(CommentEntity).create({ content: reqModel.content, userId: reqModel.userId, photoId: reqModel.photoId});
      const savedComment = await transactionManager.getRepository(CommentEntity).save(newComment);
      await transactionManager.getRepository(PhotoEntity).update(reqModel.photoId, { commentsCount: photo.commentsCount + 1 });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Comment created successfully', savedComment);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to create comment', error);
    }
  }

  async getPhotoComments(reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    try {
      const comments = await this.commentRepository.find({ where: { photoId: reqModel.photoId }, order: { createdAt: 'DESC' }});
      return new CommonResponse(true, 200, 'Comments fetched successfully', comments);
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to fetch comments', error);
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
      return new CommonResponse(false, 500, 'Failed to update comment', error);
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

      const photoId = comment.photoId;
      if (photoId) {
        const photo = await this.photoRepository.findOne({ where: { id: photoId } });
        if (photo && photo.commentsCount > 0) {
          await transactionManager.getRepository(PhotoEntity).update(photoId, { commentsCount: photo.commentsCount - 1 });
        }
      }

      await transactionManager.getRepository(CommentEntity).delete({ id: reqModel.commentId });
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Comment deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to delete comment', error);
    }
  }
}

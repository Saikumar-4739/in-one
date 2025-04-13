import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotoEntity } from './entities/photo.entity';
import { UserEntity } from '../user/entities/user.entity';
import { CommentEntity } from '../masters/common-entities/comment.entity';
import { LikeEntity } from '../masters/common-entities/like.entity';
import { CommonResponse, CreatePhotoModel, LikeRequestModel, PhotoIdRequestModel, UpdatePhotoModel } from '@in-one/shared-models';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as cloudinaryInterface from '../masters/cloudinary/cloudinary.interface';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

interface CreateCommentModel {
  photoId: string;
  userId: string;
  content: string;
}

interface CommentIdRequestModel {
  commentId: string;
}

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(PhotoEntity) private readonly photoRepository: Repository<PhotoEntity>,
    @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity) private readonly likeRepository: Repository<LikeEntity>,
    private readonly transactionManager: GenericTransactionManager,
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
    try {
      await this.transactionManager.startTransaction();
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      // Validate userId
      const user = await userRepo.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }

      const imageUrl = await this.uploadToCloudinary(file);
      const newPhoto = photoRepo.create({
        caption: reqModel.caption,
        imageUrl,
        userId: reqModel.userId,
        visibility: reqModel.visibility || 'public',
        likes: 0,
        commentsCount: 0,
      });

      const savedPhoto = await photoRepo.save(newPhoto);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Photo uploaded successfully', savedPhoto);
    } catch (error) {
      console.error('Create photo error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to upload photo');
    }
  }

  async getAllPhotos(): Promise<CommonResponse> {
    try {
      const photos = await this.photoRepository.find();
      return new CommonResponse(true, 200, 'Photos fetched successfully', photos);
    } catch (error) {
      console.error('Get photos error:', error);
      return new CommonResponse(false, 500, 'Failed to fetch photos');
    }
  }

  async updatePhoto(reqModel: UpdatePhotoModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);

      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Photo not found');
      }

      const updateData: Partial<PhotoEntity> = {};
      if (reqModel.caption !== undefined) updateData.caption = reqModel.caption;
      if (reqModel.visibility) updateData.visibility = reqModel.visibility;

      await photoRepo.update(reqModel.photoId, updateData);
      const updatedPhoto = await photoRepo.findOneOrFail({ where: { id: reqModel.photoId } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo updated successfully', updatedPhoto);
    } catch (error) {
      console.error('Update photo error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        error instanceof Error && error.message.includes('not found') ? 404 : 500,
        'Failed to update photo'
      );
    }
  }

  async deletePhoto(reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);

      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Photo not found');
      }

      const cloudinaryPublicId = photo.imageUrl.split('/').pop()?.split('.')[0];
      if (cloudinaryPublicId) {
        await this.cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'image' });
      }

      // Delete associated comments and likes
      await commentRepo.delete({ photoId: reqModel.photoId });
      await likeRepo.delete({ photoId: reqModel.photoId });

      await photoRepo.delete({ id: reqModel.photoId });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo deleted successfully');
    } catch (error) {
      console.error('Delete photo error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        error instanceof Error && error.message.includes('not found') ? 404 : 500,
        'Failed to delete photo'
      );
    }
  }

  async likePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);

      // Validate userId
      const user = await userRepo.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }

      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Photo not found');
      }

      // Check for existing like
      const existingLike = await likeRepo.findOne({
        where: { userId: reqModel.userId, photoId: reqModel.photoId },
      });
      if (existingLike) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 400, 'Photo already liked');
      }

      // Create like record
      const like = likeRepo.create({
        userId: reqModel.userId,
        photoId: reqModel.photoId,
      });
      await likeRepo.save(like);

      // Increment likes counter
      await photoRepo.update(reqModel.photoId, { likes: photo.likes + 1 });
      const updatedPhoto = await photoRepo.findOneOrFail({ where: { id: reqModel.photoId } });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo liked successfully', updatedPhoto);
    } catch (error) {
      console.error('Like photo error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        error instanceof Error && error.message.includes('not found') ? 404 : 500,
        'Failed to like photo'
      );
    }
  }

  async unlikePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);

      // Validate userId
      const user = await userRepo.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }

      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Photo not found');
      }

      // Find and delete like record
      const like = await likeRepo.findOne({
        where: { userId: reqModel.userId, photoId: reqModel.photoId },
      });
      if (!like) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Like not found');
      }

      await likeRepo.delete({ id: like.id });

      // Decrement likes counter, ensuring it doesn't go below 0
      const newLikes = photo.likes > 0 ? photo.likes - 1 : 0;
      await photoRepo.update(reqModel.photoId, { likes: newLikes });
      const updatedPhoto = await photoRepo.findOneOrFail({ where: { id: reqModel.photoId } });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo unliked successfully', updatedPhoto);
    } catch (error) {
      console.error('Unlike photo error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        error instanceof Error && error.message.includes('not found') ? 404 : 500,
        'Failed to unlike photo'
      );
    }
  }

  async createComment(reqModel: CreateCommentModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const userRepo = this.transactionManager.getRepository(this.userRepository);

      // Validate userId
      const user = await userRepo.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'User not found');
      }

      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Photo not found');
      }

      const newComment = commentRepo.create({
        content: reqModel.content,
        userId: reqModel.userId,
        photoId: reqModel.photoId,
      });

      const savedComment = await commentRepo.save(newComment);
      await photoRepo.update(reqModel.photoId, { commentsCount: photo.commentsCount + 1 });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Comment created successfully', savedComment);
    } catch (error) {
      console.error('Create comment error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        error instanceof Error && error.message.includes('not found') ? 404 : 500,
        'Failed to create comment'
      );
    }
  }

  async getPhotoComments(photoId: string): Promise<CommonResponse> {
    try {
      const comments = await this.commentRepository.find({
        where: { photoId },
        order: { createdAt: 'DESC' },
      });
      return new CommonResponse(true, 200, 'Comments fetched successfully', comments);
    } catch (error) {
      console.error('Get comments error:', error);
      return new CommonResponse(false, 500, 'Failed to fetch comments');
    }
  }

  async updateComment(commentId: string, content: string): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);

      const comment = await commentRepo.findOne({ where: { id: commentId } });
      if (!comment) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Comment not found');
      }

      await commentRepo.update(commentId, { content });
      const updatedComment = await commentRepo.findOneOrFail({ where: { id: commentId } });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment updated successfully', updatedComment);
    } catch (error) {
      console.error('Update comment error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        error instanceof Error && error.message.includes('not found') ? 404 : 500,
        'Failed to update comment'
      );
    }
  }

  async deleteComment(reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    try {
      await this.transactionManager.startTransaction();
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);

      const comment = await commentRepo.findOne({ where: { id: reqModel.commentId } });
      if (!comment) {
        await this.transactionManager.rollbackTransaction();
        return new CommonResponse(false, 404, 'Comment not found');
      }

      const photoId = comment.photoId;
      if (photoId) {
        const photo = await photoRepo.findOne({ where: { id: photoId } });
        if (photo && photo.commentsCount > 0) {
          await photoRepo.update(photoId, { commentsCount: photo.commentsCount - 1 });
        }
      }

      await commentRepo.delete({ id: reqModel.commentId });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment deleted successfully');
    } catch (error) {
      console.error('Delete comment error:', error);
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(
        false,
        error instanceof Error && error.message.includes('not found') ? 404 : 500,
        'Failed to delete comment'
      );
    }
  }
}

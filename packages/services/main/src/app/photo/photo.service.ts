import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { PhotoRepository } from './repository/photo.repository';

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
      // Validate userId
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

      return new CommonResponse(true, 201, 'Photo uploaded successfully', savedPhoto);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload photo';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async getAllPhotos(): Promise<CommonResponse> {
    try {
      const photos = await this.photoRepository.find();
      return new CommonResponse(true, 200, 'Photos fetched successfully', photos);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch photos';
      return new CommonResponse(false, 500, errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update photo';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
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
      await transactionManager.getRepository(LikeEntity).delete({ photoId: reqModel.photoId });

      await transactionManager.getRepository(PhotoEntity).delete({ id: reqModel.photoId });
      await transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Photo deleted successfully');
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }

  async likePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate userId and photoId
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        throw new Error('Photo not found');
      }

      // Check for existing like
      const existingLike = await this.likeRepository.findOne({
        where: { userId: reqModel.userId, photoId: reqModel.photoId },
      });
      if (existingLike) {
        throw new Error('Photo already liked');
      }

      await transactionManager.startTransaction();

      // Create like record
      const like = transactionManager.getRepository(LikeEntity).create({
        userId: reqModel.userId,
        photoId: reqModel.photoId,
      });
      await transactionManager.getRepository(LikeEntity).save(like);

      // Increment likes counter
      await transactionManager.getRepository(PhotoEntity).update(reqModel.photoId, { likes: photo.likes + 1 });
      const updatedPhoto = await transactionManager.getRepository(PhotoEntity).findOneOrFail({ where: { id: reqModel.photoId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo liked successfully', updatedPhoto);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to like photo';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') || errorMessage.includes('already liked') ? 400 : 500,
        errorMessage
      );
    }
  }

  async unlikePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate userId and photoId
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        throw new Error('Photo not found');
      }

      // Find like record
      const like = await this.likeRepository.findOne({
        where: { userId: reqModel.userId, photoId: reqModel.photoId },
      });
      if (!like) {
        throw new Error('Like not found');
      }

      await transactionManager.startTransaction();

      // Delete like record
      await transactionManager.getRepository(LikeEntity).delete({ id: like.id });

      // Decrement likes counter, ensuring it doesn't go below 0
      const newLikes = photo.likes > 0 ? photo.likes - 1 : 0;
      await transactionManager.getRepository(PhotoEntity).update(reqModel.photoId, { likes: newLikes });
      const updatedPhoto = await this.photoRepository.findOneOrFail({ where: { id: reqModel.photoId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo unliked successfully', updatedPhoto);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlike photo';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 400 : 500,
        errorMessage
      );
    }
  }

  async createComment(reqModel: CreateCommentModel): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      // Validate userId and photoId
      const user = await this.userRepository.findOne({ where: { id: reqModel.userId } });
      if (!user) {
        throw new Error('User not found');
      }

      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        throw new Error('Photo not found');
      }

      await transactionManager.startTransaction();

      const newComment = transactionManager.getRepository(CommentEntity).create({
        content: reqModel.content,
        userId: reqModel.userId,
        photoId: reqModel.photoId,
      });

      const savedComment = await transactionManager.getRepository(CommentEntity).save(newComment);
      await transactionManager.getRepository(PhotoEntity).update(reqModel.photoId, { commentsCount: photo.commentsCount + 1 });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Comment created successfully', savedComment);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to create comment';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch comments';
      return new CommonResponse(false, 500, errorMessage);
    }
  }

  async updateComment(commentId: string, content: string): Promise<CommonResponse> {
    const transactionManager = new GenericTransactionManager(this.dataSource);
    try {
      const comment = await this.commentRepository.findOne({ where: { id: commentId } });
      if (!comment) {
        throw new Error('Comment not found');
      }

      await transactionManager.startTransaction();

      await transactionManager.getRepository(CommentEntity).update(commentId, { content });
      const updatedComment = await this.commentRepository.findOneOrFail({ where: { id: commentId } });

      await transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment updated successfully', updatedComment);
    } catch (error) {
      await transactionManager.rollbackTransaction();
      const errorMessage = error instanceof Error ? error.message : 'Failed to update comment';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete comment';
      return new CommonResponse(
        false,
        errorMessage.includes('not found') ? 404 : 500,
        errorMessage
      );
    }
  }
}

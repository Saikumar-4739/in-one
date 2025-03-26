import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotoEntity } from '../entities/photo.entity';
import { CommentEntity } from '../entities/comment.entity';
import { LikeEntity } from '../entities/like.entity';
import { CommonResponse, CreatePhotoModel, LikeRequestModel, PhotoIdRequestModel, UpdatePhotoModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as cloudinaryInterface from '../cloudinary/cloudinary.interface';

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
    @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity) private readonly likeRepository: Repository<LikeEntity>,
    private readonly transactionManager: GenericTransactionManager,
    @Inject('CLOUDINARY') private readonly cloudinary: cloudinaryInterface.CloudinaryService,
  ) {}

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
    await this.transactionManager.startTransaction();
    try {
      const imageUrl = await this.uploadToCloudinary(file);
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const newPhoto = photoRepo.create({
        ...reqModel,
        author: { id: reqModel.userId },
        imageUrl,
      });
      const savedPhoto = await photoRepo.save(newPhoto);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Photo uploaded successfully', savedPhoto);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to upload photo: ${error}`);
    }
  }

  async getAllPhotos(): Promise<CommonResponse> {
    try {
      const photos = await this.photoRepository.find({
        relations: ['author', 'comments'], // Removed 'likes' since it's not a relation
      });

      // Optionally, fetch like counts separately if needed
      const photosWithLikes = await Promise.all(
        photos.map(async (photo) => {
          const likeCount = await this.likeRepository.count({
            where: { photo: { id: photo.id } },
          });
          return { ...photo, likes: likeCount }; // Override the likes counter with actual count
        })
      );

      return new CommonResponse(true, 200, 'Photos fetched successfully', photosWithLikes);
    } catch (error) {
      console.log(error);
      throw new Error(`Failed to fetch photos: ${error}`);
    }
  }

  async updatePhoto(reqModel: UpdatePhotoModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        throw new Error('Photo not found');
      }
      await photoRepo.update(reqModel.photoId, reqModel);
      const updatedPhoto = await photoRepo.findOneOrFail({ where: { id: reqModel.photoId } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo updated successfully', updatedPhoto);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to update photo: ${error}`);
    }
  }

  async deletePhoto(reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) return new CommonResponse(false, 404, 'Photo not found');

      const cloudinaryPublicId = photo.imageUrl.split('/').pop()?.split('.')[0];
      if (cloudinaryPublicId) {
        await this.cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'image' });
      }

      await this.transactionManager.getRepository(this.commentRepository)
        .delete({ photo: { id: reqModel.photoId } });
      await this.transactionManager.getRepository(this.likeRepository)
        .delete({ photo: { id: reqModel.photoId } });
      await photoRepo.delete({ id: reqModel.photoId });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to delete photo: ${error}`);
    }
  }

  async likePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);

      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) return new CommonResponse(false, 404, 'Photo not found');

      const existingLike = await likeRepo.findOne({
        where: { photo: { id: reqModel.photoId }, user: { id: reqModel.userId } },
      });
      if (existingLike) return new CommonResponse(false, 400, 'Photo already liked');

      const like = likeRepo.create({ photo, user: { id: reqModel.userId } });
      await likeRepo.save(like);

      // Update the likes counter in PhotoEntity
      await photoRepo.increment({ id: reqModel.photoId }, 'likes', 1);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo liked successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to like photo: ${error}`);
    }
  }

  async unlikePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const likeRepo = this.transactionManager.getRepository(this.likeRepository);

      const like = await likeRepo.findOne({
        where: { photo: { id: reqModel.photoId }, user: { id: reqModel.userId } },
      });
      if (!like) return new CommonResponse(false, 404, 'Like not found');

      await likeRepo.delete({ id: like.id });

      // Decrement the likes counter in PhotoEntity
      await photoRepo.decrement({ id: reqModel.photoId }, 'likes', 1);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo unliked successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to unlike photo: ${error}`);
    }
  }

  async createComment(reqModel: CreateCommentModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);

      const photo = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      if (!photo) {
        return new CommonResponse(false, 404, 'Photo not found');
      }

      const newComment = commentRepo.create({
        content: reqModel.content,
        photo: { id: reqModel.photoId },
        author: { id: reqModel.userId },
      });

      const savedComment = await commentRepo.save(newComment);
      await photoRepo.increment({ id: reqModel.photoId }, 'commentsCount', 1);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Comment created successfully', savedComment);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to create comment: ${error}`);
    }
  }

  async getPhotoComments(photoId: string): Promise<CommonResponse> {
    try {
      const comments = await this.commentRepository.find({
        where: { photo: { id: photoId } },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      });
      return new CommonResponse(true, 200, 'Comments fetched successfully', comments);
    } catch (error) {
      throw new Error(`Failed to fetch comments: ${error}`);
    }
  }

  async updateComment(commentId: string, content: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const comment = await commentRepo.findOne({ where: { id: commentId } });
      
      if (!comment) {
        return new CommonResponse(false, 404, 'Comment not found');
      }

      await commentRepo.update(commentId, { content });
      const updatedComment = await commentRepo.findOneOrFail({ where: { id: commentId } });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment updated successfully', updatedComment);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to update comment: ${error}`);
    }
  }

  async deleteComment(reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const commentRepo = this.transactionManager.getRepository(this.commentRepository);
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);

      const comment = await commentRepo.findOne({ 
        where: { id: reqModel.commentId },
        relations: ['photo'],
      });
      
      if (!comment) {
        return new CommonResponse(false, 404, 'Comment not found');
      }

      // Check if photo exists before trying to access its id
      if (!comment.photo) {
        await commentRepo.delete({ id: reqModel.commentId });
        await this.transactionManager.commitTransaction();
        return new CommonResponse(true, 200, 'Comment deleted successfully (no associated photo)');
      }

      const photoId = comment.photo.id;
      await commentRepo.delete({ id: reqModel.commentId });
      await photoRepo.decrement({ id: photoId }, 'commentsCount', 1);

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Comment deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      throw new Error(`Failed to delete comment: ${error}`);
    }
}
}
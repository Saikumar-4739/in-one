import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PhotoEntity } from '../entities/photo.entity';
import { CommentEntity } from '../entities/comment.entity';
import { LikeEntity } from '../entities/like.entity';
import { CommonResponse, CreatePhotoModel, LikeRequestModel, PhotoIdRequestModel, UpdatePhotoModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import * as cloudinaryInterface from '../cloudinary/cloudinary.interface';

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(PhotoEntity) private readonly photoRepository: Repository<PhotoEntity>,
    @InjectRepository(CommentEntity) private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(LikeEntity) private readonly likeRepository: Repository<LikeEntity>,
    private readonly transactionManager: GenericTransactionManager,
    @Inject('CLOUDINARY') private readonly cloudinary: cloudinaryInterface.CloudinaryService,

  ) {}

  async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);
      const uploadStream = this.cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'photos' },
        (error, result) => {
          if (error || !result) {
            reject(new Error('Cloudinary upload failed: ' + (error?.message || 'Unknown error')));
          } else {
            resolve(result.secure_url);
          }
        },
      );
      readableStream.pipe(uploadStream);
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
        imageUrl: imageUrl,
      });
      const savedPhoto = await photoRepo.save(newPhoto);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Photo uploaded successfully', savedPhoto);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to upload photo');
    }
  }

  async getAllPhotos(): Promise<CommonResponse> {
    try {
      const photos = await this.photoRepository.find({
        relations: ['author', 'comments', 'likes'],
      });
      return new CommonResponse(true, 200, 'Photos fetched successfully', photos);
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to fetch photos');
    }
  }

  async updatePhoto(reqModel: UpdatePhotoModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository);
      await photoRepo.update(reqModel.photoId, reqModel);
      const updatedPhoto = await photoRepo.findOne({ where: { id: reqModel.photoId } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo updated successfully', updatedPhoto);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to update photo');
    }
  }

  async deletePhoto(reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) return new CommonResponse(false, 404, 'Photo not found');
      const cloudinaryPublicId = photo.imageUrl.split('/').pop()?.split('.')[0];
      if (cloudinaryPublicId) {
        await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'image' });
      }
      await this.commentRepository.delete({ photo: { id : reqModel.photoId } });
      await this.likeRepository.delete({ photo: { id : reqModel.photoId } });
      await this.photoRepository.delete({id : reqModel.photoId});
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to delete photo');
    }
  }

  async likePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      const photo = await this.photoRepository.findOne({ where: { id: reqModel.photoId } });
      if (!photo) return new CommonResponse(false, 404, 'Photo not found');
      const like = this.likeRepository.create({ photo, user: { id: reqModel.userId } });
      await this.likeRepository.save(like);
      return new CommonResponse(true, 200, 'Photo liked successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to like photo');
    }
  }

  async unlikePhoto(reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      const like = await this.likeRepository.findOne({ where: { photo: { id: reqModel.photoId }, user: { id: reqModel.userId } } });
      if (!like) return new CommonResponse(false, 404, 'Like not found');
      await this.likeRepository.delete({ id: like.id });
      return new CommonResponse(true, 200, 'Photo unliked successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to unlike photo');
    }
  }
}

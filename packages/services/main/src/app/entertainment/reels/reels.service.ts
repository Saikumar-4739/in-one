import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ReelEntity } from '../entities/reel.entity';
import { CommentEntity } from '../entities/comment.entity';
import { LikeEntity } from '../entities/like.entity';
import { CommonResponse, CreateReelModel, UpdateReelModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { Readable } from 'stream';
import * as cloudinaryInterface from '../cloudinary/cloudinary.interface';

@Injectable()
export class ReelService {
  constructor(
    @InjectRepository(ReelEntity)
    private readonly reelRepository: Repository<ReelEntity>,

    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,

    @InjectRepository(LikeEntity)
    private readonly likeRepository: Repository<LikeEntity>,

    private readonly transactionManager: GenericTransactionManager,

    @Inject('CLOUDINARY') private readonly cloudinary: cloudinaryInterface.CloudinaryService,

    private readonly dataSource: DataSource,
  ) {}

  /** 🔹 Upload Reel to Cloudinary */
  async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null);

      const uploadStream = this.cloudinary.uploader.upload_stream(
        { resource_type: 'video', folder: 'reels' },
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

  /** 🔹 Create Reel */
  async create(createReelDto: CreateReelModel, userId: string, file: Express.Multer.File): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const videoUrl = await this.uploadToCloudinary(file);
      const reelRepo = this.transactionManager.getRepository(this.reelRepository);

      const newReel = reelRepo.create({
        ...createReelDto,
        author: { id: userId },
        videoUrl: videoUrl,
      });

      const savedReel = await reelRepo.save(newReel);
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 201, 'Reel uploaded successfully', savedReel);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to upload reel');
    }
  }

  /** 🔹 Fetch All Reels (with Likes & Comments) */
  async findAll(): Promise<CommonResponse> {
    try {
      const reels = await this.reelRepository.find({
        relations: ['author', 'comments', 'likes'],
      });
      return new CommonResponse(true, 200, 'Reels fetched successfully', reels);
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to fetch reels');
    }
  }

  /** 🔹 Update Reel */
  async update(id: string, updateReelDto: UpdateReelModel): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const reelRepo = this.transactionManager.getRepository(this.reelRepository);
      await reelRepo.update(id, updateReelDto);
      const updatedReel = await reelRepo.findOne({ where: { id } });

      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Reel updated successfully', updatedReel);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to update reel');
    }
  }

  /** 🔹 Delete Reel (Database & Cloudinary) */
  async delete(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const reel = await this.reelRepository.findOne({ where: { id } });
      if (!reel) return new CommonResponse(false, 404, 'Reel not found');

      // Delete reel from Cloudinary
      const cloudinaryPublicId = reel.videoUrl.split('/').pop()?.split('.')[0];
      if (cloudinaryPublicId) {
        await this.cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'video' });
      }

      // Delete associated comments & likes
      await this.commentRepository.delete({ reel: { id } });
      await this.likeRepository.delete({ reel: { id } });

      await this.reelRepository.delete(id);
      await this.transactionManager.commitTransaction();

      return new CommonResponse(true, 200, 'Reel deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      return new CommonResponse(false, 500, 'Failed to delete reel');
    }
  }

  /** 🔹 Like a Reel */
  async likeReel(reelId: string, userId: string): Promise<CommonResponse> {
    try {
      const reel = await this.reelRepository.findOne({ where: { id: reelId } });
      if (!reel) return new CommonResponse(false, 404, 'Reel not found');

      const like = this.likeRepository.create({ reel, user: { id: userId } });
      await this.likeRepository.save(like);

      return new CommonResponse(true, 200, 'Reel liked successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to like reel');
    }
  }

  /** 🔹 Unlike a Reel */
  async unlikeReel(reelId: string, userId: string): Promise<CommonResponse> {
    try {
      const like = await this.likeRepository.findOne({ where: { reel: { id: reelId }, user: { id: userId } } });
      if (!like) return new CommonResponse(false, 404, 'Like not found');

      await this.likeRepository.delete({ id: like.id });
      return new CommonResponse(true, 200, 'Reel unliked successfully');
    } catch (error) {
      return new CommonResponse(false, 500, 'Failed to unlike reel');
    }
  }
}

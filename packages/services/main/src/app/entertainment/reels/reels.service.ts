import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonResponse, CreateReelModel, UpdateReelModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';
import { ReelsRepository } from '../repository/reels.repository';

@Injectable()
export class ReelService {
  constructor(
    @InjectRepository(ReelsRepository)
    private readonly reelRepository: Repository<ReelsRepository>,
    private readonly transactionManager: GenericTransactionManager,
  ) {}

  async create(createReelDto: CreateReelModel, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const reelRepo = this.transactionManager.getRepository(this.reelRepository.target as any);
      const newReel = reelRepo.create({ ...createReelDto, author: { id: userId } });
      const savedReel = await reelRepo.save(newReel);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Reel created successfully', savedReel);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating reel:', error);
      return new CommonResponse(false, 500, 'Failed to create reel');
    }
  }

  async findAll(): Promise<CommonResponse> {
    try {
      const reels = await this.reelRepository.find({ relations: ['author'] });
      return new CommonResponse(true, 200, 'Reels fetched successfully', reels);
    } catch (error) {
      console.error('❌ Error fetching reels:', error);
      return new CommonResponse(false, 500, 'Failed to fetch reels');
    }
  }

  async update(id: string, updateReelDto: Partial<UpdateReelModel>): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const reelRepo = this.transactionManager.getRepository(this.reelRepository.target as any);
      await reelRepo.update(id, { ...updateReelDto });
      const updatedReel = await reelRepo.findOne({ where: { id: id as any } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Reel updated successfully', updatedReel);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating reel:', error);
      return new CommonResponse(false, 500, 'Failed to update reel');
    }
  }

  async delete(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const reelRepo = this.transactionManager.getRepository(this.reelRepository.target as any);
      await reelRepo.delete(id);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Reel deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting reel:', error);
      return new CommonResponse(false, 500, 'Failed to delete reel');
    }
  }
}

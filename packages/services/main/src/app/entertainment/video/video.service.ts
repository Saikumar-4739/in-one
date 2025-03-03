import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VideoRepository } from '../repository/video.repository';
import { CommonResponse, CreateVideoModel, UpdateVideoModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';


@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(VideoRepository)
    private readonly videoRepository: Repository<VideoRepository>,
    private readonly transactionManager: GenericTransactionManager, // ✅ Inject the transaction manager
  ) {}

  async create(createVideoDto: CreateVideoModel, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
  
    try {
      const videoRepo = this.transactionManager.getRepository(this.videoRepository.target as any); 
      const newVideo = videoRepo.create({ ...createVideoDto, author: { id: userId } });
      const savedVideo = await videoRepo.save(newVideo);
  
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Video created successfully', savedVideo);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating video:', error);
      return new CommonResponse(false, 500, 'Failed to create video');
    }
  }
  

  async findAll(): Promise<CommonResponse> {
    try {
      const videos = await this.videoRepository.find({ relations: ['author'] });
      return new CommonResponse(true, 200, 'Videos fetched successfully', videos);
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      return new CommonResponse(false, 500, 'Failed to fetch videos');
    }
  }

  async update(id: string, updateVideoDto: Partial<UpdateVideoModel>): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
  
    try {
      const videoRepo = this.transactionManager.getRepository(this.videoRepository.target as any); // ✅ Corrected repository access
  
      await videoRepo.update(id, { ...updateVideoDto }); // ✅ Ensured compatibility with TypeORM
  
      const updatedVideo = await videoRepo.findOne({ where: { id: id as any } }); // ✅ Ensured ID compatibility
  
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video updated successfully', updatedVideo);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating video:', error);
      return new CommonResponse(false, 500, 'Failed to update video');
    }
  }
  

  async delete(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();

    try {
      const videoRepo = this.transactionManager.getRepository(this.videoRepository);
      await videoRepo.delete(id);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Video deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting video:', error);
      return new CommonResponse(false, 500, 'Failed to delete video');
    }
  }
}

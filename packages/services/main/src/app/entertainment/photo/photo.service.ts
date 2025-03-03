import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PhotoRepository } from '../repository/photo.repository';
import { CommonResponse, CreatePhotoModel, UpdatePhotoModel } from '@in-one/shared-models';
import { GenericTransactionManager } from 'src/database/trasanction-manager';

@Injectable()
export class PhotoService {
  constructor(
    @InjectRepository(PhotoRepository)
    private readonly photoRepository: Repository<PhotoRepository>,
    private readonly transactionManager: GenericTransactionManager,
  ) {}

  async create(createPhotoDto: CreatePhotoModel, userId: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository.target as any);
      const newPhoto = photoRepo.create({ ...createPhotoDto, author: { id: userId } });
      const savedPhoto = await photoRepo.save(newPhoto);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 201, 'Photo created successfully', savedPhoto);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error creating photo:', error);
      return new CommonResponse(false, 500, 'Failed to create photo');
    }
  }

  async findAll(): Promise<CommonResponse> {
    try {
      const photos = await this.photoRepository.find({ relations: ['author'] });
      return new CommonResponse(true, 200, 'Photos fetched successfully', photos);
    } catch (error) {
      console.error('❌ Error fetching photos:', error);
      return new CommonResponse(false, 500, 'Failed to fetch photos');
    }
  }

  async update(id: string, updatePhotoDto: Partial<UpdatePhotoModel>): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository.target as any);
      await photoRepo.update(id, { ...updatePhotoDto });
      const updatedPhoto = await photoRepo.findOne({ where: { id: id as any } });
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo updated successfully', updatedPhoto);
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error updating photo:', error);
      return new CommonResponse(false, 500, 'Failed to update photo');
    }
  }

  async delete(id: string): Promise<CommonResponse> {
    await this.transactionManager.startTransaction();
    try {
      const photoRepo = this.transactionManager.getRepository(this.photoRepository.target as any);
      await photoRepo.delete(id);
      await this.transactionManager.commitTransaction();
      return new CommonResponse(true, 200, 'Photo deleted successfully');
    } catch (error) {
      await this.transactionManager.rollbackTransaction();
      console.error('❌ Error deleting photo:', error);
      return new CommonResponse(false, 500, 'Failed to delete photo');
    }
  }
}

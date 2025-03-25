import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoryService {
  constructor(
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
  ) {}

  async create(createStoryDto: CreateStoryDto): Promise<Story> {
    const newStory = this.storyRepository.create(createStoryDto);
    return this.storyRepository.save(newStory);
  }

  async findAll(): Promise<Story[]> {
    return this.storyRepository.find({ order: { createdAt: 'DESC' } });
  }

  async delete(id: number): Promise<void> {
    const result = await this.storyRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Story not found');
    }
  }
}

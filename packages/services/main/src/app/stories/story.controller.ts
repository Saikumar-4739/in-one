import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { StoryService } from './story.service';
import { Story } from './entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';

@Controller('stories')
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post('/add')
  async create(@Body() createStoryDto: CreateStoryDto): Promise<Story> {
    return this.storyService.create(createStoryDto);
  }

  @Get()
  async findAll(): Promise<Story[]> {
    return this.storyService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<{ message: string }> {
    await this.storyService.delete(id);
    return { message: 'Story deleted successfully' };
  }
}

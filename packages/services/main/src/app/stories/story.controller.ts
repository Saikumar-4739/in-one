import { Controller, Post, Body, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommonResponse, CreateStoryModel, UpdateStoryModel, ExceptionHandler } from '@in-one/shared-models';
import { StoriesService } from './story.service';
import { photMulterOptions } from '../entertainment/photo/photo.multer.config';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post('createStory')
  @UseInterceptors(FileInterceptor('image', photMulterOptions)) // Changed 'file' to 'image' to match your DTO
  async createStory(
    @UploadedFile() file: Express.Multer.File,
    @Body() createStoryDto: CreateStoryModel
  ): Promise<CommonResponse> {
    try {
      // If a file is uploaded, add it to the DTO as base64
      if (file) {
        // Adding mime type to base64 string to match frontend expectation
        createStoryDto.image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
      return await this.storiesService.createStory(createStoryDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating story');
    }
  }

  @Post('updateStory')
  async updateStory(@Body() body: { id: string } & UpdateStoryModel): Promise<CommonResponse> {
    try {
      const { id, ...updateStoryDto } = body;
      return await this.storiesService.updateStory(id, updateStoryDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating story');
    }
  }

  @Post('deleteStory')
  async deleteStory(@Body() body: { id: string }): Promise<CommonResponse> {
    try {
      return await this.storiesService.deleteStory(body.id);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting story');
    }
  }

  @Post('getAllStories')
  async getAllStories(@Body() body: { page: number; limit: number }): Promise<CommonResponse> {
    try {
      return await this.storiesService.getAllStories(body.page, body.limit);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error retrieving stories');
    }
  }

  @Post('getUserStories')
  async getUserStories(@Body() body: { userId: string; page: number; limit: number }): Promise<CommonResponse> {
    try {
      return await this.storiesService.getUserStories(body.userId, body.page, body.limit);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error retrieving user stories');
    }
  }

  @Post('searchStories')
  async searchStories(@Body() body: { query: string }): Promise<CommonResponse> {
    try {
      return await this.storiesService.searchStories(body.query);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error searching stories');
    }
  }

  @Post('markStoryAsViewed')
  async markStoryAsViewed(@Body() body: { id: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.storiesService.markStoryAsViewed(body.id, body.userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error marking story as viewed');
    }
  }
}
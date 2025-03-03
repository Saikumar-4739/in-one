import { Controller, Post, Body, Put, Delete } from '@nestjs/common';
import { VideoService } from './video.service';
import { CreateVideoModel, UpdateVideoModel, CommonResponse, ExceptionHandler } from '@in-one/shared-models';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('createVideo')
  @ApiBody({ type: CreateVideoModel })
  async createVideo(@Body() createVideoDto: CreateVideoModel): Promise<CommonResponse> {
    try {
      const userId = 'user-id-placeholder'; // TODO: Replace with actual authenticated user ID
      return await this.videoService.create(createVideoDto, userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating video');
    }
  }

  @Post('getAllVideos')
  async getAllVideos(): Promise<CommonResponse> {
    try {
      return await this.videoService.findAll();
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching videos');
    }
  }

  @Post('updateVideo')
  @ApiBody({ type: UpdateVideoModel })
  async updateVideo(@Body('id') id: string, @Body() updateVideoDto: Partial<UpdateVideoModel>): Promise<CommonResponse> {
    try {
      return await this.videoService.update(id, updateVideoDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating video');
    }
  }

  @Post('deleteVideo')
  @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
  async deleteVideo(@Body('id') id: string): Promise<CommonResponse> {
    try {
      return await this.videoService.delete(id);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting video');
    }
  }
}
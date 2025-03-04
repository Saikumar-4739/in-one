import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CreateVideoModel, UpdateVideoModel, CommonResponse, ExceptionHandler } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { multerOptions } from './multer.config';

@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() createVideoDto: CreateVideoModel & { userId: string }
  ): Promise<CommonResponse> {
    try {
      return await this.videoService.create(createVideoDto, createVideoDto.userId, file);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error uploading video');
    }
  }

  @Post('getAll')
  async getAllVideos(): Promise<CommonResponse> {
    try {
      return await this.videoService.findAll();
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching videos');
    }
  }

  @Post('update')
  @ApiBody({ type: UpdateVideoModel })
  async updateVideo(@Body() updateVideoDto: UpdateVideoModel & { id: string }): Promise<CommonResponse> {
    try {
      return await this.videoService.update(updateVideoDto.id, updateVideoDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating video');
    }
  }

  @Post('delete')
  @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
  async deleteVideo(@Body() body: { id: string }): Promise<CommonResponse> {
    try {
      return await this.videoService.delete(body.id);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting video');
    }
  }

  @Post('like')
  @ApiBody({ schema: { properties: { videoId: { type: 'string' }, userId: { type: 'string' } } } })
  async likeVideo(@Body() body: { videoId: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.videoService.likeVideo(body.videoId, body.userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error liking video');
    }
  }

  @Post('unlike')
  @ApiBody({ schema: { properties: { videoId: { type: 'string' }, userId: { type: 'string' } } } })
  async unlikeVideo(@Body() body: { videoId: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.videoService.unlikeVideo(body.videoId, body.userId);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error unliking video');
    }
  }
}

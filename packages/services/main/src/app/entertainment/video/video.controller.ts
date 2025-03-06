import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CreateVideoModel, UpdateVideoModel, CommonResponse, ExceptionHandler, VideoIdRequestModel, LikeVideoModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { multerOptions } from './multer.config';

@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('uploadVideo')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadVideo( @UploadedFile() file: Express.Multer.File, @Body() reqModel: CreateVideoModel): Promise<CommonResponse> {
    try {
      return await this.videoService.createVideo(reqModel, file);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error uploading video');
    }
  }

  @Post('getAllVideos')
  async getAllVideos(): Promise<CommonResponse> {
    try {
      return await this.videoService.getAllVideos();
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching videos');
    }
  }

  @Post('updateVideo')
  @ApiBody({ type: UpdateVideoModel })
  async updateVideo(@Body() reqModel: UpdateVideoModel): Promise<CommonResponse> {
    try {
      return await this.videoService.updateVideo(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating video');
    }
  }

  @Post('deleteVideo')
  @ApiBody({ type: VideoIdRequestModel})
  async deleteVideo(@Body() reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.deleteVideo(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting video');
    }
  }

  @Post('likeVideo')
  @ApiBody({ type: LikeVideoModel })
  async likeVideo(@Body() reqModel: LikeVideoModel): Promise<CommonResponse> {
    try {
      return await this.videoService.likeVideo(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error liking video');
    }
  }

  @Post('unlikeVideo')
  @ApiBody({type : LikeVideoModel})
  async unlikeVideo(@Body() reqModel: LikeVideoModel): Promise<CommonResponse> {
    try {
      return await this.videoService.unlikeVideo(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error unliking video');
    }
  }
}

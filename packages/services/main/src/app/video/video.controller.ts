import { Controller, Post, Body, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { CreateVideoModel, UpdateVideoModel, CommonResponse, ExceptionHandler, VideoIdRequestModel, LikeVideoModel, UserIdRequestModel, TogglelikeModel, VideoCommentModel, VideoUpdateCommentModel, CommentIdRequestModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VideoService } from './video.service';
import { multerOptions } from './multer.config';

@ApiTags('Videos')
@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) { }

  @Post('uploadVideo')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  async uploadVideo(@UploadedFile() file: Express.Multer.File, @Body() reqModel: CreateVideoModel): Promise<CommonResponse> {
    if (!file) {
      return new CommonResponse(false, 400, 'Empty file');
    }
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

  @Post('getVideoById')
  @ApiBody({ type: VideoIdRequestModel })
  async getVideoById(@Body() reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.getVideoById(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching video');
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
  @ApiBody({ type: VideoIdRequestModel })
  async deleteVideo(@Body() reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.deleteVideo(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting video');
    }
  }

  @Post('getFeaturedVideos')
  async getFeaturedVideos(): Promise<CommonResponse> {
    try {
      return await this.videoService.getFeaturedVideos();
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error getting videos');
    }
  }

  @Post('incrementViews')
  async incrementViews(@Body() reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.incrementViews(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error getting videos');
    }
  }

  @Post('searchVideos')
  async searchVideos(@Query() query: string): Promise<CommonResponse> {
    try {
      return await this.videoService.searchVideos(query);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error getting videos');
    }
  }

  @Post('markAsFeatured')
  async markAsFeatured(@Body() reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.markAsFeatured(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error getting videos');
    }
  }

  @Post('getVideosByUser')
  async getVideosByUser(@Body() reqModel: UserIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.getVideosByUser(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error getting videos');
    }
  }

  @Post('toggleLike')
  async toggleLike(@Body() reqModel: TogglelikeModel): Promise<CommonResponse> {
    try {
      return await this.videoService.toggleLike(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error getting videos');
    }
  }

  @Post('getVideoComments')
  async getVideoComments(@Body() reqModel: VideoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.getVideoComments(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching comments');
    }
  }

  @Post('updateComment')
  async updateComment(@Body() reqModel: VideoUpdateCommentModel): Promise<CommonResponse> {
    try {
      return await this.videoService.updateComment(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating comment');
    }
  }

  @Post('deleteComment')
  async deleteComment(@Body() reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.videoService.deleteComment(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting comment');
    }
  }

  @Post('createComment')
  async createComment(@Body() reqModel: VideoCommentModel): Promise<CommonResponse> {
    try {
      return await this.videoService.createComment(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error cretae comment');
    }
  }

}
import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CommentIdRequestModel, CommonResponse, CreatePhotoModel, ExceptionHandler, PhotoCommentModel, PhotoIdRequestModel, PhotoTogglelikeModel, UpdatePhotoModel, VideoUpdateCommentModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import { photMulterOptions } from './photo.multer.config';

@ApiTags('Photos')
@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) { }

  @Post('uploadPhoto')
  @ApiBody({})
  @UseInterceptors(FileInterceptor('file', photMulterOptions))
  @ApiConsumes('multipart/form-data')
  async uploadPhoto( @UploadedFile() file: Express.Multer.File, @Body() reqModel: CreatePhotoModel & { userId: string }): Promise<CommonResponse> {
    try {
      return await this.photoService.createPhoto(reqModel, file);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error uploading photo');
    }
  }

  @Post('getAllPhotos')
  async getAllPhotos(): Promise<CommonResponse> {
    try {
      return await this.photoService.getAllPhotos();
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching photos');
    }
  }

  @Post('updatePhoto')
  @ApiBody({ type: UpdatePhotoModel })
  async updatePhoto(@Body() reqModel: UpdatePhotoModel): Promise<CommonResponse> {
    try {
      return await this.photoService.updatePhoto(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating photo');
    }
  }

  @Post('deletePhoto')
  @ApiBody({ type: PhotoIdRequestModel })
  async deletePhoto(@Body() reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.deletePhoto(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting photo');
    }
  }

  @Post('toggleLike')
  @ApiBody({ type: PhotoTogglelikeModel })
  async toggleLike(@Body() reqModel: PhotoTogglelikeModel): Promise<CommonResponse> {
    try {
      return await this.photoService.toggleLike(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error liking photo');
    }
  }

  @Post('createComment')
  async createComment(@Body() reqModel: PhotoCommentModel): Promise<CommonResponse> {
    try {
      return await this.photoService.createComment(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating comment');
    }
  }

  @Post('getPhotocomments')
  async getPhotoComments(@Body() reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.getPhotoComments(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error fetching comments');
    }
  }

  @Post('updateComment')
  async updateComment(@Body() reqModel: VideoUpdateCommentModel): Promise<CommonResponse> {
    try {
      return await this.photoService.updateComment(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating comment');
    }
  }

  @Post('deleteComment')
  async deleteComment(@Body() reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.deleteComment(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating comment');
    }
  }
}

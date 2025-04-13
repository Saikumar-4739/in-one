import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CommonResponse, CreatePhotoModel, LikeRequestModel, PhotoIdRequestModel, UpdatePhotoModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import { photMulterOptions } from './photo.multer.config';

// Define comment-related request models
interface CreateCommentModel {
  photoId: string;
  userId: string;
  content: string;
}

interface CommentIdRequestModel {
  commentId: string;
}

interface UpdateCommentModel {
  commentId: string;
  content: string;
}

interface PhotoCommentsRequestModel {
  photoId: string;
}

@ApiTags('Photos')
@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('uploadPhoto')
  @UseInterceptors(FileInterceptor('file', photMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new photo' })
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() reqModel: CreatePhotoModel & { userId: string }
  ): Promise<CommonResponse> {
    try {
      return await this.photoService.createPhoto(reqModel, file);
    } catch (error) {
      return new CommonResponse(false, 500, `Error uploading photo: ${error}`);
    }
  }

  @Post('all')
  @ApiOperation({ summary: 'Get all photos' })
  async getAllPhotos(): Promise<CommonResponse> {
    try {
      return await this.photoService.getAllPhotos();
    } catch (error) {
      return new CommonResponse(false, 500, `Error fetching photos: ${error}`);
    }
  }

  @Post('update')
  @ApiBody({ type: UpdatePhotoModel })
  @ApiOperation({ summary: 'Update a photo' })
  async updatePhoto(@Body() reqModel: UpdatePhotoModel): Promise<CommonResponse> {
    try {
      return await this.photoService.updatePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, `Error updating photo: ${error}`);
    }
  }

  @Post('delete')
  @ApiBody({ type: PhotoIdRequestModel })
  @ApiOperation({ summary: 'Delete a photo' })
  async deletePhoto(@Body() reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.deletePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, `Error deleting photo: ${error}`);
    }
  }

  @Post('like')
  @ApiBody({ type: LikeRequestModel })
  @ApiOperation({ summary: 'Like a photo' })
  async likePhoto(@Body() reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.likePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, `Error liking photo: ${error}`);
    }
  }

  @Post('unlike')
  @ApiBody({ type: LikeRequestModel })
  @ApiOperation({ summary: 'Unlike a photo' })
  async unlikePhoto(@Body() reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.unlikePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, `Error unliking photo: ${error}`);
    }
  }

  @Post('comment')
  @ApiOperation({ summary: 'Add a comment to a photo' })
  async createComment(@Body() reqModel: CreateCommentModel): Promise<CommonResponse> {
    try {
      return await this.photoService.createComment(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, `Error creating comment: ${error}`);
    }
  }

  @Post('comments')
  @ApiOperation({ summary: 'Get all comments for a photo' })
  async getPhotoComments(@Body() reqModel: PhotoCommentsRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.getPhotoComments(reqModel.photoId);
    } catch (error) {
      return new CommonResponse(false, 500, `Error fetching comments: ${error}`);
    }
  }

  @Post('comment/update')
  @ApiOperation({ summary: 'Update a comment' })
  async updateComment(@Body() reqModel: UpdateCommentModel): Promise<CommonResponse> {
    try {
      return await this.photoService.updateComment(reqModel.commentId, reqModel.content);
    } catch (error) {
      return new CommonResponse(false, 500, `Error updating comment: ${error}`);
    }
  }

  @Post('comment/delete')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(@Body() reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.deleteComment(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, `Error deleting comment: ${error}`);
    }
  }
}
import { Controller, Post, Body, Get, Put, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CommonResponse, CreatePhotoModel, LikeRequestModel, PhotoIdRequestModel, UpdatePhotoModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import { multerOptions } from '../video/multer.config';

@ApiTags('Photos')
@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('uploadPhoto')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadPhoto( @UploadedFile() file: Express.Multer.File, @Body() reqModel: CreatePhotoModel & { userId: string }): Promise<CommonResponse> {
    try {
      return await this.photoService.createPhoto(reqModel, file);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error uploading photo');
    }
  }

  @Post('getAllPhotos')
  async getAllPhotos(): Promise<CommonResponse> {
    try {
      return await this.photoService.getAllPhotos();
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching photos');
    }
  }

  @Post('updatePhoto')
  @ApiBody({ type: UpdatePhotoModel })
  async update(@Body() reqModel: UpdatePhotoModel): Promise<CommonResponse> {
    try {
      return await this.photoService.updatePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating photo');
    }
  }

  @Post('deletePhoto')
  @ApiBody({ type: PhotoIdRequestModel})
  async delete(@Body('id') reqModel: PhotoIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.deletePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error deleting photo');
    }
  }

  @Post('likePhoto')
  @ApiBody({ type: LikeRequestModel})
  async likePhoto(@Body() reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.likePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error liking photo');
    }
  }

  @Post('unlikePhoto')
  @ApiBody({ type: LikeRequestModel })
  async unlikePhoto(@Body() reqModel: LikeRequestModel): Promise<CommonResponse> {
    try {
      return await this.photoService.unlikePhoto(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error unliking photo');
    }
  }
}

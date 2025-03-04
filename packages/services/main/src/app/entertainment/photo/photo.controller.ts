import { Controller, Post, Body, Get, Put, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CommonResponse, CreatePhotoModel, UpdatePhotoModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PhotoService } from './photo.service';
import { multerOptions } from '../video/multer.config';

@ApiTags('Photos')
@Controller('photos')
export class PhotoController {
  constructor(private readonly photoService: PhotoService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Body() createPhotoDto: CreatePhotoModel & { userId: string }
  ): Promise<CommonResponse> {
    try {
      return await this.photoService.create(createPhotoDto, createPhotoDto.userId, file);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error uploading photo');
    }
  }

  @Post('all')
  async findAll(): Promise<CommonResponse> {
    try {
      return await this.photoService.findAll();
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching photos');
    }
  }

  @Post('update')
  @ApiBody({ type: UpdatePhotoModel })
  async update(@Body('id') id: string, @Body() updatePhotoDto: UpdatePhotoModel): Promise<CommonResponse> {
    try {
      return await this.photoService.update(id, updatePhotoDto);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating photo');
    }
  }

  @Post('delete')
  @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
  async delete(@Body('id') id: string): Promise<CommonResponse> {
    try {
      return await this.photoService.delete(id);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error deleting photo');
    }
  }

  @Post('like')
  @ApiBody({ schema: { properties: { photoId: { type: 'string' }, userId: { type: 'string' } } } })
  async likePhoto(@Body() body: { photoId: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.photoService.likePhoto(body.photoId, body.userId);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error liking photo');
    }
  }

  @Post('unlike')
  @ApiBody({ schema: { properties: { photoId: { type: 'string' }, userId: { type: 'string' } } } })
  async unlikePhoto(@Body() body: { photoId: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.photoService.unlikePhoto(body.photoId, body.userId);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error unliking photo');
    }
  }
}

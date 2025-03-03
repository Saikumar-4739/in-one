import { Controller, Post, Body, Get, Put, Delete } from '@nestjs/common';
import { CommonResponse, CreatePhotoModel, UpdatePhotoModel } from '@in-one/shared-models';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { PhotoService } from './photo.service';

@ApiTags('Photos')
@Controller('photos')
export class PhotoController {
    constructor(private readonly photoService: PhotoService) { }

    @Post('create')
    @ApiBody({ type: CreatePhotoModel })
    async create(@Body() createPhotoDto: CreatePhotoModel): Promise<CommonResponse> {
        try {
            return await this.photoService.create(createPhotoDto, createPhotoDto.authorId);
        } catch (error) {
            return new CommonResponse(false, 500, 'Error creating photo');
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
}

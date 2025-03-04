import { Controller, Post, Body, Get, Put, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CommonResponse, CreateReelModel, UpdateReelModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../video/multer.config';
import { ReelService } from './reels.service';

@ApiTags('Reels')
@Controller('reels')
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadReel(
    @UploadedFile() file: Express.Multer.File,
    @Body() createReelDto: CreateReelModel & { userId: string }
  ): Promise<CommonResponse> {
    try {
      return await this.reelService.create(createReelDto, createReelDto.userId, file);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error uploading reel');
    }
  }

  @Post('all')
  async findAll(): Promise<CommonResponse> {
    try {
      return await this.reelService.findAll();
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching reels');
    }
  }

  @Post('update')
  @ApiBody({ type: UpdateReelModel })
  async update(@Body('id') id: string, @Body() updateReelDto: UpdateReelModel): Promise<CommonResponse> {
    try {
      return await this.reelService.update(id, updateReelDto);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating reel');
    }
  }

  @Post('delete')
  @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
  async delete(@Body('id') id: string): Promise<CommonResponse> {
    try {
      return await this.reelService.delete(id);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error deleting reel');
    }
  }

  @Post('like')
  @ApiBody({ schema: { properties: { reelId: { type: 'string' }, userId: { type: 'string' } } } })
  async likeReel(@Body() body: { reelId: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.reelService.likeReel(body.reelId, body.userId);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error liking reel');
    }
  }

  @Post('unlike')
  @ApiBody({ schema: { properties: { reelId: { type: 'string' }, userId: { type: 'string' } } } })
  async unlikeReel(@Body() body: { reelId: string; userId: string }): Promise<CommonResponse> {
    try {
      return await this.reelService.unlikeReel(body.reelId, body.userId);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error unliking reel');
    }
  }
}

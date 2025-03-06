import { Controller, Post, Body, Get, Put, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { CommonResponse, CreateReelModel, LikeReelModel, ReelIdRequestModel, UpdateReelModel } from '@in-one/shared-models';
import { ApiTags, ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../video/multer.config';
import { ReelService } from './reels.service';

@ApiTags('Reels')
@Controller('reels')
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Post('uploadReel')
  @ApiBody({ type: CreateReelModel })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadReel( @UploadedFile() file: Express.Multer.File, @Body() reqModel: CreateReelModel): Promise<CommonResponse> {
    try {
      return await this.reelService.createReel(reqModel, file);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error uploading reel');
    }
  }

  @Post('getAllReels')
  async getAllReels(): Promise<CommonResponse> {
    try {
      return await this.reelService.getAllReels();
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching reels');
    }
  }

  @Post('updateReel')
  @ApiBody({ type: UpdateReelModel })
  async updateReel(@Body() reqModel: UpdateReelModel): Promise<CommonResponse> {
    try {
      return await this.reelService.updateReel(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating reel');
    }
  }

  @Post('deleteReel')
  @ApiBody({ type: ReelIdRequestModel})
  async delete(@Body() reqModel: ReelIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.reelService.deleteReel(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error deleting reel');
    }
  }

  @Post('likeReel')
  @ApiBody({ type: LikeReelModel })
  async likeReel(@Body() reqModel: LikeReelModel): Promise<CommonResponse> {
    try {
      return await this.reelService.likeReel(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error liking reel');
    }
  }

  @Post('unlikeReel')
  @ApiBody({ type: LikeReelModel})
  async unlikeReel(@Body() reqModel: LikeReelModel): Promise<CommonResponse> {
    try {
      return await this.reelService.unlikeReel(reqModel);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error unliking reel');
    }
  }
}

import { Controller, Post, Body, Get, Put, Delete } from '@nestjs/common';
import { CommonResponse, CreateReelModel, UpdateReelModel } from '@in-one/shared-models';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ReelService } from './reels.service';

@ApiTags('Reels')
@Controller('reels')
export class ReelController {
  constructor(private readonly reelService: ReelService) {}

  @Post('create')
  @ApiBody({ type: CreateReelModel })
  async create(@Body() createReelDto: CreateReelModel): Promise<CommonResponse> {
    try {
      return await this.reelService.create(createReelDto, createReelDto.authorId);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error creating reel');
    }
  }

  @Get('all')
  async findAll(): Promise<CommonResponse> {
    try {
      return await this.reelService.findAll();
    } catch (error) {
      return new CommonResponse(false, 500, 'Error fetching reels');
    }
  }

  @Put('update')
  @ApiBody({ type: UpdateReelModel })
  async update(@Body('id') id: string, @Body() updateReelDto: UpdateReelModel): Promise<CommonResponse> {
    try {
      return await this.reelService.update(id, updateReelDto);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error updating reel');
    }
  }

  @Delete('delete')
  @ApiBody({ schema: { properties: { id: { type: 'string' } } } })
  async delete(@Body('id') id: string): Promise<CommonResponse> {
    try {
      return await this.reelService.delete(id);
    } catch (error) {
      return new CommonResponse(false, 500, 'Error deleting reel');
    }
  }
}

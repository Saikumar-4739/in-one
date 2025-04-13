import { Controller, Post, Get, Body, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { CommonResponse, CreateNewsModel, UpdateNewsModel, CreateCommentModel, ExceptionHandler } from '@in-one/shared-models';
import { ApiBody } from '@nestjs/swagger';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) { }

  @Post('createNews')
  @ApiBody({ type: CreateNewsModel })
  async createNews(@Body() createNewsDto: CreateNewsModel): Promise<CommonResponse> {
    try {
      console.log(createNewsDto)
      return await this.newsService.createNews(createNewsDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating news');
    }
  }

  @Post('bulkNews')
  async createMultipleNews(@Body() createNewsDtos: CreateNewsModel[]) {
    return this.newsService.createMultipleNews(createNewsDtos);
  }

  @Post('updateNews')
  async updateNews(@Body() body: { id: string } & UpdateNewsModel): Promise<CommonResponse> {
    try {
      const { id, ...updateNewsDto } = body;
      return await this.newsService.updateNews(id, updateNewsDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating news');
    }
  }

  @Post('deleteNews')
  async deleteNews(@Body() body: { id: string }): Promise<CommonResponse> {
    try {
      return await this.newsService.deleteNews(body.id);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting news');
    }
  }

  @Post('getAllNews')
  async getAllNews(@Body() body: { page: number; limit: number }): Promise<CommonResponse> {
    try {
      return await this.newsService.getAllNews(body.page, body.limit);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error retrieving news');
    }
  }

  @Post('searchNews')
  async searchNews(@Body() body: { query: string }): Promise<CommonResponse> {
    try {
      return await this.newsService.searchNews(body.query);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error searching news');
    }
  }

  // @Post('likeNews')
  // async likeNews(@Body() body: { id: string }): Promise<CommonResponse> {
  //   try {
  //     return await this.newsService.toggleLikeNews(body.id);
  //   } catch (error) {
  //     return ExceptionHandler.handleError(error, 'Error liking news');
  //   }
  // }

  @Post('addComment')
  async addComment(@Body() createCommentDto: CreateCommentModel): Promise<CommonResponse> {
    try {
      return await this.newsService.addComment(createCommentDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error adding comment');
    }
  }

  @Post('deleteComment')
  async deleteComment(@Body() body: { id: string }): Promise<CommonResponse> {
    try {
      return await this.newsService.deleteComment(body.id);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting comment');
    }
  }

  // @Post('dislikeNews')
  // async dislikeNews(@Body() body: { id: string }): Promise<CommonResponse> {
  //   try {
  //     return await this.newsService.toggleDislikeNews(body.id);
  //   } catch (error) {
  //     return ExceptionHandler.handleError(error, 'Error disliking news');
  //   }
  // }

  @Post('shareNews')
  async shareNews(@Body() body: { id: string; platform: string }): Promise<CommonResponse> {
    try {
      return await this.newsService.shareNews(body.id, body.platform);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error sharing news');
    }
  }

  @Post('markImportant')
  async markNewsAsImportant(@Body() body: { id: string; isImportant: boolean }): Promise<CommonResponse> {
    try {
      return await this.newsService.markNewsAsImportant(body.id, body.isImportant);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error marking news as important');
    }
  }
}

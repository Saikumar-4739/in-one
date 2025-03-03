import { Controller, Post, Get, Body, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { CommonResponse, CreateNewsModel, UpdateNewsModel, CreateCommentModel, ExceptionHandler } from '@in-one/shared-models';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post('createNews')
  async createNews(@Body() createNewsDto: CreateNewsModel): Promise<CommonResponse> {
    try {
      return await this.newsService.createNews(createNewsDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating news');
    }
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

  @Post('likeNews')
  async likeNews(@Body() body: { id: string }): Promise<CommonResponse> {
    try {
      return await this.newsService.toggleLikeNews(body.id);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error liking news');
    }
  }

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
}

import { Controller, Post, Get, Body, Delete } from '@nestjs/common';
import { NewsService } from './news.service';
import { CommonResponse, CreateNewsModel, UpdateNewsModel, CreateCommentModel, ExceptionHandler, NewsIdRequestModel, CommentIdRequestModel, TogglelikeModel, ToggleReactionModel } from '@in-one/shared-models';
import { ApiBody } from '@nestjs/swagger';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) { }

  @Post('createNews')
  @ApiBody({ type: CreateNewsModel })
  async createNews(@Body() reqModel: CreateNewsModel): Promise<CommonResponse> {
    try {
      return await this.newsService.createNews(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error creating news');
    }
  }

  @Post('updateNews')
  async updateNews(@Body() reqModel: UpdateNewsModel): Promise<CommonResponse> {
    try {
      return await this.newsService.updateNews(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error updating news');
    }
  }

  @Post('deleteNews')
  async deleteNews(@Body() reqModel: NewsIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.newsService.deleteNews(reqModel);
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

  @Post('addComment')
  async addComment(@Body() createCommentDto: CreateCommentModel): Promise<CommonResponse> {
    try {
      return await this.newsService.addComment(createCommentDto);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error adding comment');
    }
  }

  @Post('deleteComment')
  async deleteComment(@Body() reqModel: CommentIdRequestModel): Promise<CommonResponse> {
    try {
      return await this.newsService.deleteComment(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error deleting comment');
    }
  }

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

  @Post('toggleReactionNews')
  async toggleReactionNews(@Body() reqModel: ToggleReactionModel): Promise<CommonResponse> {
    try {
      return await this.newsService.toggleReactionNews(reqModel);
    } catch (error) {
      return ExceptionHandler.handleError(error, 'Error for like the news');
    }
  }
}

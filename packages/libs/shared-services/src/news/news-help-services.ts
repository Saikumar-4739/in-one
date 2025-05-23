import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreateNewsModel, UpdateNewsModel, CreateCommentModel, ToggleReactionModel, CommonResponse } from '@in-one/shared-models';

export class NewsHelpService extends CommonAxiosService {
  
  private getURLwithMainEndPoint(childUrl: string): string {
    return `/news/${childUrl}`; 
  }

  async createNews(createNewsDto: CreateNewsModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('createNews'), createNewsDto, config);
  }

  async updateNews(id: string, updateNewsDto: UpdateNewsModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('updateNews'), { id, ...updateNewsDto }, config);
  }

  async deleteNews(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteNews'), { id }, config);
  }

  async getAllNews(page: number, limit: number, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllNews'), { page, limit }, config);
  }

  async searchNews(query: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('searchNews'), { query }, config);
  }

  async toggleLikeNews(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('likeNews'), { id }, config);
  }

  async addComment(createCommentDto: CreateCommentModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('addComment'), createCommentDto, config);
  }

  async deleteComment(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteComment'), { id }, config);
  }
  
  async createMultipleNews(reqModel: CreateNewsModel[], config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('bulkNews'), reqModel, config); // Fixed typo: 'bulNews' -> 'bulkNews'
  }

  async toggleDislikeNews(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('dislikeNews'), { id }, config);
  }

  async shareNews(id: string, platform: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('shareNews'), { id, platform }, config);
  }

  async markNewsAsImportant(id: string, isImportant: boolean, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('markImportant'), { id, isImportant }, config);
  }

  async toggleReactionNews(reqModel: ToggleReactionModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('toggleReactionNews'), reqModel, config);
  }
}
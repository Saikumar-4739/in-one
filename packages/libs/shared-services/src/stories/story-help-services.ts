import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, UpdateStoryModel } from '@in-one/shared-models';
import FormData from 'form-data';

export class StoriesHelpService extends CommonAxiosService {
  
  private getURLwithMainEndPoint(childUrl: string): string {
    return `/stories/${childUrl}`;
  }

  async createStory(createStoryDto: FormData, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(
      this.getURLwithMainEndPoint('createStory'),
      createStoryDto,
      {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(config?.headers || {}),
        },
      }
    );
  }

  async updateStory(id: string, updateStoryDto: UpdateStoryModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('updateStory'), { id, ...updateStoryDto }, config);
  }

  async deleteStory(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteStory'), { id }, config);
  }

  async getAllStories(page: number, limit: number, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllStories'), { page, limit }, config);
  }

  async getUserStories(userId: string, page: number, limit: number, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('getUserStories'), { userId, page, limit }, config);
  }

  async searchStories(query: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('searchStories'), { query }, config);
  }

  async markStoryAsViewed(id: string, userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall(this.getURLwithMainEndPoint('markStoryAsViewed'), { id, userId }, config);
  }
}
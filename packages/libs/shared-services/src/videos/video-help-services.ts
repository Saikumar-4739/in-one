import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { CommonResponse, UpdateVideoModel, VideoIdRequestModel, UserIdRequestModel, TogglelikeModel } from '@in-one/shared-models';
import FormData from 'form-data';

export class VideoHelpService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string): string {
        return `/videos/${childUrl}`;
    }

    async uploadVideo(formData: FormData, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(
          this.getURLwithMainEndPoint('uploadVideo'), 
          formData,
          {
            ...config,
            headers: {
              'Content-Type': 'multipart/form-data', 
              ...(config?.headers || {}),
            },
          }
        );
    }

    async getAllVideos(config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllVideos'), {}, config);
    }

    async getVideoById(reqModel: VideoIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getVideoById'), reqModel, config); // Corrected endpoint
    }

    async updateVideo(reqModel: UpdateVideoModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateVideo'), reqModel, config);
    }

    async deleteVideo(reqModel: VideoIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteVideo'), reqModel, config);
    }

    async getFeaturedVideos(config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getFeaturedVideos'), {}, config);
    }

    async incrementViews(reqModel: VideoIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('incrementViews'), reqModel, config);
    }

    async searchVideos(query: string, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('searchVideos'), { query }, config);
    }

    async markAsFeatured(reqModel: VideoIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('markAsFeatured'), reqModel, config);
    }

    async getVideosByUser(reqModel: UserIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getVideosByUser'), reqModel, config);
    }

    async toggleLike(reqModel: TogglelikeModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('toggleLike'), reqModel, config);
    }

    async getLikesCount(reqModel: VideoIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getLikesCount'), reqModel, config);
    }

    async getLikedVideosByUser(reqModel: UserIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getLikedVideosByUser'), reqModel, config);
    }
}

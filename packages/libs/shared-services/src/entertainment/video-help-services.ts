import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { CommonResponse, LikeVideoModel, UpdateVideoModel, VideoIdRequestModel,GetVideoByIdModel  } from '@in-one/shared-models';
import FormData from 'form-data';

export class VideoHelpService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string): string {
        return `/videos/${childUrl}`;
    }

    async uploadVideo(formData: FormData, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(
          this.getURLwithMainEndPoint('uploadVideo'), // Ensure this matches the controller endpoint
          formData,
          {
            ...config,
            headers: {
              'Content-Type': 'multipart/form-data', // This is optional; Axios sets it automatically with FormData
              ...(config?.headers || {}),
            },
          }
        );
      }
    

    async getAllVideos(config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllVideos'), {}, config);
    }

    async updateVideo(reqModel: UpdateVideoModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateVideo'), reqModel, config);
    }

    async deleteVideo(reqModel: VideoIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteVideo'), reqModel, config);
    }

    async likeVideo(reqModel: LikeVideoModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('likeVideo'), reqModel, config);
    }

    async unlikeVideo(reqModel: LikeVideoModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('unlikeVideo'), reqModel, config);
    }

    async getVideoById(reqModel: GetVideoByIdModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
      return await this.axiosPostCall(this.getURLwithMainEndPoint('videos/getVideoById'), reqModel, config);
    }

}
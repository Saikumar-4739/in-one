import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { CommonResponse, LikeVideoModel, UpdateVideoModel, VideoIdRequestModel } from '@in-one/shared-models';
import FormData from 'form-data';


export class VideoHelpService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string): string {
        return `/videos/${childUrl}`;
    }

    async uploadVideo(formData: FormData, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('uploadVideo'), formData, {
            ...config,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    async getAllVideos(config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAll'), {}, config);
    }

    async updateVideo(reqModel: UpdateVideoModel , config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateVideo'), reqModel , config);
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
}

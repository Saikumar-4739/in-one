import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { 
    CommonResponse, 
    UpdateVideoModel 
} from '@in-one/shared-models';
import FormData from 'form-data';


export class VideoHelpService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string): string {
        return `/videos/${childUrl}`;
    }

    async uploadVideo(formData: FormData, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('upload'), formData, {
            ...config,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    async getAllVideos(config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAll'), {}, config);
    }

    async updateVideo(updateData: UpdateVideoModel & { id: string }, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('update'), updateData, config);
    }

    async deleteVideo(id: string, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('delete'), { id }, config);
    }

    async likeVideo(videoId: string, userId: string, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('like'), { videoId, userId }, config);
    }

    async unlikeVideo(videoId: string, userId: string, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('unlike'), { videoId, userId }, config);
    }
}

import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { 
    CommonResponse, 
    UpdateReelModel 
} from '@in-one/shared-models';
import FormData from 'form-data';


export class ReelHelpService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string): string {
        return `/reels/${childUrl}`;
    }

    async uploadReel(formData: FormData, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('upload'), formData, {
            ...config,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    async getAllReels(config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('all'), {}, config);
    }

    async updateReel(id: string, updateData: UpdateReelModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('update'), { id, ...updateData }, config);
    }

    async deleteReel(id: string, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('delete'), { id }, config);
    }

    async likeReel(reelId: string, userId: string, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('like'), { reelId, userId }, config);
    }

    async unlikeReel(reelId: string, userId: string, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('unlike'), { reelId, userId }, config);
    }
}

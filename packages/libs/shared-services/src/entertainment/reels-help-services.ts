import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { CommonResponse, LikeReelModel, ReelIdRequestModel, UpdateReelModel } from '@in-one/shared-models';
import FormData from 'form-data';


export class ReelHelpService extends CommonAxiosService {
    private getURLwithMainEndPoint(childUrl: string): string {
        return `/reels/${childUrl}`;
    }

    async uploadReel(formData: FormData, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('uploadReel'), formData, {
            ...config,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }

    async getAllReels(config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllReels'), {}, config);
    }

    async updateReel(reqModel: UpdateReelModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updateReel'), reqModel, config);
    }

    async deleteReel(reqModel: ReelIdRequestModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deleteReel'), reqModel, config);
    }

    async likeReel(reqModel: LikeReelModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('likeReel'), reqModel, config);
    }

    async unlikeReel(reqModel: LikeReelModel, config?: AxiosRequestConfig): Promise<CommonResponse> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('unlikeReel'), reqModel, config);
    }
}

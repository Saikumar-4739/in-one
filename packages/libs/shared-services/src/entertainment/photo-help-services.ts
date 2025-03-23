import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreatePhotoModel, UpdatePhotoModel, PhotoIdRequestModel, LikeRequestModel } from '@in-one/shared-models';
import FormData from 'form-data';
import { File } from 'buffer';

export class PhotoHelpService extends CommonAxiosService {

    private getURLwithMainEndPoint(childUrl: string): string {
        return `/photos/${childUrl}`;
    }

    async uploadPhoto(reqModel: CreatePhotoModel, file: Blob | File, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        const formData = new FormData();
        formData.append('file', file);
        Object.entries(reqModel).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('uploadPhoto'),
            formData,
            {
                ...config,
                // Let FormData set the Content-Type with proper boundary
                headers: { ...config?.headers }
            }
        );
    }

    async getAllPhotos(config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('getAllPhotos'), {}, config);
    }

    async updatePhoto(reqModel: UpdatePhotoModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('updatePhoto'), reqModel, config);
    }

    async deletePhoto(reqModel: PhotoIdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('deletePhoto'), reqModel, config);
    }

    async likePhoto(reqModel: LikeRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('likePhoto'), reqModel, config);
    }

    async unlikePhoto(reqModel: LikeRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('unlikePhoto'), reqModel, config);
    }
}

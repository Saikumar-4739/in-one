import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreatePhotoModel, UpdatePhotoModel } from '@in-one/shared-models';
import FormData from 'form-data';
import { File } from 'buffer';

export class PhotoHelpService extends CommonAxiosService {

    private getURLwithMainEndPoint(childUrl: string): string {
        return `/photos/${childUrl}`;
    }

    async uploadPhoto(createPhotoDto: CreatePhotoModel & { userId: string }, file: File, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        const formData = new FormData();
        formData.append('file', file);
        Object.keys(createPhotoDto).forEach(key => {
            formData.append(key, (createPhotoDto as any)[key]);
        });        
        return await this.axiosPostCall(this.getURLwithMainEndPoint('upload'), formData, { ...config, headers: { 'Content-Type': 'multipart/form-data' } });
    }

    async findAll(config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('all'), {}, config);
    }

    async updatePhoto(id: string, updatePhotoDto: UpdatePhotoModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('update'), { id, ...updatePhotoDto }, config);
    }

    async deletePhoto(id: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('delete'), { id }, config);
    }

    async likePhoto(photoId: string, userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('like'), { photoId, userId }, config);
    }

    async unlikePhoto(photoId: string, userId: string, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(this.getURLwithMainEndPoint('unlike'), { photoId, userId }, config);
    }
}

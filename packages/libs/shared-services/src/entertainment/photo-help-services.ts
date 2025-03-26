import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreatePhotoModel, UpdatePhotoModel, PhotoIdRequestModel, LikeRequestModel } from '@in-one/shared-models';
import FormData from 'form-data';
import { File } from 'buffer';

interface CreateCommentModel {
    photoId: string;
    userId: string;
    content: string;
}

interface CommentIdRequestModel {
    commentId: string;
}

interface UpdateCommentModel {
    commentId: string;
    content: string;
}

interface PhotoCommentsRequestModel {
    photoId: string;
  }

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
                headers: { ...config?.headers }
            }
        );
    }

    async getAllPhotos(config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('all'),
            {},
            config
        );
    }

    async updatePhoto(reqModel: UpdatePhotoModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('update'),
            reqModel,
            config
        );
    }

    async deletePhoto(reqModel: PhotoIdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('delete'),
            reqModel,
            config
        );
    }

    async likePhoto(reqModel: LikeRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('like'),
            reqModel,
            config
        );
    }

    async unlikePhoto(reqModel: LikeRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('unlike'),
            reqModel,
            config
        );
    }

    async createComment(reqModel: CreateCommentModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('comment'),
            reqModel,
            config
        );
    }

    async getPhotoComments(reqModel: PhotoCommentsRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint(`comments`),
            reqModel, // Sending photoId in body since it's a POST request
            config
        );
    }

    async updateComment(reqModel: UpdateCommentModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('comment/update'),
            reqModel,
            config
        );
    }

    async deleteComment(reqModel: CommentIdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
        return await this.axiosPostCall(
            this.getURLwithMainEndPoint('comment/delete'),
            reqModel,
            config
        );
    }
}
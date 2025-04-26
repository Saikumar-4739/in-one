import { AxiosRequestConfig } from 'axios';
import { CommonAxiosService } from '../common-axios-service';
import { GlobalResponseObject, CreatePhotoModel, UpdatePhotoModel, PhotoIdRequestModel, PhotoCommentModel, PhotoTogglelikeModel, VideoUpdateCommentModel, CommentIdRequestModel } from '@in-one/shared-models';
import FormData from 'form-data';
import { File } from 'buffer';

export class PhotoHelpService extends CommonAxiosService {
  private getURLwithMainEndPoint(childUrl: string): string {
    return `/photos/${childUrl}`;
  }

  async uploadPhoto(reqModel: CreatePhotoModel & { userId: string }, file: Blob | File, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
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
        headers: { ...config?.headers, 'Content-Type': 'multipart/form-data' }
      }
    );
  }

  async getAllPhotos(config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('getAllPhotos'),{}, config);
  }

  async updatePhoto(reqModel: UpdatePhotoModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('updatePhoto'), reqModel, config);
  }

  async deletePhoto(reqModel: PhotoIdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('deletePhoto'), reqModel, config);
  }

  async toggleLike(reqModel: PhotoTogglelikeModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('toggleLike'), reqModel, config);
  }

  async createComment(reqModel: PhotoCommentModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('createComment'), reqModel, config);
  }

  async getPhotoComments(reqModel: PhotoIdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('getPhotocomments'), reqModel, config);
  }

  async updateComment(reqModel: VideoUpdateCommentModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('updateComment'), reqModel, config);
  }

  async deleteComment(reqModel: CommentIdRequestModel, config?: AxiosRequestConfig): Promise<GlobalResponseObject> {
    return await this.axiosPostCall( this.getURLwithMainEndPoint('deleteComment'), reqModel, config);
  }
}

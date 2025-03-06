import { PhotoIdRequestModel } from "./photo-id-request-model";

export class UpdatePhotoModel extends PhotoIdRequestModel  {
    imageUrl?: string;
    caption?: string;
    visibility?: 'public' | 'private';
  
    constructor(
      photoId: string,
      imageUrl?: string,
      caption: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      super(photoId)
      this.imageUrl = imageUrl;
      this.caption = caption;
      this.visibility = visibility;
    }
  }
  
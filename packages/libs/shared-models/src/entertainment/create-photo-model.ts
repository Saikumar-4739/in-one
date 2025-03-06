import { UserIdRequestModel } from "../authentication/userid-request-model";

export class CreatePhotoModel extends UserIdRequestModel {
    imageUrl: string;
    caption?: string;
    visibility?: 'public' | 'private';
    authorId: string;
  
    constructor(
      userId: string,
      imageUrl: string,
      authorId: string,
      caption: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      super(userId)
      this.imageUrl = imageUrl;
      this.authorId = authorId;
      this.caption = caption;
      this.visibility = visibility;
    }
  }
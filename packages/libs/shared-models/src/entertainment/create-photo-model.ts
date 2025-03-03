export class CreatePhotoModel {
    imageUrl: string;
    caption?: string;
    visibility?: 'public' | 'private';
    authorId: string;
  
    constructor(
      imageUrl: string,
      authorId: string,
      caption: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      this.imageUrl = imageUrl;
      this.authorId = authorId;
      this.caption = caption;
      this.visibility = visibility;
    }
  }
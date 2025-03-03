export class UpdatePhotoModel {
    imageUrl?: string;
    caption?: string;
    visibility?: 'public' | 'private';
  
    constructor(
      imageUrl?: string,
      caption: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      this.imageUrl = imageUrl;
      this.caption = caption;
      this.visibility = visibility;
    }
  }
  
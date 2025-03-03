export class PhotoResponseModel {
    id: string;
    imageUrl: string;
    caption?: string;
    visibility: 'public' | 'private';
    authorId: string;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(
      id: string,
      imageUrl: string,
      authorId: string,
      createdAt: Date,
      updatedAt: Date,
      caption: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      this.id = id;
      this.imageUrl = imageUrl;
      this.authorId = authorId;
      this.caption = caption;
      this.visibility = visibility;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    }
  }
export class ReelResponseModel {
    id: string;
    reelUrl: string;
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    authorId: string;
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(
      id: string,
      title: string,
      reelUrl: string,
      authorId: string,
      views: number,
      likes: number,
      createdAt: Date,
      updatedAt: Date,
      description: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      this.id = id;
      this.title = title;
      this.reelUrl = reelUrl;
      this.authorId = authorId;
      this.description = description;
      this.visibility = visibility;
      this.views = views;
      this.likes = likes;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    }
  }
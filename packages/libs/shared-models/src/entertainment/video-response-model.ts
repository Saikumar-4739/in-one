export class VideoResponseDto {
    id: string;
    title: string;
    description?: string;
    videoUrl: string;
    views: number;
    likes: number;
    dislikes: number;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(
      id: string,
      title: string,
      videoUrl: string,
      views: number,
      likes: number,
      dislikes: number,
      createdAt: Date,
      updatedAt: Date,
      description: string = ''
    ) {
      this.id = id;
      this.title = title;
      this.description = description;
      this.videoUrl = videoUrl;
      this.views = views;
      this.likes = likes;
      this.dislikes = dislikes;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
    }
  }
  
export class CreateVideoModel {
    title: string;
    description?: string;
    videoUrl: string;
    visibility?: 'public' | 'private' | 'unlisted';
  
    constructor(
      title: string,
      videoUrl: string,
      description: string = '',
      visibility: 'public' | 'private' | 'unlisted' = 'public'
    ) {
      this.title = title;
      this.videoUrl = videoUrl;
      this.description = description;
      this.visibility = visibility;
    }
  }
  
export class CreateReelModel {
    reelUrl: string;
    title: string;
    description?: string;
    visibility?: 'public' | 'private';
    authorId: string;
  
    constructor(
      title: string,
      reelUrl: string,
      authorId: string,
      description: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      this.title = title;
      this.reelUrl = reelUrl;
      this.authorId = authorId;
      this.description = description;
      this.visibility = visibility;
    }
  }
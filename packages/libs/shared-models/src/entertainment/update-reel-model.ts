export class UpdateReelModel {
    reelUrl?: string;
    title?: string;
    description?: string;
    visibility?: 'public' | 'private';
  
    constructor(
      title?: string,
      reelUrl?: string,
      description: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      this.title = title;
      this.reelUrl = reelUrl;
      this.description = description;
      this.visibility = visibility;
    }
  }
export class CreateStoryModel {
    userId: string;
    image?: string; // Base64 or URL
    content?: string;
    visibility?: 'public' | 'private' | 'friends';
  
    constructor(
      userId: string,
      image?: string,
      content?: string,
      visibility?: 'public' | 'private' | 'friends'
    ) {
      this.userId = userId;
      this.image = image;
      this.content = content;
      this.visibility = visibility;
    }
  }
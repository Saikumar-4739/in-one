export class UpdateStoryModel {
    content?: string;
    visibility?: 'public' | 'private' | 'friends';
  
    constructor(
      content?: string,
      visibility?: 'public' | 'private' | 'friends'
    ) {
      this.content = content;
      this.visibility = visibility;
    }
  }
export class UpdateVideoModel {
    title?: string;
    description?: string;
    visibility?: 'public' | 'private' | 'unlisted';
  
    constructor(
      title?: string,
      description?: string,
      visibility?: 'public' | 'private' | 'unlisted'
    ) {
      this.title = title;
      this.description = description;
      this.visibility = visibility;
    }
  }
  
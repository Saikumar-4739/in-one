export class UpdateNewsModel {
    title?: string;
    content?: string;
    summary?: string;
    category?: string;
    tags?: string[];
    images?: string[];
    thumbnail?: string;
    status?: 'draft' | 'published' | 'archived';
    visibility?: 'public' | 'private';
    isFeatured?: boolean;
    isBreaking?: boolean;
    publishedAt?: Date;
  
    constructor(
      title?: string,
      content?: string,
      summary?: string,
      category?: string,
      tags?: string[],
      images?: string[],
      thumbnail?: string,
      status?: 'draft' | 'published' | 'archived',
      visibility?: 'public' | 'private',
      isFeatured?: boolean,
      isBreaking?: boolean,
      publishedAt?: Date,
    ) {
      this.title = title;
      this.content = content;
      this.summary = summary;
      this.category = category;
      this.tags = tags;
      this.images = images;
      this.thumbnail = thumbnail;
      this.status = status;
      this.visibility = visibility;
      this.isFeatured = isFeatured;
      this.isBreaking = isBreaking;
      this.publishedAt = publishedAt;
    }
  }
  
import { NewsIdRequestModel } from "./news-id-request-model";

export class UpdateNewsModel extends NewsIdRequestModel {
  authorId: string
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
  views?: number;

  constructor(
    newsId: string,
    authorId: string,
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
    views?: number,
  ) {
    super(newsId)
    this.authorId = authorId
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
    this.views = views;
  }
}

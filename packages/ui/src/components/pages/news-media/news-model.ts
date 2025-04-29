export interface NewsItem {
  id: string;
  title: string;
  content: string;
  images: string[];
  category: string;
  likes: number;
  dislikes: number;
  comments: any[];
  views: number;
  author: { id: string; username: string };
  isLiked?: boolean;
  isDisliked?: boolean;
  isImportant?: boolean;
  isBreaking?: boolean;
  shares?: number;
  publishedAt?: string | Date;
  visibility?: string;
  tags?: string[];
}
export class CreateCommentModel {
    content: string;
    newsId: string;
    authorId: string;
    parentCommentId?: string;
  
    constructor(content: string, newsId: string, authorId: string, parentCommentId?: string) {
      this.content = content;
      this.newsId = newsId;
      this.authorId = authorId;
      this.parentCommentId = parentCommentId;
    }
  }
  
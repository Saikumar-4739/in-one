export class ToggleReactionModel {
    newsId: string;
    userId: string;
    reactionType: 'like' | 'dislike';
  
    constructor(newsId: string, userId: string, reactionType: 'like' | 'dislike') {
      this.newsId = newsId;
      this.userId = userId;
      this.reactionType = reactionType;
    }
  }
  
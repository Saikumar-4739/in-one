export class VideoCommentModel {
    content: string;
    videoId: string;
    userId: string;
    parentCommentId?: string;
  
    constructor(content: string, videoId: string, userId: string, parentCommentId?: string) {
      this.content = content;
      this.videoId = videoId;
      this.userId = userId;
      this.parentCommentId = parentCommentId;
    }
  }
  
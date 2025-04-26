export class PhotoCommentModel {
    content: string;
    photoId: string;
    userId: string;
    parentCommentId?: string;
  
    constructor(content: string, photoId: string, userId: string, parentCommentId?: string) {
      this.content = content;
      this.photoId = photoId;
      this.userId = userId;
      this.parentCommentId = parentCommentId;
    }
  }
  
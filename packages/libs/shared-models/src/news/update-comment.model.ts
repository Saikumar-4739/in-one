export class UpdateCommentModel {
    content?: string;
    status?: 'visible' | 'hidden' | 'deleted';
  
    constructor(content?: string, status?: 'visible' | 'hidden' | 'deleted') {
      this.content = content;
      this.status = status;
    }
  }
  
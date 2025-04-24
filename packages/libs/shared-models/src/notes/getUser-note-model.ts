export class GetUserNotesModel {
    userId: string;
    includeArchived: boolean;
  
    constructor(userId: string, includeArchived: boolean = false) {
      this.userId = userId;
      this.includeArchived = includeArchived;
    }
  }
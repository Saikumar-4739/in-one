import { UserIdRequestModel } from "../authentication/userid-request-model";

export class CreateReelModel extends UserIdRequestModel {
    reelUrl: string;
    title: string;
    description?: string;
    visibility?: 'public' | 'private';
    authorId: string;
  
    constructor(
      userId : string,
      title: string,
      reelUrl: string,
      authorId: string,
      description: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      super(userId)
      this.title = title;
      this.reelUrl = reelUrl;
      this.authorId = authorId;
      this.description = description;
      this.visibility = visibility;
    }
  }
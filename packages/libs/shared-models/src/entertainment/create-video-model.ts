import { UserIdRequestModel } from "../authentication/userid-request-model";

export class CreateVideoModel extends UserIdRequestModel {
    title: string;
    description?: string;
    videoUrl: string;
    visibility?: 'public' | 'private' | 'unlisted';
  
    constructor(
      userId : string,  
      title: string,
      videoUrl: string,
      description: string = '',
      visibility: 'public' | 'private' | 'unlisted' = 'public'
    ) {
      super(userId)
      this.title = title;
      this.videoUrl = videoUrl;
      this.description = description;
      this.visibility = visibility;
    }
  }
  
import { VideoIdRequestModel } from "./video-id-request-model";

export class UpdateVideoModel extends VideoIdRequestModel {
    title?: string;
    description?: string;
    visibility?: 'public' | 'private' | 'unlisted';
  
    constructor(
      videoId: string,
      title?: string,
      description?: string,
      visibility?: 'public' | 'private' | 'unlisted'
    ) {
      super(videoId)
      this.title = title;
      this.description = description;
      this.visibility = visibility;
    }
  }
  
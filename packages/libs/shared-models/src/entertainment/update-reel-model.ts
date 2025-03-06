import { ReelIdRequestModel } from "./reel-id-request-model";

export class UpdateReelModel extends ReelIdRequestModel {
    reelUrl?: string;
    title?: string;
    description?: string;
    visibility?: 'public' | 'private';
  
    constructor(
      reelId : string,
      title?: string,
      reelUrl?: string,
      description: string = '',
      visibility: 'public' | 'private' = 'public'
    ) {
      super(reelId);
      this.title = title;
      this.reelUrl = reelUrl;
      this.description = description;
      this.visibility = visibility;
    }
  }
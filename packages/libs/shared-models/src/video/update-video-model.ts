import { VideoIdRequestModel } from "./video-id-request-model";

export class UpdateVideoModel extends VideoIdRequestModel {
  title?: string;
  description?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  thumbnailUrl?: string;
  duration?: number;
  status?: 'processing' | 'ready' | 'failed';
  isFeatured?: boolean;

  constructor(
    videoId: string,
    title?: string,
    description?: string,
    visibility?: 'public' | 'private' | 'unlisted',
    thumbnailUrl?: string,
    duration?: number,
    status?: 'processing' | 'ready' | 'failed',
    isFeatured?: boolean
  ) {
    super(videoId);
    this.title = title;
    this.description = description;
    this.visibility = visibility;
    this.thumbnailUrl = thumbnailUrl;
    this.duration = duration;
    this.status = status;
    this.isFeatured = isFeatured;
  }
}

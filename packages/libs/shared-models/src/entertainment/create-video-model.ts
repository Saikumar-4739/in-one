import { UserIdRequestModel } from "../authentication/userid-request-model";

export class CreateVideoModel extends UserIdRequestModel {
  title: string;
  description?: string;
  duration?: number;
  visibility?: 'public' | 'private' | 'unlisted';
  thumbnailUrl?: string;
  isFeatured?: boolean;

  constructor(
    userId: string,
    title: string,
    duration?: number,
    description: string = '',
    visibility: 'public' | 'private' | 'unlisted' = 'public',
    thumbnailUrl?: string,
    isFeatured: boolean = false
  ) {
    super(userId);
    this.title = title;
    this.description = description;
    this.duration = duration;
    this.visibility = visibility;
    this.thumbnailUrl = thumbnailUrl;
    this.isFeatured = isFeatured;
  }
}

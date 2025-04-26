export class LikeRequestModel {
    photoId: string;
    userId: string;
    constructor(photoId: string, userId: string) {
        this.photoId = photoId
        this.userId = userId
    }
  }
  
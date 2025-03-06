export class LikeVideoModel {
    videoId: string
    userId: string
    constructor(videoId: string, userId: string){
        this.videoId = videoId
        this.userId = userId
    }
}
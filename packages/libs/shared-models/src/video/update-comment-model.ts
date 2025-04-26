export class VideoUpdateCommentModel{
    commentId: string
    content: string
    constructor(commentId: string, content: string){
        this.commentId = commentId
        this.content = content
    }
}
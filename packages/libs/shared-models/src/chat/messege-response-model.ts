export class MessageResponseModel {
    _id: string;
    senderId: string;
    chatRoomId: string;
    text: string;
    createdAt: Date;
    receiverId?: string;
    constructor(_id: string, senderId: string, chatRoomId: string, text: string, createdAt: Date, receiverId?: string){
        this._id = _id
        this.senderId = senderId
        this.chatRoomId = chatRoomId
        this.text = text
        this.createdAt = createdAt
        this.receiverId  = receiverId
    }
  }
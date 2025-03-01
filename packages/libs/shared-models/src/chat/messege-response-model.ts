export class MessageResponseModel {
    _id: string;
    senderId: string;
    chatRoomId: string;
    text: string;
    createdAt: Date;
    constructor(_id: string, senderId: string, chatRoomId: string, text: string, createdAt: Date){
        this._id = _id
        this.senderId = senderId
        this.chatRoomId = chatRoomId
        this.text = text
        this.createdAt = createdAt
    }
  }
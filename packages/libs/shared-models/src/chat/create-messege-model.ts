export class CreateMessageModel {
    chatRoomId: string;
    text: string;
    senderId: string;
    constructor(chatRoomId: string, text: string, senderId: string){
        this.chatRoomId = chatRoomId
        this.text = text
        this.senderId =senderId
    }
  }
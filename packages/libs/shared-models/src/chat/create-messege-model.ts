export class CreateMessageModel {
    chatRoomId: string;
    text: string;
    constructor(chatRoomId: string, text: string){
        this.chatRoomId = chatRoomId
        this.text = text
    }
  }
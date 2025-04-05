export class CreateMessageModel {
    chatRoomId?: string; // Optional, since new groups won't have it initially
    senderId: string;
    text: string;
    participants?: string[]; // Optional, for group creation
    groupName?: string; // Optional, for group creation
    constructor(chatRoomId: string, text: string, senderId: string, participants: string[], groupName: string){
        this.chatRoomId = chatRoomId
        this.text = text
        this.senderId =senderId
        this.participants = participants
        this.groupName = groupName
    }
  }
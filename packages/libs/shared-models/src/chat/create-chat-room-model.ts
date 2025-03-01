export class CreateChatRoomModel {
    participants: string[];
    name?: string;
    constructor(participants: string[], name?: string){
        this.participants = participants
        this.name = name
    }
  }
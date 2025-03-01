export class ChatRoomResponse {
    _id: string;
    participants: string[];
    name: string;
    isGroup: boolean;
    lastMessage: string;
    constructor(_id: string, participants: string[], name: string, isGroup: boolean, lastMessage: string){
        this._id = _id
        this.participants = participants
        this.name = name
        this.isGroup = isGroup
        this.lastMessage = lastMessage
    }
  }
export class EditMessageModel {
    messageId: string;
    newText: string;
    constructor(messageId: string, newText: string ){
        this.messageId = messageId
        this.newText = newText 
    }
  }
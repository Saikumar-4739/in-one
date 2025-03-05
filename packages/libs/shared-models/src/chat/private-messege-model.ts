export class PrivateMessegeModel {
    senderId: string 
    receiverId: string
    text: string
    constructor(senderId: string, receiverId: string, text: string) {
        this.senderId = senderId
        this.receiverId = receiverId
        this.text = text
    }
}
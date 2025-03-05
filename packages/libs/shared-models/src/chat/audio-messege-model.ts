    export class AudioMessegeModel {
        senderId: string
        receiverId: string
        chatRoomId: string
        audioUrl: string
        duration: number
        constructor(senderId: string, receiverId: string, chatRoomId: string, audioUrl: string, duration: number){
            this.senderId = senderId
            this.receiverId = receiverId
            this.chatRoomId = chatRoomId
            this.audioUrl = audioUrl
            this.duration = duration
        }
    }
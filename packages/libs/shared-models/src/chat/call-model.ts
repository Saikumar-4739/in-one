export class CallModel {
    callerId: string;
    receiverId: string;
    callType: 'audio' | 'video';

    constructor(callerId: string, receiverId: string, callType: 'audio' | 'video') {
        this.callerId = callerId;
        this.receiverId = receiverId;
        this.callType = callType;
    }
}
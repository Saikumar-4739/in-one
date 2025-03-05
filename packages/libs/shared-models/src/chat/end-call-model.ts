export class EndCallModel {
    callId: string;
    status: 'missed' | 'completed' | 'declined';

    constructor(callId: string, status: 'missed' | 'completed' | 'declined') {
        this.callId = callId;
        this.status = status;
    }
}
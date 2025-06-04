export class GlobalResponseObject {
    status: boolean;
    errorCode: number;
    internalMessage: string;
    constructor(status: boolean, errorCode: number, internalMessage: string){
        this.status = status;
        this.errorCode = errorCode;
        this.internalMessage = internalMessage;
    }
}


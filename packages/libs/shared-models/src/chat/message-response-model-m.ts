import { GlobalResponseObject } from "../responses/global-response";
import { MessageResponseModel } from "./messege-response-model";

export class MessageResponse extends GlobalResponseObject {
    data?: MessageResponseModel
    constructor(status: boolean, errorCode: number, internalMessage: string, data?: MessageResponseModel) {
        super(status, errorCode, internalMessage)
        this.data = data
    }
}
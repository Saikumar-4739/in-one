export class CommonResponse<T> {
    status: boolean;
    errorCode: number;
    internalMessage: string;
    data?: T;
  
    constructor(status: boolean, errorCode: number, internalMessage: string, data?: T) {
      this.status = status;
      this.errorCode = errorCode;
      this.internalMessage = internalMessage;
      this.data = data;
    }
  }
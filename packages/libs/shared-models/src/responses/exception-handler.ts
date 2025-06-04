import { CommonResponse } from "./common-response";
import { ErrorResponse } from "./error-response";
import { HttpException } from '@nestjs/common';

export const returnException = <T extends CommonResponse>(
  classType: new (status: boolean, errorCode: number, internalMessage: string, data?: any) => T,
  errorObj: any
): T => {
  let errorCode = 0;
  let message = 'An unexpected error occurred';

  if (errorObj instanceof ErrorResponse) {
    errorCode = errorObj.errorCode ?? 0;
    message = errorObj.message ?? message;
  } else if (errorObj instanceof Error) {
    message = errorObj.message ?? message;
  }

  return new classType(false, errorCode, message);
};

export class ExceptionHandler {
  static handleError(error: any, message: string): CommonResponse {
    // If the error is an instance of HttpException, use its status and message
    if (error instanceof HttpException) {
      return new CommonResponse(
        false, 
        error.getStatus(), 
        error.message
      );
    }
    // For other errors, return a 500 Internal Server Error response
    return new CommonResponse(
      false, 
      500, 
      message
    );
  }
}
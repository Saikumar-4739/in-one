import { CommonResponse } from "./common-response";
import { ErrorResponse } from "./error-response";

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

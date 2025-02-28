import { HttpException } from '@nestjs/common';
import { CommonResponse } from './common-response';

export class ExceptionHandler {
  static handleError(error: any, message: string): CommonResponse<any> {
    if (error instanceof HttpException) {
      return new CommonResponse<any>(false, error.getStatus(), error.message);
    }
    return new CommonResponse<any>(false, 500, message);
  }
}

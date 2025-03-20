import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { password, ...safeBody } = req.body; // Remove password from logs
    this.logger.log(`Request to ${req.url} with body: ${JSON.stringify(safeBody)}`);
    next();
  }
}
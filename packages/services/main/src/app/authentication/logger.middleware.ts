import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as winston from 'winston';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
    transports: [
      new winston.transports.Console(), // Logs to terminal
      new winston.transports.File({ filename: '../../../../documents/logs/http.log' }) // Logs to file
    ]
  });

  use(req: Request, res: Response, next: NextFunction) {
    const { password, ...safeBody } = req.body; // Remove sensitive data
    // const logMessage = `Request to ${req.method} ${req.url} with body: ${JSON.stringify(safeBody)}`;

    // this.logger.info(logMessage); // Logs to both console and file
    next();
  }
}

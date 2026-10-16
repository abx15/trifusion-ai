import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export const CORRELATION_ID_HEADER = 'x-request-id';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const rawId = req.headers[CORRELATION_ID_HEADER] || req.headers['X-Request-Id'];
    const correlationId = (Array.isArray(rawId) ? rawId[0] : rawId) || crypto.randomUUID();

    req.correlationId = correlationId;
    res.setHeader('X-Request-Id', correlationId);

    next();
  }
}


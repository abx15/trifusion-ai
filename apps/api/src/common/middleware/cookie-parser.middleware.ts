import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      cookies?: Record<string, string>;
    }
  }
}

@Injectable()
export class CookieParserMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (!req.cookies) {
      req.cookies = {};
    }

    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const [rawKey, ...rawValues] = cookie.split('=');
        const key = rawKey?.trim();
        if (key) {
          try {
            req.cookies[key] = decodeURIComponent(rawValues.join('=').trim());
          } catch {
            req.cookies[key] = rawValues.join('=').trim();
          }
        }
      });
    }

    next();
  }
}

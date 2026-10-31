import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { formatStructuredLog } from '@trifusion/utils';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const type = context.getType< string >();
    let req: Request | undefined;
    let res: Response | undefined;

    if (type === 'graphql') {
      const gqlContext = context.getArgs()[2] as { req?: Request; res?: Response } | undefined;
      req = gqlContext?.req;
      res = gqlContext?.res;
    } else {
      const ctx = context.switchToHttp();
      req = ctx.getRequest<Request>();
      res = ctx.getResponse<Response>();
    }

    const { method, url, correlationId } = req || {};
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - now;
          const log = formatStructuredLog({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `${method} ${url} ${res?.statusCode} [${durationMs}ms]`,
            correlationId: correlationId || (res?.getHeader('X-Request-Id') as string),
            method,
            url,
            statusCode: res?.statusCode,
            durationMs,
          });
          console.log(log);
        },
        error: (err) => {
          const durationMs = Date.now() - now;
          const log = formatStructuredLog({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `${method} ${url} FAILED [${durationMs}ms]: ${err.message}`,
            correlationId: correlationId || (res?.getHeader('X-Request-Id') as string),
            method,
            url,
            statusCode: err.status || 500,
            durationMs,
            error: err.message,
          });
          console.error(log);
        },
      }),
    );
  }
}

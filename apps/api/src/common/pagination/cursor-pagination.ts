import { BadRequestException } from "@nestjs/common";

export interface CursorPaginationOptions {
 limit?: number;
 cursor?: string;
 maxLimit?: number;
 defaultLimit?: number;
}

export interface CursorPaginationResult<T> {
 data: T[];
 nextCursor: string | null;
 hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_LIMIT = 50;

export function decodeCursor(cursor?: string): string | null {
 if (cursor === undefined) return null;
 if (!/^[A-Za-z0-9+/]+={0,2}$/.test(cursor)) {
  throw new BadRequestException('Invalid cursor');
 }
 const decoded = Buffer.from(cursor, 'base64').toString('utf8');
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(decoded) || encodeCursor(decoded) !== cursor) {
  throw new BadRequestException('Invalid cursor');
 }
 return decoded;
}

export function encodeCursor(value: string): string {
 return Buffer.from(value, 'utf8').toString('base64');
}

export function normalizeLimit(options: CursorPaginationOptions): number {
 const { limit, maxLimit = DEFAULT_MAX_LIMIT, defaultLimit = DEFAULT_LIMIT } = options;
 if (limit === undefined || limit === null) return defaultLimit;
 const num = Number(limit);
 if (!Number.isInteger(num) || num < 1) {
  throw new BadRequestException('Limit must be a positive integer');
 }
 if (num > maxLimit) {
  throw new BadRequestException(`Limit must not exceed ${maxLimit}`);
 }
 return num;
}

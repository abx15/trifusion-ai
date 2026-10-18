import { BadRequestException } from '@nestjs/common';
import { decodeCursor, encodeCursor, normalizeLimit } from './cursor-pagination';

describe('cursor pagination', () => {
  it('round-trips cursors', () => {
    const id = '39e5a996-81a8-4b10-8d85-697bec3b32a4';
    expect(decodeCursor(encodeCursor(id))).toBe(id);
  });

  it('rejects malformed cursors', () => {
    expect(() => decodeCursor('not-base64!')).toThrow(BadRequestException);
    expect(() => decodeCursor('')).toThrow(BadRequestException);
    expect(() => decodeCursor(encodeCursor('not-a-uuid'))).toThrow(BadRequestException);
  });

  it('uses the default and accepts limits within the configured maximum', () => {
    expect(normalizeLimit({})).toBe(20);
    expect(normalizeLimit({ limit: 50 })).toBe(50);
  });

  it('rejects invalid and oversized limits', () => {
    expect(() => normalizeLimit({ limit: 0 })).toThrow(BadRequestException);
    expect(() => normalizeLimit({ limit: 1.5 })).toThrow(BadRequestException);
    expect(() => normalizeLimit({ limit: 51 })).toThrow(BadRequestException);
  });
});

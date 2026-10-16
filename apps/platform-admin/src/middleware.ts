import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const incomingId = request.headers.get('x-request-id');
  const correlationId = incomingId || crypto.randomUUID();

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', correlationId);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const incomingId = request.headers.get('x-request-id');
  const correlationId = incomingId || crypto.randomUUID();

  if (
    request.nextUrl.pathname.startsWith('/dashboard') &&
    !request.cookies.has('trifusion_access') &&
    !request.cookies.has('trifusion_refresh')
  ) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', correlationId);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

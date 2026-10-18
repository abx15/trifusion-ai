import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === '/login';
  const isApi = request.nextUrl.pathname.startsWith('/api/');
  if (
    !isLogin &&
    !isApi &&
    !request.cookies.has('tf_platform_access') &&
    !request.cookies.has('tf_platform_refresh')
  ) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const incomingId = request.headers.get('x-request-id');
  const correlationId = incomingId || crypto.randomUUID();

  const response = NextResponse.next();
  response.headers.set('X-Request-Id', correlationId);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

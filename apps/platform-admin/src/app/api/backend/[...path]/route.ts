import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: { path: string[] } };
const ACCESS_COOKIE = 'tf_platform_access';
const REFRESH_COOKIE = 'tf_platform_refresh';

function getApiBaseUrl(): URL {
  const base = new URL(
    process.env.API_INTERNAL_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3001/api/v1',
  );
  if (!['http:', 'https:'].includes(base.protocol)) {
    throw new Error('API_INTERNAL_URL must use http or https');
  }
  const pathname = base.pathname.replace(/\/+$/, '');
  if (!pathname.endsWith('/api/v1')) base.pathname = `${pathname}/api/v1`;
  return base;
}

const API_BASE_URL = getApiBaseUrl();

function apiUrl(path: string[]): URL {
  const suffix = path.map((part) => encodeURIComponent(part)).join('/');
  return new URL(`${API_BASE_URL.pathname.replace(/\/$/, '')}/${suffix}`, API_BASE_URL.origin);
}

function writeCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60,
  });
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

function clearCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

async function callApi(request: NextRequest, target: URL, body: string | undefined, token?: string) {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (request.headers.has('x-request-id')) {
    headers.set('x-request-id', request.headers.get('x-request-id')!);
  }
  return fetch(target, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
    redirect: 'manual',
  });
}

async function handle(request: NextRequest, { params }: RouteContext) {
  const path = params.path ?? [];
  const pathName = path.join('/');
  if (
    !['GET', 'HEAD'].includes(request.method) &&
    request.headers.has('origin') &&
    request.headers.get('origin') !== request.nextUrl.origin
  ) {
    return NextResponse.json({ statusCode: 403, message: 'Cross-origin request rejected' }, { status: 403 });
  }
  const target = apiUrl(path);
  let body = request.method === 'GET' ? undefined : await request.text();
  if (pathName === 'auth/refresh' && !body?.trim()) {
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refreshToken) body = JSON.stringify({ refreshToken });
  }

  try {
    let token = request.cookies.get(ACCESS_COOKIE)?.value;
    let upstream = await callApi(request, target, body, token);
    let rotated: { accessToken: string; refreshToken: string } | null = null;
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
    let refreshAttempted = false;
    if (
      upstream.status === 401 &&
      refreshToken &&
      pathName !== 'auth/login' &&
      pathName !== 'auth/register' &&
      pathName !== 'auth/refresh' &&
      pathName !== 'auth/logout'
    ) {
      refreshAttempted = Boolean(refreshToken);
      const refreshed = await fetch(apiUrl(['auth', 'refresh']), {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
      if (refreshed.ok) {
        const result: unknown = await refreshed.json();
        if (
          result &&
          typeof result === 'object' &&
          'accessToken' in result &&
          'refreshToken' in result &&
          typeof result.accessToken === 'string' &&
          typeof result.refreshToken === 'string'
        ) {
          rotated = { accessToken: result.accessToken, refreshToken: result.refreshToken };
          token = rotated.accessToken;
          upstream = await callApi(request, target, body, token);
        }
      }
    }

    const responseText = upstream.status === 204 ? '' : await upstream.text();
    let response = new NextResponse(responseText, {
      status: upstream.status,
      headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
    });
    if (rotated) writeCookies(response, rotated.accessToken, rotated.refreshToken);
    if (refreshAttempted && !rotated) clearCookies(response);

    if (pathName === 'auth/login' || pathName === 'auth/register') {
      const result: unknown = responseText ? JSON.parse(responseText) : null;
      if (
        result &&
        typeof result === 'object' &&
        'user' in result &&
        'tokens' in result &&
        result.tokens &&
        typeof result.tokens === 'object' &&
        'accessToken' in result.tokens &&
        'refreshToken' in result.tokens &&
        typeof result.tokens.accessToken === 'string' &&
        typeof result.tokens.refreshToken === 'string'
      ) {
        const accessToken = result.tokens.accessToken;
        const newRefreshToken = result.tokens.refreshToken;
        response = NextResponse.json({ user: result.user }, { status: upstream.status });
        writeCookies(response, accessToken, newRefreshToken);
      }
    } else if (pathName === 'auth/refresh' && upstream.ok) {
      const result: unknown = responseText ? JSON.parse(responseText) : null;
      if (
        result &&
        typeof result === 'object' &&
        'accessToken' in result &&
        'refreshToken' in result &&
        typeof result.accessToken === 'string' &&
        typeof result.refreshToken === 'string'
      ) {
        response = NextResponse.json({ success: true }, { status: upstream.status });
        writeCookies(response, result.accessToken, result.refreshToken);
      }
    } else if (pathName === 'auth/refresh') {
      clearCookies(response);
    } else if (pathName === 'auth/logout') {
      clearCookies(response);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Backend service unavailable';
    const response = NextResponse.json(
      { statusCode: 502, message: `Backend request failed: ${message}` },
      { status: 502 },
    );
    if (pathName === 'auth/logout') clearCookies(response);
    return response;
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;

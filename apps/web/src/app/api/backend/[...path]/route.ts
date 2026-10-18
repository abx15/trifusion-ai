import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: { path: string[] } };

const ACCESS_COOKIE = 'trifusion_access';
const REFRESH_COOKIE = 'trifusion_refresh';

function setSessionCookies(response: NextResponse, accessToken: string, refreshToken?: string) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60,
  });

  if (refreshToken) {
    response.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
  }
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

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

function buildTargetUrl(path: string[], search: string): URL {
  const base = API_BASE_URL;
  const encodedPath = path.map((part) => encodeURIComponent(part)).join('/');
  const target =
    encodedPath === 'graphql'
      ? new URL('/graphql', base.origin)
      : new URL(`${base.pathname.replace(/\/$/, '')}/${encodedPath}`, base.origin);
  target.search = search;
  return target;
}

async function readBody(request: NextRequest, path: string[]): Promise<string | undefined> {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;
  const body = await request.text();
  if (path.join('/') !== 'auth/refresh' || body.trim()) return body;

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  return refreshToken ? JSON.stringify({ refreshToken }) : body;
}

async function forward(
  request: NextRequest,
  target: URL,
  body: string | undefined,
  accessToken?: string,
) {
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  const correlationId = request.headers.get('x-request-id');
  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);
  if (correlationId) headers.set('x-request-id', correlationId);
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  return fetch(target, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
    redirect: 'manual',
  });
}

async function refreshAccessToken(request: NextRequest): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  const target = buildTargetUrl(['auth', 'refresh'], '');
  const refreshResponse = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
    redirect: 'manual',
  });
  if (!refreshResponse.ok) return null;

  const result: unknown = await refreshResponse.json();
  if (
    !result ||
    typeof result !== 'object' ||
    !('accessToken' in result) ||
    !('refreshToken' in result) ||
    typeof result.accessToken !== 'string' ||
    typeof result.refreshToken !== 'string'
  ) {
    throw new Error('Authentication API returned an invalid refresh response');
  }

  return { accessToken: result.accessToken, refreshToken: result.refreshToken };
}

async function handle(request: NextRequest, { params }: RouteContext) {
  const path = params.path ?? [];
  const pathText = path.join('/');
  if (
    !['GET', 'HEAD'].includes(request.method) &&
    request.headers.has('origin') &&
    request.headers.get('origin') !== request.nextUrl.origin
  ) {
    return NextResponse.json({ statusCode: 403, message: 'Cross-origin request rejected' }, { status: 403 });
  }
  const body = await readBody(request, path);
  const target = buildTargetUrl(path, request.nextUrl.search);
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  try {
    let upstream = await forward(request, target, body, accessToken);
    let refreshed: { accessToken: string; refreshToken: string } | null = null;

    let refreshAttempted = false;
    if (
      upstream.status === 401 &&
      pathText !== 'auth/login' &&
      pathText !== 'auth/register' &&
      pathText !== 'auth/refresh' &&
      pathText !== 'auth/logout'
    ) {
      refreshAttempted = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
      refreshed = await refreshAccessToken(request);
      if (refreshed) {
        accessToken = refreshed.accessToken;
        upstream = await forward(request, target, body, accessToken);
      }
    }

    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    const responseText = upstream.status === 204 ? '' : await upstream.text();
    let response = new NextResponse(responseText, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    });

    if (refreshed) {
      setSessionCookies(response, refreshed.accessToken, refreshed.refreshToken);
    }
    if (refreshAttempted && !refreshed) clearSessionCookies(response);

    if (pathText === 'auth/login' || pathText === 'auth/register') {
      const authResult: unknown = responseText ? JSON.parse(responseText) : null;
      if (
        authResult &&
        typeof authResult === 'object' &&
        'user' in authResult &&
        'tokens' in authResult &&
        authResult.tokens &&
        typeof authResult.tokens === 'object' &&
        'accessToken' in authResult.tokens &&
        'refreshToken' in authResult.tokens &&
        typeof authResult.tokens.accessToken === 'string' &&
        typeof authResult.tokens.refreshToken === 'string'
      ) {
        const tokens = authResult.tokens;
        const accessToken = tokens.accessToken;
        const refreshToken = tokens.refreshToken;
        if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
          throw new Error('Authentication API returned invalid session tokens');
        }
        response = new NextResponse(JSON.stringify({ user: authResult.user }), {
          status: upstream.status,
          headers: { 'content-type': 'application/json' },
        });
        setSessionCookies(response, accessToken, refreshToken);
      }
    } else if (pathText === 'auth/refresh' && upstream.ok) {
      const tokens: unknown = responseText ? JSON.parse(responseText) : null;
      if (
        tokens &&
        typeof tokens === 'object' &&
        'accessToken' in tokens &&
        'refreshToken' in tokens &&
        typeof tokens.accessToken === 'string' &&
        typeof tokens.refreshToken === 'string'
      ) {
        const accessToken = tokens.accessToken;
        const refreshToken = tokens.refreshToken;
        if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
          throw new Error('Authentication API returned invalid refreshed tokens');
        }
        response = new NextResponse(JSON.stringify({ success: true }), {
          status: upstream.status,
          headers: { 'content-type': 'application/json' },
        });
        setSessionCookies(response, accessToken, refreshToken);
      }
    } else if (pathText === 'auth/refresh') {
      clearSessionCookies(response);
    } else if (pathText === 'auth/logout') {
      clearSessionCookies(response);
    } else if (
      request.method === 'POST' &&
      /^workspaces\/[^/]+\/invitations$/.test(pathText) &&
      upstream.ok
    ) {
      const invitation: unknown = responseText ? JSON.parse(responseText) : null;
      if (invitation && typeof invitation === 'object' && 'invitationToken' in invitation) {
        const safeInvitation = Object.fromEntries(
          Object.entries(invitation).filter(([key]) => key !== 'invitationToken'),
        );
        response = NextResponse.json(safeInvitation, { status: upstream.status });
      }
    }

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to reach the authentication service';
    const response = NextResponse.json(
      { statusCode: 502, message: `Backend request failed: ${message}` },
      { status: 502 },
    );
    if (pathText === 'auth/logout') clearSessionCookies(response);
    return response;
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;

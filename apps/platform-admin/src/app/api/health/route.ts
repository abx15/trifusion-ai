import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const incomingId = request.headers.get('x-request-id');
  const correlationId = incomingId || crypto.randomUUID();

  return NextResponse.json(
    {
      status: 'ok',
      service: 'platform-admin',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'X-Request-Id': correlationId,
      },
    },
  );
}


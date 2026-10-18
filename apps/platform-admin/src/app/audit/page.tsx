'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  actorId: string | null;
  requestId: string | null;
  createdAt: string;
  actor: { email: string } | null;
}

interface AuditResponse {
  total: number;
  limit: number;
  offset: number;
  logs: AuditEntry[];
}

export default function AuditPage() {
  const { staff } = usePlatformStaff();
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/backend/platform/staff/audit-logs', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
          ? body.message
          : `Audit request failed with status ${response.status}.`;
        throw new Error(message);
      }
      setResult(body as AuditResponse);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Audit logs could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (staff) void loadLogs();
  }, [staff, loadLogs]);

  if (!staff) return null;
  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Global audit logs</h1>
        <p className="mt-2 text-sm text-slate-600">Audit records returned by NestJS. Sensitive metadata is not rendered.</p>
      </header>
      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-center" role="status">Loading audit records…</div>
      ) : error ? (
        <div className="rounded-lg border border-red-300 bg-white p-6" role="alert">
          <p className="font-medium">Audit logs could not be loaded</p>
          <p className="mt-1 text-sm text-slate-600">{error}</p>
          <button type="button" className="mt-4 rounded-md border px-4 py-2 text-sm" onClick={() => void loadLogs()}>Try again</button>
        </div>
      ) : result?.logs.length ? (
        <div className="overflow-hidden rounded-lg border bg-white">
          <p className="border-b px-4 py-3 text-sm text-slate-600">
            Showing {result.logs.length} of {result.total.toLocaleString()} records
          </p>
          <ul className="divide-y">
            {result.logs.map((entry) => (
              <li key={entry.id} className="grid gap-2 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="font-medium">{entry.action.replaceAll('_', ' ')}</p>
                  <p className="mt-1 truncate text-sm text-slate-600">{entry.targetType} · {entry.targetId}</p>
                  <p className="text-xs text-slate-500">{entry.actor?.email ?? 'System actor'} · Request {entry.requestId ?? 'not recorded'}</p>
                </div>
                <time className="text-sm text-slate-500" dateTime={entry.createdAt}>
                  {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-white p-10 text-center text-sm text-slate-600">No audit records were returned.</div>
      )}
    </section>
  );
}

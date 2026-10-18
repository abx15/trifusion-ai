'use client';

import { useState, type FormEvent } from 'react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

interface StatusUpdateResult {
  success: boolean;
  userId: string;
  status: string;
  reason: string;
}

export default function UserStatusPage() {
  const { staff } = usePlatformStaff();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusUpdateResult | null>(null);
  const [busy, setBusy] = useState(false);

  if (!staff) return null;
  if (!['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) {
    return <section role="alert" className="rounded-lg border bg-white p-6">This status tool requires PLATFORM_ADMIN or SUPERADMIN.</section>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData(formElement);
      const userId = String(form.get('userId') ?? '').trim();
      const response = await fetch(`/api/backend/platform/staff/users/${encodeURIComponent(userId)}/status`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          status: String(form.get('status') ?? ''),
          reason: String(form.get('reason') ?? '').trim(),
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
          ? body.message
          : `Status update failed with status ${response.status}.`;
        throw new Error(message);
      }
      setResult(body as StatusUpdateResult);
      formElement.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Status update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">User status</h1>
        <p className="mt-2 text-sm text-slate-600">The platform API does not provide user search/listing; updates require an exact user UUID.</p>
      </header>
      {error && <p role="alert" className="rounded-md border border-red-300 bg-white p-4 text-sm text-red-800">{error}</p>}
      {result && <p role="status" className="rounded-md border border-green-300 bg-white p-4 text-sm">Updated {result.userId} to {result.status}. The operation was submitted with an audit reason.</p>}
      <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-lg border bg-white p-5">
        <label className="block space-y-2 text-sm font-medium" htmlFor="userId">
          User UUID
          <input id="userId" name="userId" type="text" required pattern="[0-9a-fA-F-]{36}" className="h-10 w-full rounded-md border px-3 font-normal" />
        </label>
        <label className="block space-y-2 text-sm font-medium" htmlFor="status">
          Status
          <select id="status" name="status" required defaultValue="SUSPENDED" className="h-10 w-full rounded-md border px-3 font-normal">
            <option value="SUSPENDED">Suspend</option>
            <option value="ACTIVE">Activate</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm font-medium" htmlFor="reason">
          Justification
          <textarea id="reason" name="reason" required minLength={5} maxLength={500} rows={4} className="w-full rounded-md border px-3 py-2 font-normal" />
        </label>
        <button type="submit" disabled={busy} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {busy ? 'Submitting…' : 'Submit status change'}
        </button>
      </form>
    </section>
  );
}

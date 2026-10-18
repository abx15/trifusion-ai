'use client';

import Link from 'next/link';
import { usePlatformStaff } from '../contexts/platform-staff-context';

export default function AdminDashboardPage() {
  const { staff } = usePlatformStaff();
  if (!staff) return null;

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-medium text-blue-700">Platform administration</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Staff dashboard</h1>
        <p className="mt-2 text-slate-600">Only capabilities backed by the current platform API are enabled here.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">Verified staff session</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="inline text-slate-500">Role: </dt><dd className="inline font-medium">{staff.role.replaceAll('_', ' ')}</dd></div>
            <div><dt className="inline text-slate-500">Staff ID: </dt><dd className="break-all font-mono text-xs">{staff.id}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">Global audit stream</h2>
          <p className="mt-2 text-sm text-slate-600">View audit records returned by the platform audit API.</p>
          <Link href="/audit" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">Open audit logs →</Link>
        </section>
        <section className="rounded-lg border bg-white p-5">
          <h2 className="font-semibold">Platform analytics</h2>
          <p className="mt-2 text-sm text-slate-600">Aggregate usage and telemetry endpoints are not available yet.</p>
          <Link href="/analytics" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">Availability details →</Link>
        </section>
        {['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role) && (
          <section className="rounded-lg border bg-white p-5">
            <h2 className="font-semibold">User status administration</h2>
            <p className="mt-2 text-sm text-slate-600">The API supports audited status updates, but has no user search or listing endpoint.</p>
            <Link href="/users" className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline">Open status tool →</Link>
          </section>
        )}
      </div>

      <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Customer workspace content is intentionally not displayed in the platform console. Platform staff do not receive ambient tenant-data access.
      </p>
    </section>
  );
}

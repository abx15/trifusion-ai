'use client';

import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function AnalyticsPage() {
  const { staff } = usePlatformStaff();
  if (!staff) return null;
  if (!['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'].includes(staff.role)) {
    return <section role="alert" className="rounded-lg border bg-white p-6">This analytics route is not available to your platform role.</section>;
  }
  return (
    <section className="mx-auto max-w-3xl rounded-lg border bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Platform analytics</h1>
      <p className="mt-3 text-slate-700">This screen is deferred: there are no platform aggregate usage, quota, or telemetry endpoints to power it.</p>
      <p className="mt-3 text-sm text-slate-600">No metrics are fabricated. This route remains protected by the verified platform-staff API role.</p>
    </section>
  );
}

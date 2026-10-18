'use client';

import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function PlatformSettingsPage() {
  const { staff } = usePlatformStaff();
  if (!staff) return null;
  if (staff.role !== 'SUPERADMIN') {
    return <section role="alert" className="rounded-lg border bg-white p-6">This settings route requires the SUPERADMIN role.</section>;
  }
  return (
    <section className="mx-auto max-w-3xl rounded-lg border bg-white p-6 sm:p-8">
      <h1 className="text-2xl font-semibold">Global platform settings</h1>
      <p className="mt-3 text-slate-700">This screen is deferred because the current API does not expose global system configuration operations.</p>
      <p className="mt-3 text-sm text-slate-600">The UI does not create client-side configuration or pretend that changes were saved.</p>
    </section>
  );
}

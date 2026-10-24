'use client';

import { BarChart3 } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function MetricsPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Metrics</h1>
        <p className="text-slate-600">Aggregate platform analytics (de-identified)</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Platform Overview</h2>
        </div>

        <div className="rounded-md border p-8 text-center text-slate-500">
          <BarChart3 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>Platform metrics require API integration</p>
          <p className="text-sm mt-1">Backend endpoint: GET /platform/v1/metrics</p>
        </div>
      </div>

      <div className="rounded-lg border bg-green-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-green-900">Privacy Features</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
          <li>Minimum cohort size enforcement (5 entities)</li>
          <li>No per-workspace identifying data</li>
          <li>No per-user identifying data</li>
          <li>De-identified aggregates only</li>
          <li>Privacy note included in all responses</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import { Shield } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function GrantsPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Privileged Access Grants</h1>
        <p className="text-slate-600">Manage break-glass access to customer workspaces</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-semibold">Active Grants</h2>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Request New Grant
          </button>
        </div>

        <div className="rounded-md border p-8 text-center text-slate-500">
          <Shield className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>Grant management requires API integration</p>
          <p className="text-sm mt-1">Backend endpoints: POST/GET /platform/v1/grants</p>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-blue-900">Grant Lifecycle</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
          <li>Request grant with reason and scope</li>
          <li>Low-scope grants auto-approve for SUPERADMIN/PLATFORM_ADMIN</li>
          <li>High-scope grants require two-person approval</li>
          <li>Grants auto-expire at configured time (max 7 days)</li>
          <li>Grants can be revoked immediately</li>
          <li>All access under grant is audited with grant ID</li>
        </ul>
      </div>
    </div>
  );
}

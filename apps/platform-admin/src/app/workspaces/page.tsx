'use client';

import { Shield } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function WorkspacesPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workspaces</h1>
        <p className="text-slate-600">Manage workspace status and suspension</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">All Workspaces</h2>
        </div>

        <div className="rounded-md border p-8 text-center text-slate-500">
          <Shield className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>Workspace management requires API integration</p>
          <p className="text-sm mt-1">Backend endpoints: GET /platform/v1/workspaces, POST /platform/v1/workspaces/:id/status</p>
        </div>
      </div>

      <div className="rounded-lg border bg-amber-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-amber-900">Suspension Effects</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
          <li>Suspended workspace loses access immediately</li>
          <li>All API requests from suspended workspace are rejected</li>
          <li>Suspension is audited with mandatory reason</li>
          <li>Reactivation requires PLATFORM_ADMIN or SUPERADMIN</li>
        </ul>
      </div>
    </div>
  );
}

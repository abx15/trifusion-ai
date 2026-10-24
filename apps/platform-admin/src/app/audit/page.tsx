'use client';

import { Activity } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function AuditPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-slate-600">Search and filter audit events</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex gap-3">
          <input
            type="text"
            placeholder="Search by action, target..."
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <select className="rounded-md border px-3 py-2 text-sm">
            <option value="">All Actions</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="USER_LOGOUT">User Logout</option>
            <option value="WORKSPACE_CREATE">Workspace Create</option>
          </select>
        </div>

        <div className="rounded-md border p-8 text-center text-slate-500">
          <Activity className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>Audit log search requires API integration</p>
          <p className="text-sm mt-1">Backend endpoint: GET /platform/v1/audit-logs</p>
        </div>
      </div>

      <div className="rounded-lg border bg-amber-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-amber-900">Backend Implementation</h2>
        <p className="text-sm text-amber-700">
          Audit log search endpoint is fully implemented with filters for workspace, actor, action, grant ID, and date ranges.
          Frontend integration pending.
        </p>
      </div>
    </div>
  );
}

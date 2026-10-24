'use client';

import { Users } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function UsersPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-slate-600">Manage user account status</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">All Users</h2>
        </div>

        <div className="rounded-md border p-8 text-center text-slate-500">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>User management requires API integration</p>
          <p className="text-sm mt-1">Backend endpoints: GET /platform/v1/users, POST /platform/v1/users/:id/status</p>
        </div>
      </div>

      <div className="rounded-lg border bg-red-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-red-900">Suspension Effects</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
          <li>Suspended user cannot sign in</li>
          <li>Existing sessions are invalidated immediately</li>
          <li>Suspension is audited with mandatory reason</li>
          <li>Reactivation requires PLATFORM_ADMIN or SUPERADMIN</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import { Users } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function StaffPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Roles</h1>
        <p className="text-slate-600">Manage platform staff roles (SUPERADMIN only)</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-semibold">Platform Staff</h2>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Assign Role
          </button>
        </div>

        <div className="rounded-md border p-8 text-center text-slate-500">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>Staff role management requires API integration</p>
          <p className="text-sm mt-1">Backend endpoints: GET/POST/DELETE /platform/v1/staff-roles</p>
        </div>
      </div>

      <div className="rounded-lg border bg-red-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-red-900">Security Rules</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
          <li>Only SUPERADMIN can assign/revoke platform roles</li>
          <li>Staff cannot modify their own role</li>
          <li>Last SUPERADMIN cannot be removed or demoted</li>
          <li>All role changes are audited with reason</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import { Shield, Activity, Users, BarChart3 } from 'lucide-react';
import { usePlatformStaff } from '../contexts/platform-staff-context';

export default function DashboardPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-slate-600">Welcome, {staff.role.replaceAll('_', ' ')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="mt-2 text-2xl font-bold">--</p>
            </div>
            <Users className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Workspaces</p>
              <p className="mt-2 text-2xl font-bold">--</p>
            </div>
            <Shield className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Projects</p>
              <p className="mt-2 text-2xl font-bold">--</p>
            </div>
            <BarChart3 className="h-8 w-8 text-slate-400" />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Audit Events</p>
              <p className="mt-2 text-2xl font-bold">--</p>
            </div>
            <Activity className="h-8 w-8 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <a href="/audit" className="rounded-md border p-4 hover:bg-slate-50">
            <h3 className="font-medium">View Audit Logs</h3>
            <p className="mt-1 text-sm text-slate-600">Search and filter audit events</p>
          </a>
          <a href="/health" className="rounded-md border p-4 hover:bg-slate-50">
            <h3 className="font-medium">Service Health</h3>
            <p className="mt-1 text-sm text-slate-600">Check system status</p>
          </a>
          <a href="/grants" className="rounded-md border p-4 hover:bg-slate-50">
            <h3 className="font-medium">Access Grants</h3>
            <p className="mt-1 text-sm text-slate-600">Manage privileged access</p>
          </a>
        </div>
      </div>

      <div className="rounded-lg border bg-amber-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-amber-900">Platform Status</h2>
        <p className="text-sm text-amber-700">
          Platform administration is in active development. Some features may be unavailable or display placeholder data.
          Backend API is fully implemented.
        </p>
      </div>
    </div>
  );
}

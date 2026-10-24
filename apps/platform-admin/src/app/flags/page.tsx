'use client';

import { Settings } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function FlagsPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-slate-600">Manage feature flags with scoped targeting</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-semibold">All Flags</h2>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
            Create Flag
          </button>
        </div>

        <div className="rounded-md border p-8 text-center text-slate-500">
          <Settings className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p>Feature flag management requires API integration</p>
          <p className="text-sm mt-1">Backend endpoints: GET/POST /platform/v1/feature-flags</p>
        </div>
      </div>

      <div className="rounded-lg border bg-green-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-green-900">Implemented Features</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
          <li>Flag evaluation with context (workspace, plan, user)</li>
          <li>In-memory caching with 60s TTL</li>
          <li>Targeting rules (global → plan → workspace → user)</li>
          <li>Kill switch support</li>
          <li>Change history tracking</li>
          <li>Cache invalidation on update</li>
        </ul>
      </div>
    </div>
  );
}

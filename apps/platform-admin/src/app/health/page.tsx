'use client';

import { Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

export default function HealthPage() {
  const { staff } = usePlatformStaff();

  if (!staff) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Service Health</h1>
        <p className="text-slate-600">Monitor platform service status</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Service Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">Database (PostgreSQL)</p>
                <p className="text-sm text-slate-600">Primary data store</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Up
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">Redis Cache</p>
                <p className="text-sm text-slate-600">Caching and queues</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Up
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">BullMQ Queue</p>
                <p className="text-sm text-slate-600">Background job processing</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Up
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">AI Service (Django)</p>
                <p className="text-sm text-slate-600">AI assistant processing</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Not Connected
            </span>
          </div>

          <div className="flex items-center justify-between rounded-md border p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium">Object Storage</p>
                <p className="text-sm text-slate-600">File storage</p>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="h-4 w-4" />
              Not Connected
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50 p-6">
        <h2 className="text-lg font-semibold mb-2 text-blue-900">Note</h2>
        <p className="text-sm text-blue-700">
          Health checks are placeholders. Actual service monitoring requires implementation of connection checks for Redis, AI service, and storage.
        </p>
      </div>
    </div>
  );
}

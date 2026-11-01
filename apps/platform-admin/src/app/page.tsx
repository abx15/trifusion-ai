'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Button,
  Badge,
  KPICard,
  Table,
  EmptyState,
} from '@trifusion/ui';
import { usePlatformStaff } from '../contexts/platform-staff-context';

async function fetchJson(path: string) {
  const res = await fetch(`/api/backend${path}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function PlatformDashboardPage() {
  const { staff, isLoading } = usePlatformStaff();
const [metrics, setMetrics] = useState<any>(null);
const [workspaces, setWorkspaces] = useState<any[]>([]);
const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!staff) return;
    const canSeeMetrics = ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'].includes(staff.role);
    const canSeeWorkspaces = ['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role);
    const canSeeAudit = ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'].includes(staff.role);
    const requests: Promise<void>[] = [];
    if (canSeeMetrics) requests.push(fetchJson('/platform/v1/metrics').then((data) => { if (data) setMetrics(data); }));
    if (canSeeWorkspaces) requests.push(fetchJson('/platform/v1/workspaces?limit=10').then((data) => { if (data) setWorkspaces(Array.isArray(data) ? data : data.data || []); }));
    if (canSeeAudit) requests.push(fetchJson('/platform/v1/audit-logs?limit=10').then((data) => { if (data) setAuditLogs(Array.isArray(data) ? data : data.data || []); }));
    void Promise.all(requests);
  }, [staff]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid #e2e8f0',
          borderTopColor: '#003F5C',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  if (!staff) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1>Platform Access Required</h1>
        <p>You do not have platform staff privileges to access this area.</p>
      </div>
    );
  }

  const platformRole = staff.role;
  const config = platformRole === 'ANALYST'
    ? { design: 'dark', layout: 'bento' }
    : platformRole === 'SUPPORT_AGENT'
      ? { design: 'helpdesk', layout: 'kanban' }
      : platformRole === 'SUPERADMIN'
        ? { design: 'glassmorphism', layout: 'bento' }
        : { design: 'minimalist', layout: 'grid' };
  return (
    <div className={`platform-dashboard platform-${config.design} platform-layout-${config.layout}`}>
      <div className="platform-hero">
        <div>
          <span className="platform-eyebrow">{config.design} operations</span>
          <h1>{platformRole === 'SUPPORT_AGENT' ? 'Support command center' : platformRole === 'ANALYST' ? 'Data & telemetry' : 'Platform Dashboard'}</h1>
          <p>Welcome, {staff.role.replaceAll('_', ' ')}. Your role-specific control surface is ready.</p>
        </div>
        <Badge variant="default" className="platform-role">{staff.role}</Badge>
      </div>

      <div className="platform-kpis">
        <KPICard title="Total Users" value={metrics?.total_users ?? '--'} />
        <KPICard title="Workspaces" value={metrics?.total_workspaces ?? workspaces.length ?? '--'} />
        <KPICard title="Active Projects" value={metrics?.total_projects ?? '--'} />
        <KPICard title="Audit Events" value={metrics?.total_audit_events ?? '--'} />
      </div>

      <div className="platform-content-grid">
        <Card className="platform-panel" variant="elevated">
          <CardContent style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Recent Workspaces</h3>
            {workspaces.length > 0 ? (
              <Table
                columns={[
                  { key: 'name', label: 'Name', width: '50%' },
                  { key: 'status', label: 'Status', width: '25%' },
                  { key: 'type', label: 'Type', width: '25%' },
                ]}
                data={workspaces.map((w: any) => ({
                  name: w.name || 'Unknown',
                  status: w.status || 'ACTIVE',
                  type: w.type || 'PERSONAL',
                }))}
              />
            ) : (
              <EmptyState title="No workspaces" description="No workspaces found." />
            )}
          </CardContent>
        </Card>
        <Card className="platform-panel" variant="elevated">
          <CardContent style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Recent Activity</h3>
            {auditLogs.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {auditLogs.map((log: any) => (
                  <div key={log.id} style={{ padding: 8, borderBottom: '1px solid #e2e8f0' }}>
                    <p style={{ fontWeight: 500, marginBottom: 2 }}>
                      {log.action?.replaceAll('_', ' ') || 'Unknown action'}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {log.actorId?.slice(0, 8) || 'Unknown'} · {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : 'Unknown date'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No activity" description="No audit events found." />
            )}
          </CardContent>
        </Card>
      </div>

      {staff.role === 'SUPERADMIN' && (
        <Card variant="outlined" style={{ marginTop: 16 }}>
          <CardContent>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Super Admin Controls</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="outline" style={{ flex: 1, minWidth: 150 }}>
                Manage Staff Roles
              </Button>
              <Button variant="outline" style={{ flex: 1, minWidth: 150 }}>
                Global Configuration
              </Button>
              <Button variant="outline" style={{ flex: 1, minWidth: 150 }}>
                System Health
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

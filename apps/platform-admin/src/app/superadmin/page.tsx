'use client';

import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { KPICard, EmptyState, Table, Alert } from '@trifusion/ui';
import { PlatformDashboardShell } from '../../components/platform-dashboard-shell';
import { PlatformLoadingSkeleton } from '../../components/platform-loading-skeleton';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`/api/backend${path}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const payload: unknown = await res.json().catch(() => null);
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String(payload.message)
        : `Platform API request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
}

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalAuditEvents: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  recentUsers: Array<{
    id: string;
    email: string;
    status: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  }>;
  recentWorkspaces: Array<{
    id: string;
    name: string;
    status: string;
    type: string;
    ownerEmail: string | null;
    memberCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    actorId: string;
    actorType: string;
  }>;
}

export default function SuperadminDashboardPage() {
  const { staff, refresh } = usePlatformStaff();

  const hasAccess = staff?.role === 'SUPERADMIN';

  const statsQuery = useQuery<PlatformStats>({
    queryKey: ['superadmin-dashboard-stats', staff?.id],
    queryFn: async () => {
      if (!staff) throw new Error('Platform staff access is required.');
      const [metrics, users, workspaces, auditLogs] = await Promise.all([
        fetchJson('/platform/v1/metrics'),
        fetchJson('/platform/v1/users?limit=10'),
        fetchJson('/platform/v1/workspaces?limit=10'),
        fetchJson('/platform/v1/audit-logs?limit=10'),
      ]);

      const totalUsers = metrics.totalUsers ?? 0;
      const activeUsers = metrics.activeUsers ?? 0;
      const totalTenants = metrics.totalWorkspaces ?? 0;
      const activeTenants = metrics.activeWorkspaces ?? 0;
      const suspendedTenants = metrics.suspendedWorkspaces ?? 0;
      const totalAuditEvents = auditLogs.total ?? auditLogs.length ?? 0;

      return {
        totalUsers,
        activeUsers,
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalAuditEvents,
        verifiedUsers: metrics.verifiedUsers ?? 0,
        unverifiedUsers: metrics.unverifiedUsers ?? 0,
        recentUsers: (users.users ?? []).map((u: any) => ({
          id: u.id,
          email: u.email,
          status: u.status,
          firstName: u.profile?.firstName ?? null,
          lastName: u.profile?.lastName ?? null,
          createdAt: u.createdAt,
        })),
        recentWorkspaces: (workspaces.workspaces ?? []).map((w: any) => ({
          id: w.id,
          name: w.name,
          status: w.status,
          type: w.type,
          ownerEmail: w.owner?.email ?? null,
          memberCount: w._count?.members ?? 0,
        })),
        recentActivity: (auditLogs.logs ?? []).map((log: any) => ({
          id: log.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          createdAt: log.createdAt,
          actorId: log.actorId,
          actorType: log.actorType,
        })),
      };
    },
    enabled: hasAccess,
  });

  if (!staff || staff.role !== 'SUPERADMIN') {
    return (
      <section
        className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8 text-center"
        role="alert"
      >
        <h1 className="text-xl font-semibold">SUPERADMIN access required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only the SUPERADMIN role can access the global platform control center.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-5 rounded-md border px-4 py-2 text-sm"
        >
          Refresh access
        </button>
      </section>
    );
  }



  const loading = statsQuery.isPending;
  const error = statsQuery.error;

  if (loading) return <PlatformLoadingSkeleton title="Loading the platform control center" />;
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof Error ? error.message : 'Unable to load platform data.'}
      </Alert>
    );
  }

  const stats = statsQuery.data!;

  return (
    <PlatformDashboardShell
      role="SUPERADMIN"
      navItems={[
        {
          id: 'overview',
          label: 'Dashboard Overview',
          icon: 'LayoutDashboard',
          href: '/superadmin',
        },
        { id: 'analytics', label: 'Platform Analytics', icon: 'BarChart', href: '/analytics' },
        { id: 'tenants', label: 'Tenant Management', icon: 'Building', href: '/workspaces' },
        { id: 'users', label: 'User Management', icon: 'Users', href: '/users' },
        { id: 'staff', label: 'Platform Staff Management', icon: 'Shield', href: '/staff' },
        { id: 'roles', label: 'Role & Permission Management', icon: 'Lock', href: '/grants' },
        { id: 'config', label: 'Global Configuration', icon: 'Settings', href: '/settings' },
        {
          id: 'subscriptions',
          label: 'Subscription Management',
          icon: 'CreditCard',
          href: '/settings',
        },
        { id: 'health', label: 'Platform Health', icon: 'Activity', href: '/health' },
        { id: 'api-monitoring', label: 'API Monitoring', icon: 'Monitor', href: '/metrics' },
        { id: 'security', label: 'Security Center', icon: 'Shield', href: '/audit' },
        { id: 'audit-logs', label: 'Global Audit Logs', icon: 'Activity', href: '/audit' },
        { id: 'reports', label: 'Reports', icon: 'BarChart', href: '/analytics' },
        { id: 'integrations', label: 'Integrations', icon: 'Link', href: '/settings' },
        { id: 'system-settings', label: 'System Settings', icon: 'Settings', href: '/settings' },
      ]}
      breadcrumbs={[
        { label: 'Platform Control Center', href: '/superadmin' },
        { label: 'Overview' },
      ]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, mb: 4 }}>
        <KPICard
          title="Total Registered Users"
          value={stats.totalUsers}
          trend={{ value: 'Live database data', positive: true }}
          icon={<div>👥</div>}
        />
        <KPICard
          title="Active Users"
          value={stats.activeUsers}
          trend={{ value: 'Live database data', positive: true }}
          icon={<div>✅</div>}
        />
        <KPICard
          title="Total Tenants"
          value={stats.totalTenants}
          trend={{ value: 'Live database data', positive: true }}
          icon={<div>🏢</div>}
        />
        <KPICard
          title="Suspended Tenants"
          value={stats.suspendedTenants}
          trend={{
            value: stats.suspendedTenants > 0 ? 'requires attention' : 'none',
            positive: stats.suspendedTenants === 0,
          }}
          icon={<div>⏸️</div>}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Global User Management
            </Typography>
            {stats.recentUsers.length > 0 ? (
              <Table
                columns={[
                  { key: 'name', label: 'Name', width: '30%' },
                  { key: 'email', label: 'Email', width: '35%' },
                  { key: 'status', label: 'Status', width: '20%' },
                  { key: 'createdAt', label: 'Joined', width: '15%' },
                ]}
                data={stats.recentUsers.map((u) => ({
                  id: u.id,
                  name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email,
                  email: u.email,
                  status: u.status,
                  createdAt: new Date(u.createdAt).toLocaleDateString(),
                }))}
                emptyMessage="No users found."
              />
            ) : (
              <EmptyState title="No users" description="No registered users found." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Platform Activity
            </Typography>
            {stats.recentActivity.length > 0 ? (
              <Box
                sx={{
                  maxHeight: 400,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {stats.recentActivity.slice(0, 8).map((log) => (
                  <Box
                    key={log.id}
                    className="flex items-center justify-between p-2 rounded-md border border-divider/50"
                  >
                    <Box className="flex items-center gap-2">
                      <Typography variant="body2">{log.action.replaceAll('_', ' ')}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {log.targetType}
                      </Typography>
                    </Box>
                    <Box className="flex items-center gap-2">
                      <Typography variant="caption" color="text.secondary">
                        {log.actorType}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No activity" description="No platform audit events found." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Tenant Overview
            </Typography>
            {stats.recentWorkspaces.length > 0 ? (
              <Table
                columns={[
                  { key: 'name', label: 'Tenant', width: '30%' },
                  { key: 'status', label: 'Status', width: '20%' },
                  { key: 'type', label: 'Type', width: '20%' },
                  { key: 'ownerEmail', label: 'Owner', width: '20%' },
                  { key: 'memberCount', label: 'Members', width: '10%' },
                ]}
                data={stats.recentWorkspaces.map((w) => ({
                  id: w.id,
                  name: w.name,
                  status: w.status,
                  type: w.type,
                  ownerEmail: w.ownerEmail ?? '—',
                  memberCount: w.memberCount,
                }))}
                emptyMessage="No tenants found."
              />
            ) : (
              <EmptyState
                title="No tenants"
                description="No workspaces registered on the platform."
              />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Platform Quick Actions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <LinkCmp href="/staff" variant="outlined" startIcon={<div>🛡️</div>}>
              Manage Staff Roles
            </LinkCmp>
            <LinkCmp href="/settings" variant="outlined" startIcon={<div>⚙️</div>}>
              Global Configuration
            </LinkCmp>
            <LinkCmp href="/workspaces" variant="outlined" startIcon={<div>🏢</div>}>
              Tenant Management
            </LinkCmp>
            <LinkCmp href="/audit" variant="outlined" startIcon={<div>📋</div>}>
              Global Audit Logs
            </LinkCmp>
          </Box>
        </Paper>
      </Box>
    </PlatformDashboardShell>
  );
}

function LinkCmp({
  children,
  variant,
  href,
  startIcon,
}: {
  children: React.ReactNode;
  variant?: 'contained' | 'outlined';
  href: string;
  startIcon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
        variant === 'outlined'
          ? 'border-divider text-slate-700 hover:bg-slate-100'
          : 'bg-primary text-white hover:bg-primary-dark'
      }`}
    >
      {startIcon && <span>{startIcon}</span>}
      {children}
    </a>
  );
}

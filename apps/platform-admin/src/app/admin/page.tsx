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

interface PlatformAdminStats {
  activeTenants: number;
  pendingActivations: number;
  activeUsers: number;
  suspendedAccounts: number;
  recentWorkspaces: Array<{
    id: string;
    name: string;
    status: string;
    type: string;
    ownerEmail: string | null;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    status: string;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    targetType: string;
    targetId: string;
    createdAt: string;
  }>;
}

export default function PlatformAdminDashboardPage() {
  const { staff, refresh } = usePlatformStaff();

  const hasAccess = Boolean(staff && ['PLATFORM_ADMIN', 'SUPERADMIN'].includes(staff.role));

  const statsQuery = useQuery<PlatformAdminStats>({
    queryKey: ['platform-admin-dashboard-stats', staff?.id],
    queryFn: async () => {
      if (!staff) throw new Error('Platform staff access is required.');
      const [metrics, workspaces, users, auditLogs] = await Promise.all([
        fetchJson('/platform/v1/metrics'),
        fetchJson('/platform/v1/workspaces?limit=10'),
        fetchJson('/platform/v1/users?limit=10'),
        fetchJson('/platform/v1/audit-logs?limit=10'),
      ]);

      return {
        activeTenants: metrics.activeWorkspaces ?? 0,
        pendingActivations: metrics.unverifiedUsers ?? 0,
        activeUsers: metrics.activeUsers ?? 0,
        suspendedAccounts: metrics.suspendedUsers ?? 0,
        recentWorkspaces: (workspaces.workspaces ?? []).map((w: any) => ({
          id: w.id,
          name: w.name,
          status: w.status,
          type: w.type,
          ownerEmail: w.owner?.email ?? null,
        })),
        recentUsers: (users.users ?? []).map((u: any) => ({
          id: u.id,
          email: u.email,
          status: u.status,
          createdAt: u.createdAt,
        })),
        recentActivity: (auditLogs.logs ?? []).map((log: any) => ({
          id: log.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          createdAt: log.createdAt,
        })),
      };
    },
    enabled: hasAccess,
  });

  if (!staff || !['PLATFORM_ADMIN', 'SUPERADMIN'].includes(staff.role)) {
    return (
      <section
        className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8 text-center"
        role="alert"
      >
        <h1 className="text-xl font-semibold">Platform Admin access required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only PLATFORM_ADMIN or SUPERADMIN can access the operations dashboard.
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

  if (loading) return <PlatformLoadingSkeleton title="Loading operations and tenant data" />;
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof Error ? error.message : 'Unable to load operations data.'}
      </Alert>
    );
  }

  const stats = statsQuery.data!;

  return (
    <PlatformDashboardShell
      role="PLATFORM_ADMIN"
      navItems={[
        { id: 'overview', label: 'Operations Overview', icon: 'LayoutDashboard', href: '/admin' },
        { id: 'tenants', label: 'Tenant Management', icon: 'Building', href: '/workspaces' },
        { id: 'users', label: 'User Management', icon: 'Users', href: '/users' },
        { id: 'activation', label: 'Account Activation', icon: 'PlayCircle', href: '/users' },
        { id: 'suspension', label: 'Account Suspension', icon: 'PauseCircle', href: '/users' },
        {
          id: 'workspace-monitoring',
          label: 'Workspace Monitoring',
          icon: 'Monitor',
          href: '/workspaces',
        },
        { id: 'usage-quotas', label: 'Usage & Quotas', icon: 'BarChart', href: '/metrics' },
        { id: 'platform-activity', label: 'Platform Activity', icon: 'Activity', href: '/audit' },
        { id: 'support', label: 'Support Management', icon: 'Headset', href: '/support' },
        { id: 'reports', label: 'Operational Reports', icon: 'BarChart', href: '/analytics' },
        { id: 'settings', label: 'Settings', icon: 'Settings', href: '/settings' },
      ]}
      breadcrumbs={[{ label: 'Platform Operations', href: '/admin' }, { label: 'Overview' }]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, mb: 4 }}>
        <KPICard
          title="Active Tenants"
          value={stats.activeTenants}
          trend={{ value: 'Live database data', positive: true }}
          icon={<div>🏢</div>}
        />
        <KPICard
          title="Active Users"
          value={stats.activeUsers}
          trend={{ value: 'Live database data', positive: true }}
          icon={<div>👥</div>}
        />
        <KPICard
          title="Suspended Accounts"
          value={stats.suspendedAccounts}
          trend={{
            value: stats.suspendedAccounts > 0 ? 'requires attention' : 'none',
            positive: stats.suspendedAccounts === 0,
          }}
          icon={<div>⏸️</div>}
        />
        <KPICard
          title="Pending Activations"
          value={stats.pendingActivations}
          icon={<div>⏳</div>}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Tenant Management
            </Typography>
            {stats.recentWorkspaces.length > 0 ? (
              <Table
                columns={[
                  { key: 'name', label: 'Tenant Name', width: '35%' },
                  { key: 'status', label: 'Status', width: '25%' },
                  { key: 'type', label: 'Type', width: '20%' },
                  { key: 'ownerEmail', label: 'Owner', width: '20%' },
                ]}
                data={stats.recentWorkspaces.map((w) => ({
                  id: w.id,
                  name: w.name,
                  status: w.status,
                  type: w.type,
                  ownerEmail: w.ownerEmail ?? '—',
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
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Operational Activity
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
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No activity" description="No recent operational activity." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent User Accounts
            </Typography>
            {stats.recentUsers.length > 0 ? (
              <Table
                columns={[
                  { key: 'email', label: 'Email', width: '50%' },
                  { key: 'status', label: 'Status', width: '25%' },
                  { key: 'createdAt', label: 'Created', width: '25%' },
                ]}
                data={stats.recentUsers.map((u) => ({
                  id: u.id,
                  email: u.email,
                  status: u.status,
                  createdAt: new Date(u.createdAt).toLocaleDateString(),
                }))}
                emptyMessage="No users found."
              />
            ) : (
              <EmptyState title="No users" description="No user accounts found." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Operational Quick Actions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <LinkCmp href="/workspaces" variant="outlined" startIcon={<div>🏢</div>}>
              Manage Tenants
            </LinkCmp>
            <LinkCmp href="/users" variant="outlined" startIcon={<div>👥</div>}>
              Manage Users
            </LinkCmp>
            <LinkCmp href="/users" variant="outlined" startIcon={<div>✅</div>}>
              Account Activation
            </LinkCmp>
            <LinkCmp href="/users" variant="outlined" startIcon={<div>⏸️</div>}>
              Account Suspension
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

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Stack,
} from '@mui/material';
import {
  KPICard,
  EmptyState,
  Table,
  Alert,
  Spinner,
} from '@trifusion/ui';
import { PlatformDashboardShell } from '../../components/platform-dashboard-shell';
import { usePlatformStaff } from '../../contexts/platform-staff-context';

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`/api/backend${path}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
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

  if (!staff || !['PLATFORM_ADMIN', 'SUPERADMIN'].includes(staff.role)) {
    return (
      <section className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8 text-center" role="alert">
        <h1 className="text-xl font-semibold">Platform Admin access required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only PLATFORM_ADMIN or SUPERADMIN can access the operations dashboard.
        </p>
        <button type="button" onClick={() => void refresh()} className="mt-5 rounded-md border px-4 py-2 text-sm">
          Refresh access
        </button>
      </section>
    );
  }

  const statsQuery = useQuery<PlatformAdminStats>({
    queryKey: ['platform-admin-dashboard-stats', staff.id],
    queryFn: async () => {
      const [workspaces, users, auditLogs] = await Promise.all([
        fetchJson('/platform/v1/workspaces?limit=10'),
        fetchJson('/platform/v1/users?limit=10'),
        fetchJson('/platform/v1/audit-logs?limit=10'),
      ]);

      const activeTenants = workspaces.workspaces?.filter((w: any) => w.status === 'ACTIVE').length ?? 0;
      const suspendedTenants = workspaces.workspaces?.filter((w: any) => w.status === 'SUSPENDED').length ?? 0;
      const activeUsers = users.users?.filter((u: any) => u.status === 'ACTIVE').length ?? 0;

      return {
        activeTenants,
        pendingActivations: 0,
        activeUsers,
        suspendedAccounts: suspendedTenants,
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
        recentActivity: (auditLogs ?? []).map((log: any) => ({
          id: log.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          createdAt: log.createdAt,
        })),
      };
    },
    enabled: Boolean(staff && ['PLATFORM_ADMIN', 'SUPERADMIN'].includes(staff.role)),
  });

  const loading = statsQuery.isPending;
  const error = statsQuery.error;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="large" />
        <span className="ml-2">Loading operations dashboard…</span>
      </div>
    );
  }
  if (error) {
    return <Alert severity="error">{error instanceof Error ? error.message : 'Unable to load operations data.'}</Alert>;
  }

  const stats = statsQuery.data!;

  return (
    <PlatformDashboardShell
      role="PLATFORM_ADMIN"
      navItems={[
        { id: 'overview', label: 'Operations Overview', icon: 'LayoutDashboard', href: '/platform-admin/admin' },
        { id: 'tenants', label: 'Tenant Management', icon: 'Building', href: '/platform-admin/admin/tenants' },
        { id: 'users', label: 'User Management', icon: 'Users', href: '/platform-admin/admin/users' },
        { id: 'activation', label: 'Account Activation', icon: 'PlayCircle', href: '/platform-admin/admin/activation' },
        { id: 'suspension', label: 'Account Suspension', icon: 'PauseCircle', href: '/platform-admin/admin/suspension' },
        { id: 'workspace-monitoring', label: 'Workspace Monitoring', icon: 'Monitor', href: '/platform-admin/admin/workspace-monitoring' },
        { id: 'usage-quotas', label: 'Usage & Quotas', icon: 'BarChart', href: '/platform-admin/admin/usage-quotas' },
        { id: 'platform-activity', label: 'Platform Activity', icon: 'Activity', href: '/platform-admin/admin/platform-activity' },
        { id: 'support', label: 'Support Management', icon: 'Headset', href: '/platform-admin/admin/support' },
        { id: 'reports', label: 'Operational Reports', icon: 'BarChart', href: '/platform-admin/admin/reports' },
        { id: 'settings', label: 'Settings', icon: 'Settings', href: '/platform-admin/admin/settings' },
      ]}
      breadcrumbs={[{ label: 'Platform Operations', href: '/platform-admin/admin' }, { label: 'Overview' }]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        <KPICard title="Active Tenants" value={stats.activeTenants} trend={{ value: '+6% this month', positive: true }} icon={<div>🏢</div>} />
        <KPICard title="Active Users" value={stats.activeUsers} trend={{ value: '+5% this month', positive: true }} icon={<div>👥</div>} />
        <KPICard title="Suspended Accounts" value={stats.suspendedAccounts} trend={{ value: stats.suspendedAccounts > 0 ? 'requires attention' : 'none', positive: stats.suspendedAccounts === 0 }} icon={<div>⏸️</div>} />
        <KPICard title="Pending Activations" value={stats.pendingActivations} icon={<div>⏳</div>} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 3 }}>
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
              <EmptyState title="No tenants" description="No workspaces registered on the platform." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Operational Activity
            </Typography>
            {stats.recentActivity.length > 0 ? (
              <Box sx={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {stats.recentActivity.slice(0, 8).map((log) => (
                  <Box key={log.id} className="flex items-center justify-between p-2 rounded-md border border-divider/50">
                    <Box className="flex items-center gap-2">
                      <Typography variant="body2">{log.action.replaceAll('_', ' ')}</Typography>
                      <Typography variant="caption" color="text.secondary">{log.targetType}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleDateString()}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No activity" description="No recent operational activity." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
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
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Operational Quick Actions</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <LinkCmp href="/platform-admin/admin/tenants" variant="outlined" startIcon={<div>🏢</div>}>
              Manage Tenants
            </LinkCmp>
            <LinkCmp href="/platform-admin/admin/users" variant="outlined" startIcon={<div>👥</div>}>
              Manage Users
            </LinkCmp>
            <LinkCmp href="/platform-admin/admin/activation" variant="outlined" startIcon={<div>✅</div>}>
              Account Activation
            </LinkCmp>
            <LinkCmp href="/platform-admin/admin/suspension" variant="outlined" startIcon={<div>⏸️</div>}>
              Account Suspension
            </LinkCmp>
          </Box>
        </Paper>
      </Box>
    </PlatformDashboardShell>
  );
}

function LinkCmp({ children, variant, href, startIcon }: { children: React.ReactNode; variant?: 'contained' | 'outlined'; href: string; startIcon?: React.ReactNode }) {
  return (
    <a
      href={href}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
        variant === 'outlined' ? 'border-divider text-slate-700 hover:bg-slate-100' : 'bg-primary text-white hover:bg-primary-dark'
      }`}
    >
      {startIcon && <span>{startIcon}</span>}
      {children}
    </a>
  );
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { Box, Typography, Paper, Stack, Chip } from '@mui/material';
import { KPICard, EmptyState, Table, Alert } from '@trifusion/ui';
import { PlatformDashboardShell } from '../../components/platform-dashboard-shell';
import { PlatformLoadingSkeleton } from '../../components/platform-loading-skeleton';
import { usePlatformStaff } from '../../contexts/platform-staff-context';
import {
  LineChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Bar,
} from 'recharts';
import { Users as UsersIcon, Building, Monitor, Activity } from 'lucide-react';

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

interface AnalystStats {
  userGrowth: Array<{ name: string; users: number; tenants: number }>;
  apiTrends: Array<{ name: string; requests: number; errors: number }>;
  usageDistribution: Array<{ name: string; value: number }>;
  performanceTrends: Array<{ name: string; avgResponse: number; p95: number }>;
  resourceConsumption: Array<{ name: string; used: number; total: number | null }>;
  recentActivity: Array<{
    id: string;
    action: string;
    actorId: string;
    createdAt: string;
  }>;
  unavailableMetrics: string[];
}

export default function AnalystDashboardPage() {
  const { staff, refresh } = usePlatformStaff();

  const hasAccess = Boolean(staff && ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role));

  const statsQuery = useQuery<AnalystStats>({
    queryKey: ['analyst-dashboard-stats', staff?.id],
    queryFn: async () => {
      if (!staff) throw new Error('Platform staff access is required.');
      const [metrics, auditLogs] = await Promise.all([
        fetchJson('/platform/v1/metrics'),
        fetchJson('/platform/v1/audit-logs?limit=20'),
      ]);

      const userGrowth = (metrics.userGrowth ?? []).map((m: any) => ({
        name: m.name,
        users: m.users ?? 0,
        tenants: m.tenants ?? 0,
      }));
      const apiTrends = (metrics.apiTrends ?? []).map((m: any) => ({
        name: m.name,
        requests: m.requests ?? 0,
        errors: m.errors ?? 0,
      }));
      const usageDistribution = (metrics.usageDistribution ?? []).map((m: any) => ({
        name: m.name || 'Unknown',
        value: m.value ?? 0,
      }));
      const performanceTrends = (metrics.performanceTrends ?? []).map((m: any) => ({
        name: m.name,
        avgResponse: m.avgResponse ?? 0,
        p95: m.p95 ?? 0,
      }));
      const resourceConsumption = (metrics.resourceConsumption ?? []).map((m: any) => ({
        name: m.name || 'Unknown',
        used: m.used ?? 0,
        total: typeof m.total === 'number' ? m.total : null,
      }));

      return {
        userGrowth,
        apiTrends,
        usageDistribution,
        performanceTrends,
        resourceConsumption,
        unavailableMetrics: metrics.unavailableMetrics ?? [],
        recentActivity: (auditLogs.logs ?? []).map((log: any) => ({
          id: log.id,
          action: log.action,
          actorId: log.actorId,
          createdAt: log.createdAt,
        })),
      };
    },
    enabled: hasAccess,
  });

  if (!staff || !['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) {
    return (
      <section
        className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8 text-center"
        role="alert"
      >
        <h1 className="text-xl font-semibold">Analyst access required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only ANALYST, SUPERADMIN, or PLATFORM_ADMIN can access platform analytics.
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

  if (loading) return <PlatformLoadingSkeleton title="Loading platform analytics and usage" />;
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof Error ? error.message : 'Unable to load analytics data.'}
      </Alert>
    );
  }

  const stats = statsQuery.data!;
  const totalUsers = stats.userGrowth.reduce((sum, m) => sum + m.users, 0);
  const totalTenants = stats.userGrowth.reduce((sum, m) => sum + m.tenants, 0);
  const totalApiRequests = stats.apiTrends.reduce((sum, m) => sum + m.requests, 0);
  const totalApiErrors = stats.apiTrends.reduce((sum, m) => sum + m.errors, 0);

  return (
    <PlatformDashboardShell
      role="ANALYST"
      navItems={[
        {
          id: 'overview',
          label: 'Analytics Overview',
          icon: 'LayoutDashboard',
          href: '/analyst',
        },
        {
          id: 'user-analytics',
          label: 'User Analytics',
          icon: 'Users',
          href: '/users',
        },
        {
          id: 'tenant-analytics',
          label: 'Tenant Analytics',
          icon: 'Building',
          href: '/workspaces',
        },
        {
          id: 'growth-analytics',
          label: 'Growth Analytics',
          icon: 'TrendingUp',
          href: '/analytics',
        },
        {
          id: 'api-analytics',
          label: 'API Analytics',
          icon: 'Monitor',
          href: '/metrics',
        },
        {
          id: 'performance-analytics',
          label: 'Performance Analytics',
          icon: 'Activity',
          href: '/health',
        },
        {
          id: 'resource-analytics',
          label: 'Resource Analytics',
          icon: 'HardDrive',
          href: '/metrics',
        },
        {
          id: 'usage-reports',
          label: 'Usage Reports',
          icon: 'FileText',
          href: '/analytics',
        },
        {
          id: 'audit-analytics',
          label: 'Audit Analytics',
          icon: 'Activity',
          href: '/audit',
        },
        {
          id: 'custom-reports',
          label: 'Custom Reports',
          icon: 'BarChart',
          href: '/analytics',
        },
        {
          id: 'export-center',
          label: 'Export Center',
          icon: 'Download',
          href: '/analytics',
        },
      ]}
      breadcrumbs={[
        { label: 'Platform Analytics', href: '/analyst' },
        { label: 'Overview' },
      ]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, mb: 4 }}>
        <KPICard
          title="Users (last 6 months)"
          value={totalUsers}
          trend={{ value: 'Live database data', positive: true }}
          icon={<UsersIcon style={{ fontSize: 20, color: '#003F5C' }} />}
        />
        <KPICard
          title="Workspaces (last 6 months)"
          value={totalTenants}
          trend={{ value: 'Live database data', positive: true }}
          icon={<Building style={{ fontSize: 20, color: '#58508D' }} />}
        />
        <KPICard
          title="API Requests"
          value={
            stats.unavailableMetrics.includes('apiRequests') ? 'Unavailable' : totalApiRequests
          }
          icon={<Monitor style={{ fontSize: 20, color: '#8A508F' }} />}
        />
        <KPICard
          title="API Errors"
          value={stats.unavailableMetrics.includes('apiErrors') ? 'Unavailable' : totalApiErrors}
          icon={<Activity style={{ fontSize: 20, color: '#FF6361' }} />}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              User & Tenant Growth
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#003F5C"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="tenants"
                    stroke="#8A508F"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Chip label="Users" color="primary" size="small" />
              <Chip label="Tenants" color="secondary" size="small" />
            </Box>
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Usage Distribution
            </Typography>
            {stats.usageDistribution.length > 0 &&
            stats.usageDistribution.some((d) => d.value > 0) ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.usageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#58508D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <EmptyState
                title="No usage data"
                description="Usage distribution data is not yet available."
              />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              API Request Trends
            </Typography>
            {stats.apiTrends.length > 0 ? (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.apiTrends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#003F5C" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="errors" fill="#FF6361" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <EmptyState
                title="API request data unavailable"
                description="Request telemetry is not persisted in the current database schema."
              />
            )}
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Chip label="Requests" color="primary" size="small" />
              <Chip label="Errors" color="error" size="small" />
            </Box>
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Performance Trends
            </Typography>
            {stats.performanceTrends.length > 0 ? (
              <Box sx={{ height: 260 }}>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={stats.performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="avgResponse"
                      stroke="#58508D"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="p95"
                      stroke="#BC5090"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <EmptyState
                title="Performance data unavailable"
                description="Latency telemetry is not persisted in the current database schema."
              />
            )}
            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
              <Chip label="Avg Response" color="secondary" size="small" />
              <Chip label="P95" color="secondary" size="small" />
            </Box>
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Resource Consumption
            </Typography>
            {stats.resourceConsumption.length > 0 &&
            stats.resourceConsumption.some((d) => d.used > 0) ? (
              <Box>
                {stats.resourceConsumption.map((r) => {
                  const hasCapacity = typeof r.total === 'number' && r.total > 0;
                  const pct = hasCapacity ? Math.min((r.used / r.total!) * 100, 100) : null;
                  return (
                    <Box key={r.name} className="py-2 border-b border-divider/50 last:border-0">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{r.name}</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {hasCapacity ? `${r.used} / ${r.total}` : `${r.used.toLocaleString()} recorded`}
                        </Typography>
                      </Box>
                      {pct !== null && (
                        <Box sx={{ height: 8, backgroundColor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', backgroundColor: 'primary.main', borderRadius: 4, width: `${pct}%` }} />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <EmptyState
                title="No resource data"
                description="Resource consumption data is not yet available."
              />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Platform Audit Events
            </Typography>
            {stats.recentActivity.length > 0 ? (
              <Table
                columns={[
                  { key: 'action', label: 'Action', width: '50%' },
                  { key: 'actorId', label: 'Actor', width: '30%' },
                  { key: 'createdAt', label: 'Date', width: '20%' },
                ]}
                data={stats.recentActivity.map((log) => ({
                  id: log.id,
                  action: log.action.replaceAll('_', ' '),
                  actorId: log.actorId?.slice(0, 8) ?? 'system',
                  createdAt: new Date(log.createdAt).toLocaleDateString(),
                }))}
                emptyMessage="No audit events found."
              />
            ) : (
              <EmptyState
                title="No audit events"
                description="Platform audit events will appear here."
              />
            )}
          </Stack>
        </Paper>
      </Box>
    </PlatformDashboardShell>
  );
}

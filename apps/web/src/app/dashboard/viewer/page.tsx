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
import { DashboardShell } from '../../../components/dashboard-shell';
import { useAuth } from '../../../contexts/auth-context';
import { useWorkspace } from '../../../contexts/workspace-context';
import { apiClient, ApiClientError } from '../../../lib/api-client';
import { CUSTOMER_ROLE_CONFIGS } from '@trifusion/contracts';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar } from 'recharts';
import { FolderKanban, CheckSquare, Users as UsersIcon } from 'lucide-react';

const config = CUSTOMER_ROLE_CONFIGS.VIEWER;

const viewerNavItems = config.nav.map((item) => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  href: item.href,
}));

interface ViewerStats {
  projectCount: number;
  taskCount: number;
  completedTasks: number;
  activeProjects: number;
  memberCount: number;
  taskStatusCounts: Array<{ status: string; count: number }>;
  projectStatusCounts: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { email: string } | null;
  }>;
}

export default function ViewerDashboardPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const statsQuery = useQuery<ViewerStats>({
    queryKey: ['viewer-dashboard-stats', user?.id, workspace?.id],
    queryFn: async () => {
      const [members, overview, activity] = await Promise.all([
        apiClient.workspaces.members(workspace!.id),
        apiClient.analytics.overview(workspace!.id),
        apiClient.activity.list(workspace!.id, { limit: 10 }),
      ]);
      const projectStatusCounts = overview.metrics.projectStatusCounts;
      const taskStatusCounts = overview.metrics.taskStatusCounts;
      const projectCount = projectStatusCounts.reduce((sum, item) => sum + item.count, 0);
      const taskCount = taskStatusCounts.reduce((sum, item) => sum + item.count, 0);
      const completedTasks = taskStatusCounts.find((item) => item.status === 'DONE')?.count ?? 0;
      const activeProjects = projectStatusCounts.find((item) => item.status === 'ACTIVE')?.count ?? 0;

      return {
        projectCount,
        taskCount,
        completedTasks,
        activeProjects,
        memberCount: members.length,
        taskStatusCounts,
        projectStatusCounts,
        recentActivity: activity.data,
      };
    },
    enabled: Boolean(workspace && Boolean(user?.id)),
  });

  const loading = statsQuery.isPending;
  const error = statsQuery.error;

  if (!workspace) {
    return <div className="flex min-h-[60vh] items-center justify-center">Select a workspace to continue.</div>;
  }
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="large" />
        <span className="ml-2">Loading workspace overview…</span>
      </div>
    );
  }
  if (error) {
    return <Alert severity="error">{error instanceof ApiClientError ? error.message : 'Unable to load dashboard data.'}</Alert>;
  }

  const stats = statsQuery.data!;

  return (
    <DashboardShell
      role="VIEWER"
      navItems={viewerNavItems}
      breadcrumbs={[
        { label: workspace.name, href: '/dashboard/viewer' },
        { label: 'Overview' },
      ]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        <KPICard title="Active Projects" value={stats.activeProjects} icon={<FolderKanban style={{ fontSize: 20, color: '#003F5C' }} />} />
        <KPICard title="Total Tasks" value={stats.taskCount} icon={<CheckSquare style={{ fontSize: 20, color: '#58508D' }} />} />
        <KPICard title="Completed Tasks" value={stats.completedTasks} trend={{ value: `${Math.round((stats.completedTasks / Math.max(stats.taskCount, 1)) * 100)}%`, positive: true }} icon={<CheckSquare style={{ fontSize: 20, color: '#10B981' }} />} />
        <KPICard title="Team Members" value={stats.memberCount} subtitle="Read-only access" icon={<UsersIcon style={{ fontSize: 20, color: '#64748B' }} />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Project Progress
            </Typography>
            {stats.projectStatusCounts.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.projectStatusCounts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#64748B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <EmptyState title="No projects" description="No projects found in this workspace." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Task Status Distribution
            </Typography>
            {stats.taskStatusCounts.length > 0 ? (
              <Box>
                {stats.taskStatusCounts.map((item) => (
                  <Box key={item.status} className="flex items-center justify-between py-1 border-b border-divider/50 last:border-0">
                    <Typography variant="body2">{item.status.replaceAll('_', ' ')}</Typography>
                    <Box sx={{ flex: 1, ml: 2, height: 8, backgroundColor: 'action.hover', borderRadius: 4, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', backgroundColor: 'primary.main', borderRadius: 4, width: `${Math.min((item.count / Math.max(stats.taskCount, 1)) * 100, 100)}%` }} />
                    </Box>
                    <Typography variant="body2" fontWeight="bold">{item.count}</Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No tasks" description="No tasks found in this workspace." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Team Activity
            </Typography>
            {stats.recentActivity.length > 0 ? (
              <Table
                columns={[
                  { key: 'action', label: 'Action', width: '40%' },
                  { key: 'entityType', label: 'Entity', width: '20%' },
                  { key: 'actor', label: 'Actor', width: '20%' },
                  { key: 'createdAt', label: 'Date', width: '20%' },
                ]}
                data={stats.recentActivity.slice(0, 10).map((event) => ({
                  id: event.id,
                  action: event.action.replaceAll('_', ' '),
                  entityType: event.entityType,
                  actor: event.actor?.email ?? 'System',
                  createdAt: new Date(event.createdAt).toLocaleDateString(),
                }))}
                emptyMessage="No recent activity."
              />
            ) : (
              <EmptyState title="No recent activity" description="Workspace activity will appear here." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, p: 3, backgroundColor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
          Viewer — Read-Only Access
        </Typography>
        <Typography variant="caption" color="text.secondary">
          You have read-only access to this workspace. Create, edit, delete, and assignment operations are not available.
        </Typography>
      </Box>
    </DashboardShell>
  );
}

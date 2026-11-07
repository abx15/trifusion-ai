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
import { apiClient, ApiClientError, type WorkspaceMember } from '../../../lib/api-client';
import { CUSTOMER_ROLE_CONFIGS } from '@trifusion/contracts';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FolderKanban, CheckSquare, Users as UsersIcon, Clock } from 'lucide-react';

const config = CUSTOMER_ROLE_CONFIGS.TEAM_ADMIN;

const teamAdminNavItems = config.nav.map((item) => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  href: item.href,
  disabled: !item.roles?.includes('TEAM_ADMIN'),
}));

interface TeamStats {
  projectCount: number;
  taskCount: number;
  memberCount: number;
  completedTasks: number;
  overdueTasks: number;
  taskStatusCounts: Array<{ status: string; count: number }>;
  projectStatusCounts: Array<{ status: string; count: number }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { email: string } | null;
  }>;
  members: WorkspaceMember[];
}

export default function TeamAdminDashboardPage() {
  const { user } = useAuth();
  const { workspace, canManage } = useWorkspace();

  const statsQuery = useQuery<TeamStats>({
    queryKey: ['team-admin-dashboard-stats', user?.id, workspace?.id],
    queryFn: async () => {
      const [membersResult, overview, activity] = await Promise.all([
        apiClient.workspaces.members(workspace!.id),
        apiClient.analytics.overview(workspace!.id),
        apiClient.activity.list(workspace!.id, { limit: 10 }),
      ]);
      const projectCount = overview.metrics.projectStatusCounts.reduce((sum, item) => sum + item.count, 0);
      const taskCount = overview.metrics.taskStatusCounts.reduce((sum, item) => sum + item.count, 0);
      const completedTasks = overview.metrics.taskStatusCounts.find((item) => item.status === 'DONE')?.count ?? 0;

      return {
        projectCount,
        taskCount,
        memberCount: membersResult.length,
        completedTasks,
        overdueTasks: overview.metrics.overdueTasks,
        taskStatusCounts: overview.metrics.taskStatusCounts,
        projectStatusCounts: overview.metrics.projectStatusCounts,
        recentActivity: activity.data,
        members: membersResult.filter((m) => m.role !== 'OWNER' && m.role !== 'TEAM_ADMIN'),
      };
    },
    enabled: Boolean(workspace && canManage),
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
        <span className="ml-2">Loading team dashboard…</span>
      </div>
    );
  }
  if (error) {
    return <Alert severity="error">{error instanceof ApiClientError ? error.message : 'Unable to load dashboard data.'}</Alert>;
  }

  const stats = statsQuery.data!;

  return (
    <DashboardShell
      role="TEAM_ADMIN"
      navItems={teamAdminNavItems}
      breadcrumbs={[
        { label: workspace.name, href: '/dashboard/team-admin' },
        { label: 'Overview' },
      ]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        <KPICard title="Team Members" value={stats.memberCount} icon={<UsersIcon style={{ fontSize: 20, color: '#003F5C' }} />} />
        <KPICard title="Active Projects" value={stats.projectCount} icon={<FolderKanban style={{ fontSize: 20, color: '#58508D' }} />} />
        <KPICard title="Assigned Tasks" value={stats.taskCount} trend={{ value: `${stats.completedTasks} completed`, positive: true }} icon={<CheckSquare style={{ fontSize: 20, color: '#8A508F' }} />} />
        <KPICard title="Overdue Tasks" value={stats.overdueTasks} trend={{ value: stats.overdueTasks > 0 ? 'requires attention' : 'all on track', positive: stats.overdueTasks === 0 }} icon={<Clock style={{ fontSize: 20, color: '#FF6361' }} />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Team Task Status
            </Typography>
            {stats.taskStatusCounts.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={stats.taskStatusCounts} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                      {stats.taskStatusCounts.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <EmptyState title="No tasks" description="Tasks will appear once they are created." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Team Activity
            </Typography>
            {stats.recentActivity.length > 0 ? (
              <Box sx={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {stats.recentActivity.slice(0, 8).map((event) => (
                  <Box key={event.id} className="flex items-center justify-between p-2 rounded-md border border-divider/50">
                    <Box className="flex items-center gap-2">
                      <Typography variant="body2">{event.action.replaceAll('_', ' ')}</Typography>
                      <Typography variant="caption" color="text.secondary">{event.entityType}</Typography>
                    </Box>
                    <Box className="flex items-center gap-2">
                      <Typography variant="caption" color="text.secondary">{event.actor?.email ?? 'System'}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(event.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No recent activity" description="Team activity will appear here." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Team Members (manageable: MEMBER & VIEWER)
            </Typography>
            {stats.members.length > 0 ? (
              <Table
                columns={[
                  { key: 'name', label: 'Name', width: '35%' },
                  { key: 'email', label: 'Email', width: '35%' },
                  { key: 'role', label: 'Role', width: '30%' },
                ]}
                data={stats.members.map((m) => ({
                  id: m.userId,
                  name: m.name || m.email,
                  email: m.email,
                  role: m.role.replaceAll('_', ' '),
                }))}
                emptyMessage="No manageable team members."
              />
            ) : (
              <EmptyState title="No manageable members" description="You can manage MEMBER and VIEWER roles only." />
            )}
          </Stack>
        </Paper>
      </Box>
    </DashboardShell>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    TODO: '#94A3B8',
    IN_PROGRESS: '#3B82F6',
    REVIEW: '#8A508F',
    DONE: '#10B981',
    ARCHIVED: '#64748B',
  };
  return colors[status] || '#94A3B8';
}

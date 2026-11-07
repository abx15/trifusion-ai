'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  Chip,
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
import { CheckSquare, Activity, Clock } from 'lucide-react';

const config = CUSTOMER_ROLE_CONFIGS.MEMBER;

const memberNavItems = config.nav.map((item) => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  href: item.href,
}));

interface MemberStats {
  assignedTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
  assignedProjects: number;
  taskStatusCounts: Array<{ status: string; count: number }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string } | null;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string | Date;
    actor?: { email: string } | null;
  }>;
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const statsQuery = useQuery<MemberStats>({
    queryKey: ['member-dashboard-stats', user?.id, workspace?.id],
    queryFn: async () => {
      const [overview, tasks, activity] = await Promise.all([
        apiClient.analytics.overview(workspace!.id, { assigneeId: user?.id }),
        apiClient.tasks.list(workspace!.id, { limit: 50, assigneeId: user?.id }),
        apiClient.activity.list(workspace!.id, { limit: 10 }),
      ]);
      const taskStatusCounts = overview.metrics.taskStatusCounts;
      const recentTasks = tasks.data.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate instanceof Date
          ? task.dueDate.toISOString()
          : task.dueDate ?? null,
        project: task.project
          ? { id: task.project.id, name: task.project.name }
          : null,
      }));
      const pendingTasks = taskStatusCounts
        .filter((item) => ['TODO', 'IN_PROGRESS', 'REVIEW'].includes(item.status))
        .reduce((sum, item) => sum + item.count, 0);
      const completedTasks = taskStatusCounts.find((item) => item.status === 'DONE')?.count ?? 0;
      const assignedProjects = overview.metrics.projectStatusCounts.reduce((sum, item) => sum + item.count, 0);

      return {
        assignedTasks: taskStatusCounts.reduce((sum, item) => sum + item.count, 0),
        pendingTasks,
        completedTasks,
        overdueTasks: overview.metrics.overdueTasks,
        upcomingDeadlines: overview.metrics.upcomingDeadlines,
        assignedProjects,
        taskStatusCounts,
        recentTasks,
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
        <span className="ml-2">Loading your dashboard…</span>
      </div>
    );
  }
  if (error) {
    return <Alert severity="error">{error instanceof ApiClientError ? error.message : 'Unable to load dashboard data.'}</Alert>;
  }

  const stats = statsQuery.data!;

  return (
    <DashboardShell
      role="MEMBER"
      navItems={memberNavItems}
      breadcrumbs={[
        { label: workspace.name, href: '/dashboard/member' },
        { label: 'My Dashboard' },
      ]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, mb: 4 }}>
        <KPICard title="My Assigned Tasks" value={stats.assignedTasks} trend={{ value: `${stats.pendingTasks} pending`, positive: stats.pendingTasks === 0 }} icon={<CheckSquare style={{ fontSize: 20, color: '#003F5C' }} />} />
        <KPICard title="Completed" value={stats.completedTasks} trend={{ value: `${Math.round((stats.completedTasks / Math.max(stats.assignedTasks, 1)) * 100)}% completion`, positive: true }} icon={<CheckSquare style={{ fontSize: 20, color: '#10B981' }} />} />
        <KPICard title="Overdue" value={stats.overdueTasks} trend={{ value: stats.overdueTasks > 0 ? 'requires attention' : 'all on track', positive: stats.overdueTasks === 0 }} icon={<Clock style={{ fontSize: 20, color: '#FF6361' }} />} />
        <KPICard title="Upcoming Deadlines" value={stats.upcomingDeadlines} icon={<Activity style={{ fontSize: 20, color: '#FFA600' }} />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              My Tasks
            </Typography>
            {stats.recentTasks.length > 0 ? (
              <Table
                columns={[
                  { key: 'title', label: 'Task', width: '35%' },
                  { key: 'status', label: 'Status', width: '20%' },
                  { key: 'priority', label: 'Priority', width: '15%' },
                  { key: 'dueDate', label: 'Due Date', width: '20%' },
                  { key: 'project', label: 'Project', width: '10%' },
                ]}
                data={stats.recentTasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  status: t.status.replaceAll('_', ' '),
                  priority: t.priority,
                  dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—',
                  project: t.project?.name || '—',
                }))}
                emptyMessage="No tasks assigned to you."
              />
            ) : (
              <EmptyState title="No assigned tasks" description="You have no tasks assigned yet." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Task Status Distribution
            </Typography>
            {stats.taskStatusCounts.length > 0 ? (
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.taskStatusCounts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8A508F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <EmptyState title="No task data" description="Your task distribution will appear here." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' }, gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Activity
            </Typography>
            {stats.recentActivity.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {stats.recentActivity.slice(0, 6).map((event) => (
                  <Box key={event.id} className="flex items-center justify-between p-2 rounded-md border border-divider/50">
                    <Box className="flex items-center gap-2">
                      <Typography variant="body2">{event.action.replaceAll('_', ' ')}</Typography>
                      <Typography variant="caption" color="text.secondary">{event.entityType}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No recent activity" description="Your activity will appear here." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Personal Productivity
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip label={`${stats.completedTasks} Completed`} color="success" size="small" />
              <Chip label={`${stats.pendingTasks} Pending`} color="warning" size="small" />
              <Chip label={`${stats.overdueTasks} Overdue`} color="error" size="small" />
              <Chip label={`${stats.assignedProjects} Projects`} color="primary" size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Complete your assigned tasks and update their status to track your productivity.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </DashboardShell>
  );
}

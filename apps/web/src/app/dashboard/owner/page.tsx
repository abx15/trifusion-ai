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
import { apiClient, ApiClientError, type WorkspaceMember } from '../../../lib/api-client';
import { CUSTOMER_ROLE_CONFIGS } from '@trifusion/contracts';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FolderKanban, CheckSquare, Users as UsersIcon, Activity } from 'lucide-react';

const config = CUSTOMER_ROLE_CONFIGS.OWNER;

const ownerNavItems = config.nav.map((item) => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  href: item.href,
  disabled: !item.roles?.includes('OWNER'),
}));

interface WorkspaceStats {
  projectCount: number;
  taskCount: number;
  memberCount: number;
  pendingInvitations: number;
  overdueTasks: number;
  upcomingDeadlines: number;
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

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const { workspace, canManage } = useWorkspace();

  const statsQuery = useQuery<WorkspaceStats>({
    queryKey: ['owner-dashboard-stats', user?.id, workspace?.id],
    queryFn: async () => {
      const [membersResult, invitationsResult] = await Promise.all([
        apiClient.workspaces.members(workspace!.id),
        apiClient.workspaces.invitations(workspace!.id),
      ]);
      const overview = await apiClient.graphql<{
        workspaceOverview: {
          projectCount: number;
          taskCount: number;
          overdueTasks: number;
          upcomingDeadlines: number;
          projectStatusCounts: Array<{ status: string; count: number }>;
          taskStatusCounts: Array<{ status: string; count: number }>;
        };
        tasks: { data: Array<{ id: string; title: string; status: string; dueDate: string | null }> };
        recentActivity: { data: Array<{ id: string; action: string; entityType: string; createdAt: string; actor: { email: string } | null }> };
      }>('workspaceOverview', {
        workspaceId: workspace!.id,
        filters: {},
      });

      return {
        projectCount: overview.workspaceOverview.projectCount,
        taskCount: overview.workspaceOverview.taskCount,
        memberCount: membersResult.length,
        pendingInvitations: invitationsResult.filter((i) => i.status === 'PENDING').length,
        overdueTasks: overview.workspaceOverview.overdueTasks,
        upcomingDeadlines: overview.workspaceOverview.upcomingDeadlines,
        taskStatusCounts: overview.workspaceOverview.taskStatusCounts,
        projectStatusCounts: overview.workspaceOverview.projectStatusCounts,
        recentActivity: overview.recentActivity.data,
        members: membersResult,
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
        <span className="ml-2">Loading workspace overview…</span>
      </div>
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof ApiClientError ? error.message : 'Unable to load dashboard data.'}
      </Alert>
    );
  }

  const stats = statsQuery.data!;

  return (
    <DashboardShell
      role="OWNER"
      navItems={ownerNavItems}
      breadcrumbs={[
        { label: workspace.name, href: '/dashboard/owner' },
        { label: 'Overview' },
      ]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        <KPICard title="Total Projects" value={stats.projectCount} icon={<FolderKanban style={{ fontSize: 20, color: '#003F5C' }} />} />
        <KPICard title="Total Tasks" value={stats.taskCount} icon={<CheckSquare style={{ fontSize: 20, color: '#58508D' }} />} />
        <KPICard title="Team Members" value={stats.memberCount}  icon={<UsersIcon style={{ fontSize: 20, color: '#8A508F' }} />} />
        <KPICard title="Overdue Tasks" value={stats.overdueTasks} trend={{ value: stats.overdueTasks > 0 ? 'requires attention' : 'all on track', positive: stats.overdueTasks === 0 }} icon={<Activity style={{ fontSize: 20, color: '#FF6361' }} />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Task Status Distribution
            </Typography>
            {stats.taskStatusCounts.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.taskStatusCounts}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#8884d8"
                      label
                    >
                      {stats.taskStatusCounts.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={getStatusColor(entry.status)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <EmptyState title="No tasks" description="Tasks will appear here once they are created." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Activity
            </Typography>
            {stats.recentActivity.length > 0 ? (
              <Box sx={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {stats.recentActivity.slice(0, 8).map((event) => (
                  <Box key={event.id} className="flex items-center justify-between p-2 rounded-md border border-divider/50">
                    <Box className="flex items-center gap-2">
                      <span className="text-sm">{event.action.replaceAll('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">{event.entityType}</span>
                    </Box>
                    <Box className="flex items-center gap-2">
                      <Typography variant="caption" color="text.secondary">
                        {event.actor?.email ?? 'System'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(event.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No recent activity" description="Workspace activity will appear here." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Project Status
            </Typography>
            {stats.projectStatusCounts.length > 0 ? (
              <Box>
                {stats.projectStatusCounts.map((item) => (
                  <Box key={item.status} className="flex items-center justify-between py-1">
                    <Box className="flex items-center gap-2">
                      <Typography variant="body2">{item.status.replaceAll('_', ' ')}</Typography>
                      <Chip label={item.count} size="small" />
                    </Box>
                    <Box sx={{ flex: 1, ml: 2, height: 6, backgroundColor: 'action.hover', borderRadius: 3, display: 'flex' }}>
                      <Box sx={{ height: '100%', backgroundColor: 'primary.main', borderRadius: 3, width: `${Math.min((item.count / Math.max(stats.projectCount, 1)) * 100, 100)}%` }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <EmptyState title="No projects" description="Projects will appear here once created." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Active Team Members
            </Typography>
            {stats.members.length > 0 ? (
              <Table
                columns={[
                  { key: 'name', label: 'Name', width: '40%' },
                  { key: 'email', label: 'Email', width: '40%' },
                  { key: 'role', label: 'Role', width: '20%' },
                ]}
                data={stats.members.map((m) => ({
                  id: m.userId,
                  name: m.name || m.email,
                  email: m.email,
                  role: m.role.replaceAll('_', ' '),
                }))}
                emptyMessage="No team members yet."
              />
            ) : (
              <EmptyState title="No team members" description="Invite members to your workspace." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Quick Actions</Typography>
          {canManage && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <LinkCmp href="/dashboard/projects/new" variant="outlined" startIcon={<FolderKanban style={{ fontSize: 18 }} />}>
                New Project
              </LinkCmp>
              <LinkCmp href="/dashboard/clients/new" variant="contained" startIcon={<div>📋</div>}>
                New Client
              </LinkCmp>
              <LinkCmp href="/dashboard/tasks/new" variant="contained" startIcon={<CheckSquare style={{ fontSize: 18 }} />}>
                New Task
              </LinkCmp>
            </Box>
          )}
        </Stack>
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

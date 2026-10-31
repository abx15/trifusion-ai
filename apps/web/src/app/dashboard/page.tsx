'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Button, Badge, EmptyState, KPICard, Table } from '@trifusion/ui';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../contexts/auth-context';
import { useWorkspace } from '../../contexts/workspace-context';
import { CUSTOMER_ROLE_CONFIGS, type CustomerRole } from '@trifusion/contracts';

interface OverviewData {
  workspaceOverview: {
    workspaceId: string;
    workspaceName: string;
    role: string;
    projectCount: number;
    taskCount: number;
    projectStatusCounts: Array<{ status: string; count: number }>;
    taskStatusCounts: Array<{ status: string; count: number }>;
    overdueTasks: number;
    upcomingDeadlines: number;
  };
  tasks: {
    data: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      dueDate: string | null;
      project: { id: string; name: string } | null;
      assignee: { id: string; firstName: string | null; lastName: string | null } | null;
    }>;
  };
  recentActivity: {
    data: Array<{
      id: string;
      action: string;
      entityType: string;
      createdAt: string;
      actor: { email: string } | null;
    }>;
  };
}

const overviewQuery = `
  query WorkspaceDashboard($workspaceId: String!) {
    workspaceOverview(workspaceId: $workspaceId, filters: {}) {
      workspaceId workspaceName role projectCount taskCount overdueTasks upcomingDeadlines
      projectStatusCounts { status count }
      taskStatusCounts { status count }
    }
    tasks(workspaceId: $workspaceId, limit: 8) {
      data { id title status priority dueDate project { id name } assignee { id firstName lastName } }
    }
    recentActivity(workspaceId: $workspaceId, limit: 6) {
      data { id action entityType createdAt actor { email } }
    }
  }
`;

export default function DashboardPage() {
  const { user } = useAuth();
  const { workspace, role } = useWorkspace();
  const customerRole = role as CustomerRole;
  const config = CUSTOMER_ROLE_CONFIGS[customerRole ?? 'VIEWER'];

  const query = useQuery({
    queryKey: ['workspace-dashboard', user?.id, workspace?.id],
    queryFn: () =>
      apiClient.graphql<OverviewData>(overviewQuery, {
        workspaceId: workspace!.id,
        filters: {},
      }),
    enabled: Boolean(workspace),
  });

  if (!workspace) {
    return (
      <Card role={!query.isPending ? 'alert' : undefined} style={{ padding: 20, textAlign: 'center' }}>
        <CardContent>
          <h3>{!query.isPending ? 'Select a workspace' : 'Loading workspace...'}</h3>
          {query.isPending && <Spinner />}
          {!query.isPending && (
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (query.isPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: '100%', height: 28, background: '#f1f5f9', borderRadius: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 120, background: '#f1f5f9', borderRadius: 8 }} />
          ))}
        </div>
        <div style={{ height: 200, background: '#f1f5f9', borderRadius: 8 }} />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Card role="alert" style={{ padding: 20, textAlign: 'center' }}>
        <CardContent>
          <h3 style={{ color: '#ef4444' }}>Unable to load workspace data</h3>
          <p style={{ color: '#64748b' }}>{query.error.message}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { workspaceOverview: overview, tasks, recentActivity } = query.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: 4 }}>
            Good to see you, {user?.firstName || 'there'}
          </h1>
          <p style={{ color: '#64748b' }}>
            A live view of your {config.design} workspace activity.
          </p>
        </div>
        <Badge variant="default">{overview.role}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {config.widgets.includes('workspaceOverview') && (
          <KPICard title="Projects" value={overview.projectCount} />
        )}
        {config.widgets.includes('projectStats') && (
          <KPICard title="Tasks" value={overview.taskCount} />
        )}
        {config.widgets.includes('taskStats') && (
          <KPICard title="Overdue Tasks" value={overview.overdueTasks} />
        )}
        {config.widgets.includes('quickActions') && (
          <KPICard title="Upcoming Deadlines" value={overview.upcomingDeadlines} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {config.widgets.includes('projectStats') && (
          <Card variant="elevated" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Project Status</h3>
              {overview.projectStatusCounts.length > 0 ? (
                <Table
                  columns={[
                    { key: 'status', label: 'Status', width: '60%' },
                    { key: 'count', label: 'Count', width: '40%' },
                  ]}
                  data={overview.projectStatusCounts.map((c) => ({
                    status: c.status.replaceAll('_', ' '),
                    count: c.count,
                  }))}
                />
              ) : (
                <EmptyState title="No projects" description="No projects found in this workspace." />
              )}
            </CardContent>
          </Card>
        )}
        {config.widgets.includes('taskStats') && (
          <Card variant="elevated" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Task Status</h3>
              {overview.taskStatusCounts.length > 0 ? (
                <Table
                  columns={[
                    { key: 'status', label: 'Status', width: '60%' },
                    { key: 'count', label: 'Count', width: '40%' },
                  ]}
                  data={overview.taskStatusCounts.map((c) => ({
                    status: c.status.replaceAll('_', ' '),
                    count: c.count,
                  }))}
                />
              ) : (
                <EmptyState title="No tasks" description="No tasks found in this workspace." />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {config.widgets.includes('recentActivity') && (
          <Card variant="elevated" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Recent Activity</h3>
              {recentActivity.data.length > 0 ? (
                <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentActivity.data.map((event) => (
                    <div key={event.id} style={{ padding: 8, borderBottom: '1px solid #e2e8f0' }}>
                      <p style={{ fontWeight: 500, marginBottom: 2 }}>
                        {event.action.replaceAll('_', ' ')} · {event.entityType.replaceAll('_', ' ')}
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {event.actor?.email ?? 'Workspace system'} ·{' '}
                        {new Date(event.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No activity" description="Activity will appear here when workspace changes are recorded." />
              )}
            </CardContent>
          </Card>
        )}
        {config.widgets.includes('teamMembers') && (
          <Card variant="elevated" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 12 }}>Team Members</h3>
              <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tasks.data.slice(0, 6).map((task) => (
                  <div key={task.id} style={{ padding: 8, borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: 2 }}>{task.title}</p>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {task.assignee
                          ? `${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`.trim() || 'Assigned'
                          : 'Unassigned'}
                      </p>
                    </div>
                    <Badge variant="default">{task.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      border: '3px solid #e2e8f0',
      borderTopColor: '#003F5C',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
  );
}

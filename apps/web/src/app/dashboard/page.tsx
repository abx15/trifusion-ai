'use client';

import Link from 'next/link';
import { AlertCircle, ArrowUpRight, CalendarClock, FolderKanban, ListChecks, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Card, CardContent, EmptyState, KPICard } from '@trifusion/ui';
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
  tasks: { data: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    project: { id: string; name: string } | null;
    assignee: { id: string; firstName: string | null; lastName: string | null } | null;
  }> };
  recentActivity: { data: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { email: string } | null;
  }> };
}

const overviewQuery = `
  query WorkspaceDashboard($workspaceId: String!) {
    workspaceOverview(workspaceId: $workspaceId, filters: {}) {
      workspaceId workspaceName role projectCount taskCount overdueTasks upcomingDeadlines
      projectStatusCounts { status count } taskStatusCounts { status count }
    }
    tasks(workspaceId: $workspaceId, limit: 8) {
      data { id title status priority dueDate project { id name } assignee { id firstName lastName } }
    }
    recentActivity(workspaceId: $workspaceId, limit: 6) {
      data { id action entityType createdAt actor { email } }
    }
  }
`;

const titleCase = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function DashboardPage() {
  const { user } = useAuth();
  const { workspace, role } = useWorkspace();
  const customerRole = role as CustomerRole;
  const config = CUSTOMER_ROLE_CONFIGS[customerRole ?? 'VIEWER'];
  const query = useQuery({
    queryKey: ['workspace-dashboard', user?.id, workspace?.id],
    queryFn: () => apiClient.graphql<OverviewData>(overviewQuery, { workspaceId: workspace!.id, filters: {} }),
    enabled: Boolean(workspace),
  });

  if (!workspace || query.isPending) {
    return <DashboardLoading message={!workspace ? 'Loading your workspace…' : undefined} />;
  }
  if (query.isError) {
    return <Card role="alert" className="p-8 text-center"><CardContent><h3 className="text-lg font-semibold text-destructive">Unable to load workspace data</h3><p className="mt-2 text-sm text-muted-foreground">{query.error.message}</p><Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Try again</Button></CardContent></Card>;
  }

  const { workspaceOverview: overview, tasks, recentActivity } = query.data;
  const theme = `dashboard-theme dashboard-${config.design} dashboard-layout-${config.layout}`;
  const taskColumns = ['TODO', 'IN_PROGRESS', 'DONE'];

  return (
    <div className={theme}>
      <header className="dashboard-hero">
        <div>
          <div className="dashboard-eyebrow"><Sparkles className="h-3.5 w-3.5" /> {titleCase(config.design)} workspace</div>
          <h1>Good to see you, {user?.firstName || 'there'}</h1>
          <p>Everything important in <strong>{workspace.name}</strong>, arranged for your {titleCase(customerRole)} workflow.</p>
        </div>
        <Badge variant="default" className="dashboard-role-badge">{overview.role}</Badge>
      </header>

      <section className="dashboard-kpis" aria-label="Workspace summary">
        <KPICard title="Projects" value={overview.projectCount} />
        <KPICard title="Open tasks" value={overview.taskCount} />
        <KPICard title="Overdue" value={overview.overdueTasks} />
        <KPICard title="Upcoming" value={overview.upcomingDeadlines} />
      </section>

      {customerRole === 'MEMBER' ? (
        <section className="dashboard-kanban" aria-label="My task board">
          {taskColumns.map((status) => (
            <div className="kanban-column" key={status}>
              <div className="kanban-column-title"><span>{titleCase(status)}</span><span>{tasks.data.filter((task) => task.status === status).length}</span></div>
              {tasks.data.filter((task) => task.status === status).map((task) => <TaskCard key={task.id} task={task} />)}
              {!tasks.data.some((task) => task.status === status) && <p className="kanban-empty">No tasks here</p>}
            </div>
          ))}
        </section>
      ) : (
        <section className="dashboard-content-grid">
          <Card className="dashboard-panel dashboard-chart-panel">
            <CardContent>
              <PanelHeading icon={<FolderKanban />} title={customerRole === 'VIEWER' ? 'Project progress' : 'Project pulse'} href="/dashboard/projects" />
              <div className="status-list">
                {overview.projectStatusCounts.length ? overview.projectStatusCounts.map((item) => <StatusBar key={item.status} label={titleCase(item.status)} count={item.count} total={Math.max(overview.projectCount, 1)} />) : <EmptyState title="No projects yet" description="Projects will appear here when your workspace starts moving." />}
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-panel dashboard-chart-panel">
            <CardContent>
              <PanelHeading icon={<ListChecks />} title="Task status" href="/dashboard/tasks" />
              <div className="status-list">
                {overview.taskStatusCounts.length ? overview.taskStatusCounts.map((item) => <StatusBar key={item.status} label={titleCase(item.status)} count={item.count} total={Math.max(overview.taskCount, 1)} />) : <EmptyState title="No tasks yet" description="Your next action will show up here." />}
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-panel dashboard-activity-panel">
            <CardContent>
              <PanelHeading icon={<CalendarClock />} title="Recent activity" href="/dashboard/activity" />
              {recentActivity.data.length ? <div className="activity-feed">{recentActivity.data.map((event) => <div className="activity-item" key={event.id}><span className="activity-dot" /><div><p>{titleCase(event.action)} <span>· {titleCase(event.entityType)}</span></p><small>{event.actor?.email ?? 'Workspace system'} · {new Date(event.createdAt).toLocaleDateString()}</small></div></div>)}</div> : <EmptyState title="No activity" description="Workspace activity will appear here." />}
            </CardContent>
          </Card>
          <Card className="dashboard-panel dashboard-next-panel">
            <CardContent>
              <PanelHeading icon={<AlertCircle />} title="Next up" href="/dashboard/tasks" />
              {tasks.data.slice(0, 4).map((task) => <TaskCard key={task.id} task={task} compact />)}
              {!tasks.data.length && <EmptyState title="You're all caught up" description="There are no tasks waiting for attention." />}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

function PanelHeading({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
  return <div className="panel-heading"><div><span className="panel-icon">{icon}</span><h2>{title}</h2></div><Link href={href} aria-label={`View ${title}`}><ArrowUpRight className="h-4 w-4" /></Link></div>;
}

function StatusBar({ label, count, total }: { label: string; count: number; total: number }) {
  return <div className="status-row"><div><span>{label}</span><strong>{count}</strong></div><div className="status-track"><span style={{ width: `${Math.min((count / total) * 100, 100)}%` }} /></div></div>;
}

function TaskCard({ task, compact = false }: { task: OverviewData['tasks']['data'][number]; compact?: boolean }) {
  return <div className={`task-card${compact ? ' task-card-compact' : ''}`}><div><strong>{task.title}</strong>{!compact && <small>{task.project?.name ?? 'No project'} · {titleCase(task.priority)}</small>}</div><Badge variant={task.status === 'DONE' ? 'secondary' : 'default'}>{titleCase(task.status)}</Badge></div>;
}

function DashboardLoading({ message }: { message?: string }) {
  return <div className="dashboard-loading" role="status"><div className="dashboard-spinner" /><span>{message ?? 'Preparing your dashboard…'}</span></div>;
}

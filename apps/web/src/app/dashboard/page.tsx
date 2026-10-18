'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, CalendarClock, CheckCircle2, FolderKanban } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@trifusion/ui';
import { apiClient, ApiClientError } from '../../lib/api-client';
import type { ProjectStatus, TaskStatus } from '@trifusion/contracts';
import { useAuth } from '../../contexts/auth-context';
import { useWorkspace } from '../../contexts/workspace-context';
import { useState } from 'react';

const DashboardCharts = dynamic(() => import('./dashboard-charts'), {
  loading: () => <div className="h-64 animate-pulse rounded-md bg-muted" aria-label="Loading charts" />,
});

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
  query WorkspaceDashboard(
    $workspaceId: String!
    $filters: WorkspaceOverviewFilterInput
    $projectId: String
    $projectStatus: ProjectStatus
    $taskStatus: TaskStatus
    $assigneeId: String
  ) {
    workspaceOverview(workspaceId: $workspaceId, filters: $filters) {
      workspaceId workspaceName role projectCount taskCount overdueTasks upcomingDeadlines
      projectStatusCounts { status count }
      taskStatusCounts { status count }
    }
    tasks(
      workspaceId: $workspaceId
      limit: 8
      projectId: $projectId
      projectStatus: $projectStatus
      status: $taskStatus
      assigneeId: $assigneeId
    ) {
      data {
        id title status priority dueDate
        project { id name }
        assignee { id firstName lastName }
      }
    }
    recentActivity(workspaceId: $workspaceId, limit: 6) {
      data { id action entityType createdAt actor { email } }
    }
  }
`;

function dateLabel(date: string | null): string {
  if (!date) return 'No due date';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date));
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { workspace, selectionError } = useWorkspace();
  const [projectId, setProjectId] = useState('');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus | ''>('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus | ''>('');
  const [assigneeId, setAssigneeId] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');
  const dateRangeInvalid = Boolean(createdAfter && createdBefore && createdAfter > createdBefore);
  const filters = {
    ...(projectId ? { projectId } : {}),
    ...(projectStatus ? { projectStatus } : {}),
    ...(taskStatus ? { taskStatus } : {}),
    ...(assigneeId ? { assigneeId } : {}),
    ...(!dateRangeInvalid && createdAfter ? { createdAfter: new Date(`${createdAfter}T00:00:00.000Z`).toISOString() } : {}),
    ...(!dateRangeInvalid && createdBefore ? { createdBefore: new Date(`${createdBefore}T23:59:59.999Z`).toISOString() } : {}),
  };
  const filterChoices = useQuery({
    queryKey: ['dashboard-filter-choices', user?.id, workspace?.id],
    queryFn: async () => {
      const [projects, members] = await Promise.all([
        apiClient.projects.list(workspace!.id, { limit: 50, sortBy: 'name' }),
        apiClient.workspaces.members(workspace!.id),
      ]);
      return { projects: projects.data, members };
    },
    enabled: Boolean(workspace),
  });
  const query = useQuery({
    queryKey: ['workspace-dashboard', user?.id, workspace?.id, filters],
    queryFn: () => apiClient.graphql<OverviewData>(overviewQuery, {
      workspaceId: workspace!.id,
      filters,
      projectId: projectId || null,
      projectStatus: projectStatus || null,
      taskStatus: taskStatus || null,
      assigneeId: assigneeId || null,
    }),
    enabled: Boolean(workspace),
  });

  if (!workspace) {
    return (
      <Card role={selectionError ? 'alert' : undefined}>
        <CardHeader>
          <CardTitle>{selectionError ? 'Workspace access unavailable' : 'Select a workspace'}</CardTitle>
          <CardDescription>
            {selectionError ?? 'Choose a workspace you belong to to load its dashboard.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (query.isPending) {
    return (
      <section aria-busy="true" aria-label="Loading workspace overview" className="space-y-5">
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-lg bg-muted" />)}
        </div>
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
      </section>
    );
  }

  if (query.isError) {
    const message = query.error instanceof ApiClientError
      ? query.error.message
      : 'The dashboard could not be loaded.';
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Unable to load workspace data</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void query.refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  const { workspaceOverview: overview, tasks, recentActivity } = query.data;
  const taskChart = overview.taskStatusCounts;
  const projectChart = overview.projectStatusCounts;
  const upcomingTasks = tasks.data
    .filter((task) => task.dueDate && task.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">{workspace.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Good to see you, {user?.firstName || 'there'}
          </h1>
          <p className="mt-2 text-muted-foreground">A live view of your workspace activity.</p>
        </div>
        <Badge variant="outline" className="w-fit">{overview.role}</Badge>
      </section>

      <details className="rounded-lg border bg-card p-4">
        <summary className="cursor-pointer font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Filter dashboard data
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <FilterSelect label="Project" value={projectId} onChange={setProjectId}>
            <option value="">All projects</option>
            {(filterChoices.data?.projects ?? []).map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Project status" value={projectStatus} onChange={(value) => setProjectStatus(value as ProjectStatus | '')}>
            <option value="">All project statuses</option>
            {['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
          </FilterSelect>
          <FilterSelect label="Task status" value={taskStatus} onChange={(value) => setTaskStatus(value as TaskStatus | '')}>
            <option value="">All task statuses</option>
            {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
          </FilterSelect>
          <FilterSelect label="Team member" value={assigneeId} onChange={setAssigneeId}>
            <option value="">All team members</option>
            {(filterChoices.data?.members ?? []).map((member) => (
              <option key={member.userId} value={member.userId}>{member.name || member.email}</option>
            ))}
          </FilterSelect>
          <label className="space-y-1 text-sm">
            <span className="block font-medium">Created after</span>
            <input type="date" value={createdAfter} onChange={(event) => setCreatedAfter(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="block font-medium">Created before</span>
            <input type="date" value={createdBefore} onChange={(event) => setCreatedBefore(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3" />
          </label>
          <Button
            variant="outline"
            className="sm:col-span-2 xl:col-span-3 xl:justify-self-start"
            onClick={() => {
              setProjectId('');
              setProjectStatus('');
              setTaskStatus('');
              setAssigneeId('');
              setCreatedAfter('');
              setCreatedBefore('');
            }}
          >
            Clear filters
          </Button>
        </div>
        {dateRangeInvalid && <p role="alert" className="mt-3 text-sm text-destructive">The start date must not be later than the end date.</p>}
        {filterChoices.isError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            Filter options could not be loaded. {filterChoices.error instanceof Error ? filterChoices.error.message : ''}
          </p>
        )}
        {filterChoices.isPending && <p className="mt-3 text-xs text-muted-foreground" role="status">Loading filter options…</p>}
      </details>

      <section aria-label="Workspace summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Projects" value={overview.projectCount} icon={<FolderKanban aria-hidden="true" className="h-5 w-5" />} />
        <SummaryCard title="Tasks" value={overview.taskCount} icon={<CheckCircle2 aria-hidden="true" className="h-5 w-5" />} />
        <SummaryCard title="Overdue tasks" value={overview.overdueTasks} icon={<AlertCircle aria-hidden="true" className="h-5 w-5" />} />
        <SummaryCard title="Upcoming deadlines" value={overview.upcomingDeadlines} icon={<CalendarClock aria-hidden="true" className="h-5 w-5" />} />
      </section>

      <section className="grid gap-5 xl:grid-cols-2" aria-label="Status breakdown">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project status</CardTitle>
            <CardDescription>Projects in this workspace by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCharts data={projectChart} label="Projects" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Task status</CardTitle>
            <CardDescription>Tasks in this workspace by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCharts data={taskChart} label="Tasks" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Upcoming work</CardTitle>
              <CardDescription>Open tasks with the nearest due dates.</CardDescription>
            </div>
            <Link href="/dashboard/tasks" className="text-sm font-medium text-primary hover:underline">
              All tasks <ArrowRight aria-hidden="true" className="ml-1 inline h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                No upcoming dated tasks were returned for this workspace.
              </p>
            ) : (
              <ul className="divide-y">
                {upcomingTasks.map((task) => (
                  <li key={task.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{task.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {task.project?.name ?? 'No project'} · {task.assignee
                          ? `${task.assignee.firstName ?? ''} ${task.assignee.lastName ?? ''}`.trim() || 'Assigned'
                          : 'Unassigned'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{dateLabel(task.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Latest recorded events in this workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.data.length === 0 ? (
              <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Activity will appear here when workspace changes are recorded.
              </p>
            ) : (
              <ul className="divide-y">
                {recentActivity.data.map((event) => (
                  <li key={event.id} className="py-3">
                    <p className="font-medium">{formatEvent(event.action, event.entityType)}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.actor?.email ?? 'Workspace system'} · {dateLabel(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/dashboard/activity" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              View activity feed
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1 text-sm">
      <span className="block font-medium">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border bg-background px-3"
      >
        {children}
      </select>
    </label>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold">{value.toLocaleString()}</p>
        </div>
        <span className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}

function formatEvent(action: string, entityType: string): string {
  const readableAction = action.toLowerCase().replaceAll('_', ' ');
  const readableEntity = entityType.toLowerCase().replaceAll('_', ' ');
  return `${readableAction} · ${readableEntity}`;
}

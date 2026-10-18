'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Spinner } from '@trifusion/ui';
import type { Client, Project, Task } from '@trifusion/contracts';
import { apiClient, ApiClientError, type Page } from '../../lib/api-client';
import { useAuth } from '../../contexts/auth-context';
import { useWorkspace } from '../../contexts/workspace-context';

export type ResourceKind = 'clients' | 'projects' | 'tasks';
type ResourceRow = Client | Project | Task;

const statusOptions: Record<ResourceKind, string[]> = {
  clients: ['ACTIVE', 'ARCHIVED'],
  projects: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
  tasks: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
};

function listResources(
  resource: ResourceKind,
  workspaceId: string,
  query: Record<string, string | number | undefined>,
): Promise<Page<ResourceRow>> {
  switch (resource) {
    case 'clients':
      return apiClient.clients.list(workspaceId, query);
    case 'projects':
      return apiClient.projects.list(workspaceId, query);
    case 'tasks':
      return apiClient.tasks.list(workspaceId, query);
  }
}

function resourceName(resource: ResourceKind): string {
  return resource[0].toUpperCase() + resource.slice(1);
}

function rowTitle(row: ResourceRow): string {
  return 'title' in row ? row.title : row.name;
}

function rowSubtitle(row: ResourceRow): string {
  if ('email' in row) {
    return row.email || row.phone || 'No contact details';
  }
  if ('clientId' in row) {
    return row.description || (row.clientId ? `Client ${row.clientId}` : 'No client linked');
  }
  if ('title' in row) {
    return row.description || `Priority: ${row.priority}`;
  }
  return 'No additional details';
}

export function ResourceList({ resource }: { resource: ResourceKind }) {
  const { user } = useAuth();
  const { workspace, canWrite } = useWorkspace();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([undefined]);
  const cursor = cursorStack[cursorStack.length - 1];
  const typeName = resourceName(resource);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useQuery({
    queryKey: ['domain-list', user?.id, workspace?.id, resource, debouncedSearch, status, sortBy, cursor],
    queryFn: () => listResources(resource, workspace!.id, {
      limit: 20,
      cursor,
      q: debouncedSearch || undefined,
      status: status || undefined,
      sortBy,
    }),
    enabled: Boolean(workspace),
  });

  const setFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCursorStack([undefined]);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">{workspace?.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{typeName}</h1>
          <p className="mt-2 text-muted-foreground">Browse and manage workspace {resource}.</p>
        </div>
        {canWrite && (
          <Button asChild>
            <Link href={`/dashboard/${resource}/new`}><Plus aria-hidden="true" className="mr-2 h-4 w-4" />New {resource.slice(0, -1)}</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{typeName} directory</CardTitle>
          <CardDescription>Results are loaded from the selected workspace and paginated by the API.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
            <label className="relative">
              <span className="sr-only">Search {resource}</span>
              <Search aria-hidden="true" className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(event) => setFilter(setSearch, event.target.value)}
                placeholder={`Search ${resource}`}
              />
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={status}
                onChange={(event) => setFilter(setStatus, event.target.value)}
              >
                <option value="">All statuses</option>
                {statusOptions[resource].map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Sort by</span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={sortBy}
                onChange={(event) => setFilter(setSortBy, event.target.value)}
              >
                {sortOptions(resource).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>

          {query.isPending ? (
            <div className="flex min-h-48 items-center justify-center" role="status">
              <Spinner />
              <span className="sr-only">Loading {resource}</span>
            </div>
          ) : query.isError ? (
            <div className="rounded-md border border-destructive/40 p-5" role="alert">
              <p className="font-medium">Could not load {resource}.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query.error instanceof ApiClientError ? query.error.message : 'The request failed.'}
              </p>
              <Button className="mt-4" variant="outline" onClick={() => void query.refetch()}>Try again</Button>
            </div>
          ) : query.data.data.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center">
              <p className="font-medium">No {resource} found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || status ? 'Adjust your filters, or create a new record.' : `This workspace has no ${resource} yet.`}
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y">
                {query.data.data.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/dashboard/${resource}/${row.id}`}
                      className="flex flex-col gap-2 py-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between sm:px-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{rowTitle(row)}</span>
                        <span className="mt-1 block truncate text-sm text-muted-foreground">{rowSubtitle(row)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-sm">
                        <span className="rounded-full bg-muted px-2.5 py-1">{row.status.replaceAll('_', ' ')}</span>
                        {row.createdAt && <time className="text-muted-foreground" dateTime={new Date(row.createdAt).toISOString()}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(row.createdAt))}</time>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {query.data.total.toLocaleString()} total · Page size {query.data.limit}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cursorStack.length === 1 || query.isFetching}
                    onClick={() => setCursorStack((stack) => stack.slice(0, -1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!query.data.hasMore || !query.data.nextCursor || query.isFetching}
                    onClick={() => setCursorStack((stack) => [...stack, query.data.nextCursor ?? undefined])}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function sortOptions(resource: ResourceKind): Array<[string, string]> {
  if (resource === 'clients') return [['createdAt', 'Recently created'], ['name', 'Name'], ['status', 'Status']];
  if (resource === 'projects') return [['createdAt', 'Recently created'], ['name', 'Name'], ['status', 'Status'], ['startDate', 'Start date']];
  return [['createdAt', 'Recently created'], ['dueDate', 'Due date'], ['priority', 'Priority'], ['status', 'Status']];
}

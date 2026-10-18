'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Spinner } from '@trifusion/ui';
import { apiClient, ApiClientError } from '../../../lib/api-client';
import { useWorkspace } from '../../../contexts/workspace-context';
import { useAuth } from '../../../contexts/auth-context';

export default function ActivityPage() {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [cursorStack, setCursorStack] = useState<Array<string | undefined>>([undefined]);
  const cursor = cursorStack[cursorStack.length - 1];
  const activity = useQuery({
    queryKey: ['workspace-activity', user?.id, workspace?.id, cursor],
    queryFn: () => apiClient.activity.list(workspace!.id, { limit: 50, cursor }),
    enabled: Boolean(workspace),
  });

  if (activity.isPending) {
    return <div className="flex min-h-48 items-center justify-center" role="status"><Spinner /><span className="sr-only">Loading activity</span></div>;
  }
  if (activity.isError) {
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Activity could not be loaded</CardTitle>
          <CardDescription>{activity.error instanceof ApiClientError ? activity.error.message : 'The request failed.'}</CardDescription>
        </CardHeader>
        <CardContent><Button variant="outline" onClick={() => void activity.refetch()}>Try again</Button></CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-5">
      <header>
        <p className="text-sm text-muted-foreground">{workspace?.name}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Activity</h1>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent workspace events</CardTitle>
          <CardDescription>Recorded changes from the selected workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.data.data.length === 0 ? (
            <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No activity has been recorded yet.</p>
          ) : (
            <>
              <ol className="divide-y">
                {activity.data.data.map((event) => (
                  <li key={event.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <span className="block font-medium">{event.action.toLowerCase().replaceAll('_', ' ')} · {event.entityType.toLowerCase()}</span>
                      <span className="text-sm text-muted-foreground">{event.actorId ? 'Workspace member' : 'Workspace system'}</span>
                    </span>
                    <time className="text-sm text-muted-foreground" dateTime={new Date(event.createdAt).toISOString()}>
                      {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.createdAt))}
                    </time>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {activity.data.total.toLocaleString()} events · page size {activity.data.limit}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={cursorStack.length === 1 || activity.isFetching}
                    onClick={() => setCursorStack((stack) => stack.slice(0, -1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!activity.data.hasMore || !activity.data.nextCursor || activity.isFetching}
                    onClick={() => setCursorStack((stack) => [...stack, activity.data.nextCursor ?? undefined])}
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

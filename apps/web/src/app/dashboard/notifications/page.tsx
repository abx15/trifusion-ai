'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
} from '@mui/material';
import { Table } from '@trifusion/ui';
import { Alert, Spinner } from '@trifusion/ui';
import { DashboardShell } from '../../../components/dashboard-shell';
import { useAuth } from '../../../contexts/auth-context';
import { useWorkspace } from '../../../contexts/workspace-context';
import { ApiClientError } from '../../../lib/api-client';
import { Bell, CheckCircle } from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  workspaceId: string | null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const notificationsQuery = useQuery<NotificationItem[]>({
    queryKey: ['notifications', user?.id, workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/backend/notifications?workspaceId=${workspace!.id}`, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new ApiClientError(`Failed to load notifications: ${res.status}`, res.status);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data ?? []);
    },
    enabled: Boolean(workspace && Boolean(user?.id)),
  });

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const loading = notificationsQuery.isPending;
  const error = notificationsQuery.error;

  if (!workspace) {
    return <div className="flex min-h-[60vh] items-center justify-center">Select a workspace to continue.</div>;
  }
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="large" />
        <span className="ml-2">Loading notifications…</span>
      </div>
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof ApiClientError ? error.message : 'Unable to load notifications.'}
      </Alert>
    );
  }

  const items = (notificationsQuery.data ?? []).filter((n) =>
    showUnreadOnly ? !n.readAt : true
  );

  const unreadCount = (notificationsQuery.data ?? []).filter((n) => !n.readAt).length;

  return (
    <DashboardShell
      role="VIEWER"
      navItems={[
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', href: '/dashboard/viewer' },
        { id: 'notifications', label: 'Notifications', icon: 'Bell', href: '/dashboard/notifications' },
      ]}
      breadcrumbs={[
        { label: workspace.name, href: '/dashboard/viewer' },
        { label: 'Notifications' },
      ]}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Bell style={{ fontSize: 24, color: '#003F5C' }} />
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Workspace notifications for <strong>{workspace.name}</strong>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`Unread: ${unreadCount}`}
            color={unreadCount > 0 ? 'warning' : 'default'}
            size="small"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          />
        </Box>
      </Box>

      {items.length === 0 ? (
        <EmptyStateCmp
          title="No notifications"
          description={showUnreadOnly ? 'No unread notifications.' : 'You have no notifications yet.'}
          action={
            <ButtonCmp variant="outlined" onClick={() => setShowUnreadOnly(false)}>
              Show all
            </ButtonCmp>
          }
        />
      ) : (
        <Table
          columns={[
            { key: 'type', label: 'Type', width: '25%' },
            { key: 'summary', label: 'Summary', width: '45%' },
            { key: 'status', label: 'Status', width: '15%' },
            { key: 'createdAt', label: 'Date', width: '15%' },
          ]}
          data={items.map((n) => {
            const payload = n.payload as Record<string, unknown>;
            return {
              id: n.id,
              type: n.type.replaceAll('_', ' '),
              summary: String(payload?.message ?? payload?.title ?? 'Notification update'),
              status: n.readAt ? 'Read' : 'Unread',
              createdAt: new Date(n.createdAt).toLocaleDateString(),
            };
          })}
          emptyMessage="No notifications found."
        />
      )}
    </DashboardShell>
  );
}

function EmptyStateCmp({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <Paper sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderColor: 'divider', my: 4 }}>
      <CheckCircle style={{ fontSize: 48, color: '#94A3B8' }} />
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      {action}
    </Paper>
  );
}

function ButtonCmp({ children, variant, onClick }: { children: React.ReactNode; variant?: 'contained' | 'outlined'; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
      variant === 'outlined' ? 'border-divider text-secondary hover:bg-muted hover:text-primary' : 'bg-primary text-white hover:bg-primary-dark'
    }`}>
      {children}
    </button>
  );
}

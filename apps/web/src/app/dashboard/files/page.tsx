'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Typography,
} from '@mui/material';
import { Table, EmptyState, Alert, Spinner } from '@trifusion/ui';
import { DashboardShell } from '../../../components/dashboard-shell';
import { useAuth } from '../../../contexts/auth-context';
import { useWorkspace } from '../../../contexts/workspace-context';
import { ApiClientError } from '../../../lib/api-client';
import { Folder } from 'lucide-react';

interface FileAssetItem {
  id: string;
  objectKey: string;
  originalName: string;
  contentType: string;
  size: number;
  scanStatus: string;
  status: string;
  createdAt: string;
}

export default function FilesPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  const filesQuery = useQuery<FileAssetItem[]>({
    queryKey: ['files', user?.id, workspace?.id],
    queryFn: async () => {
      const res = await fetch(`/api/backend/workspaces/${workspace!.id}/files`, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new ApiClientError(`Failed to load files: ${res.status}`, res.status);
      }
      const data = await res.json();
      return Array.isArray(data) ? data : (data.data ?? []);
    },
    enabled: Boolean(workspace && Boolean(user?.id)),
  });

  const loading = filesQuery.isPending;
  const error = filesQuery.error;

  if (!workspace) {
    return <div className="flex min-h-[60vh] items-center justify-center">Select a workspace to continue.</div>;
  }
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="large" />
        <span className="ml-2">Loading files…</span>
      </div>
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof ApiClientError ? error.message : 'Unable to load files.'}
      </Alert>
    );
  }

  const items = filesQuery.data ?? [];

  return (
    <DashboardShell
      role="VIEWER"
      navItems={[
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', href: '/dashboard/viewer' },
        { id: 'files', label: 'Files', icon: 'Folder', href: '/dashboard/files' },
      ]}
      breadcrumbs={[
        { label: workspace.name, href: '/dashboard/viewer' },
        { label: 'Files' },
      ]}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }} gutterBottom>
        <Folder style={{ fontSize: 24, color: '#003F5C', marginRight: 8 }} />
        Workspace Files
      </Typography>
      {items.length === 0 ? (
        <EmptyState
          title="No files"
          description="No files have been uploaded to this workspace yet."
        />
      ) : (
        <Table
          columns={[
            { key: 'originalName', label: 'File Name', width: '30%' },
            { key: 'contentType', label: 'Type', width: '15%' },
            { key: 'size', label: 'Size', width: '15%' },
            { key: 'scanStatus', label: 'Scan Status', width: '20%' },
            { key: 'status', label: 'Status', width: '20%' },
          ]}
          data={items.map((f) => ({
            id: f.id,
            originalName: f.originalName,
            contentType: f.contentType,
            size: `${(f.size / 1024).toFixed(1)} KB`,
            scanStatus: f.scanStatus,
            status: f.status,
          }))}
          emptyMessage="No files found."
        />
      )}
    </DashboardShell>
  );
}

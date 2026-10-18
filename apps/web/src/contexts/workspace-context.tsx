'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { WorkspaceRole, WorkspaceSummary } from '@trifusion/contracts';
import { apiClient, ApiClientError } from '../lib/api-client';
import { useAuth } from './auth-context';

interface WorkspaceContextValue {
  workspace: WorkspaceSummary | null;
  role: WorkspaceRole | null;
  canWrite: boolean;
  canManage: boolean;
  selectWorkspace: (workspaceId: string) => Promise<void>;
  updateWorkspaceName: (name: string) => void;
  selectionError: string | null;
  isValidating: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.workspaces.length) {
      setWorkspace(null);
      return;
    }

    const firstWorkspace =
      user.workspaces.find((item) => item.type === 'PERSONAL') ?? user.workspaces[0];
    let cancelled = false;
    setIsValidating(true);
    apiClient.workspaces
      .validate(firstWorkspace.id)
      .then((validated) => {
        if (cancelled) return;
        setWorkspace({
          ...firstWorkspace,
          name: validated.workspaceName,
          role: validated.role,
        });
        setSelectionError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWorkspace(null);
        setSelectionError(
          error instanceof ApiClientError && error.statusCode === 403
            ? 'You no longer have access to this workspace.'
            : 'Could not verify workspace access. Please try again.',
        );
      })
      .finally(() => {
        if (!cancelled) setIsValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const selectWorkspace = async (workspaceId: string) => {
    const selected = user?.workspaces.find((item) => item.id === workspaceId);
    if (!selected) {
      setSelectionError('Choose a workspace from your active memberships.');
      return;
    }
    setIsValidating(true);
    setSelectionError(null);
    try {
      const validated = await apiClient.workspaces.validate(selected.id);
      setWorkspace({ ...selected, name: validated.workspaceName, role: validated.role });
    } catch (error) {
      setSelectionError(
        error instanceof ApiClientError && error.statusCode === 403
          ? 'You do not have access to that workspace.'
          : 'Could not verify workspace access. Please try again.',
      );
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  const value = useMemo<WorkspaceContextValue>(() => {
    const role = workspace?.role ?? null;
    return {
      workspace,
      role,
      canWrite: role !== null && role !== 'VIEWER',
      canManage: role === 'OWNER' || role === 'TEAM_ADMIN',
      selectWorkspace,
      updateWorkspaceName: (name) => setWorkspace((current) => current ? { ...current, name } : current),
      selectionError,
      isValidating,
    };
  }, [workspace, selectionError, isValidating, user]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return context;
}

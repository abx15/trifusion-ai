'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { WorkspaceRole } from '@trifusion/contracts';
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Spinner } from '@trifusion/ui';
import { ApiClientError, apiClient } from '../../../lib/api-client';
import { useAuth } from '../../../contexts/auth-context';
import { useWorkspace } from '../../../contexts/workspace-context';

const settingsSchema = z.object({
  companyName: z.string().trim().max(200).nullable(),
  companyEmail: z.union([z.string().email().max(200), z.literal('')]).transform((value) => value || null),
});

const roleOptions: WorkspaceRole[] = ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'];

export default function WorkspaceSettingsPage() {
  const { user } = useAuth();
  const { workspace, role, canManage, updateWorkspaceName } = useWorkspace();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const settings = useQuery({
    queryKey: ['workspace-settings', user?.id, workspace?.id],
    queryFn: () => apiClient.settings.get(workspace!.id),
    enabled: Boolean(workspace),
  });
  const members = useQuery({
    queryKey: ['workspace-members', user?.id, workspace?.id],
    queryFn: () => apiClient.workspaces.members(workspace!.id),
    enabled: Boolean(workspace),
  });
  const invitations = useQuery({
    queryKey: ['workspace-invitations', user?.id, workspace?.id],
    queryFn: () => apiClient.workspaces.invitations(workspace!.id),
    enabled: Boolean(workspace && canManage),
  });

  const saveSettings = useMutation({
    mutationFn: async (form: FormData) => {
      const parsed = settingsSchema.safeParse({
        companyName: String(form.get('companyName') ?? '').trim() || null,
        companyEmail: String(form.get('companyEmail') ?? '').trim(),
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join('. '));
      }
      return apiClient.settings.update(workspace!.id, parsed.data);
    },
    onSuccess: async () => {
      setErrorMessage(null);
      setMessage('Workspace settings saved.');
      await queryClient.invalidateQueries({ queryKey: ['workspace-settings', user?.id, workspace?.id] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const renameWorkspace = useMutation({
    mutationFn: async (form: FormData) => {
      const name = String(form.get('workspaceName') ?? '').trim();
      if (name.length < 2 || name.length > 100) {
        throw new Error('Workspace name must be between 2 and 100 characters.');
      }
      return apiClient.workspaces.update(workspace!.id, name);
    },
    onSuccess: async (updated) => {
      setErrorMessage(null);
      updateWorkspaceName(updated.name);
      setMessage('Workspace name saved.');
      await queryClient.invalidateQueries({ queryKey: ['workspace-members', user?.id, workspace?.id] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const invite = useMutation({
    mutationFn: async (form: FormData) => {
      const email = z.string().trim().email().parse(String(form.get('inviteEmail') ?? ''));
      const inviteRole = z.enum(['MEMBER', 'VIEWER', 'TEAM_ADMIN', 'OWNER']).parse(
        String(form.get('inviteRole') ?? 'MEMBER'),
      ) as WorkspaceRole;
      const result = await apiClient.workspaces.invite(workspace!.id, email, inviteRole);
      return { email: result.email, role: result.role };
    },
    onSuccess: async (result) => {
      setErrorMessage(null);
      setMessage(`Invitation recorded for ${result.email}. Email delivery is not configured yet.`);
      await queryClient.invalidateQueries({ queryKey: ['workspace-invitations', user?.id, workspace?.id] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, nextRole }: { userId: string; nextRole: WorkspaceRole }) =>
      apiClient.workspaces.updateMemberRole(workspace!.id, userId, nextRole),
    onSuccess: async () => {
      setErrorMessage(null);
      setMessage('Member role updated.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['workspace-members', user?.id, workspace?.id] }),
        queryClient.invalidateQueries({ queryKey: ['workspace-dashboard', user?.id, workspace?.id] }),
      ]);
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => apiClient.workspaces.removeMember(workspace!.id, userId),
    onSuccess: async () => {
      setErrorMessage(null);
      setMessage('Member removed from this workspace.');
      await queryClient.invalidateQueries({ queryKey: ['workspace-members', user?.id, workspace?.id] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const revokeInvitation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.workspaces.revokeInvitation(workspace!.id, invitationId),
    onSuccess: async () => {
      setErrorMessage(null);
      setMessage('Invitation revoked.');
      await queryClient.invalidateQueries({ queryKey: ['workspace-invitations', user?.id, workspace?.id] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  const loading = settings.isPending || members.isPending || (canManage && invitations.isPending);
  const queryError = settings.error ?? members.error ?? invitations.error;

  if (!workspace) {
    return <Alert role="alert"><AlertDescription>Workspace access must be verified before settings can be loaded.</AlertDescription></Alert>;
  }
  if (loading) {
    return <div className="flex min-h-48 items-center justify-center" role="status"><Spinner /><span className="sr-only">Loading workspace settings</span></div>;
  }
  if (queryError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          {queryError instanceof ApiClientError ? queryError.message : 'Workspace settings could not be loaded.'}
        </AlertDescription>
      </Alert>
    );
  }

  const inviteRoles = role === 'OWNER' ? roleOptions : ['MEMBER', 'VIEWER'] as WorkspaceRole[];

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">{workspace.name}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Workspace settings</h1>
      </header>
      {(message || errorMessage) && (
        <Alert variant={errorMessage ? 'destructive' : 'default'} role={errorMessage ? 'alert' : 'status'}>
          <AlertDescription>{errorMessage ?? message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace profile</CardTitle>
          <CardDescription>Workspace identity and contact details visible to members.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-2">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              renameWorkspace.mutate(new FormData(event.currentTarget));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace name</Label>
              <Input id="workspaceName" name="workspaceName" required minLength={2} maxLength={100} defaultValue={workspace.name} readOnly={!canManage} />
            </div>
            {canManage && <Button type="submit" disabled={renameWorkspace.isPending}>{renameWorkspace.isPending ? 'Saving…' : 'Update workspace name'}</Button>}
          </form>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveSettings.mutate(new FormData(event.currentTarget));
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="companyName">Organization name</Label>
              <Input id="companyName" name="companyName" maxLength={200} defaultValue={settings.data?.companyName ?? ''} readOnly={!canManage} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Contact email</Label>
              <Input id="companyEmail" name="companyEmail" type="email" maxLength={200} defaultValue={settings.data?.companyEmail ?? ''} readOnly={!canManage} />
            </div>
            {canManage && <Button type="submit" disabled={saveSettings.isPending}>{saveSettings.isPending ? 'Saving…' : 'Save contact settings'}</Button>}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active members</CardTitle>
          <CardDescription>Membership and role information from the workspace API.</CardDescription>
        </CardHeader>
        <CardContent>
          {!canManage && <p className="mb-4 text-sm text-muted-foreground">Member management is available to workspace admins and owners.</p>}
          <ul className="divide-y">
            {(members.data ?? []).map((member) => {
              const isSelf = member.userId === user?.id;
              const ownerCount = members.data?.filter((item) => item.role === 'OWNER').length ?? 0;
              const canManageTarget =
                !isSelf &&
                (role === 'OWNER' ||
                  (role === 'TEAM_ADMIN' && ['MEMBER', 'VIEWER'].includes(member.role)));
              const canRemoveTarget =
                canManageTarget &&
                (role === 'OWNER'
                  ? member.role !== 'OWNER' || ownerCount > 1
                  : ['MEMBER', 'VIEWER'].includes(member.role));
              const options = role === 'OWNER'
                ? member.role === 'OWNER' && ownerCount <= 1
                  ? ['OWNER'] as WorkspaceRole[]
                  : roleOptions
                : ['MEMBER', 'VIEWER'] as WorkspaceRole[];
              return (
                <li key={member.userId} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{member.name || member.email}{isSelf ? ' (you)' : ''}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canManageTarget ? (
                      <select
                        aria-label={`Role for ${member.email}`}
                        value={member.role}
                        disabled={updateRole.isPending}
                        className="h-9 rounded-md border bg-background px-2 text-sm"
                        onChange={(event) => updateRole.mutate({ userId: member.userId, nextRole: event.target.value as WorkspaceRole })}
                      >
                        {options.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
                      </select>
                    ) : (
                      <span className="rounded-full bg-muted px-3 py-1 text-sm">{member.role.replaceAll('_', ' ')}</span>
                    )}
                    {canRemoveTarget && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={removeMember.isPending}
                        onClick={() => {
                          if (window.confirm(`Remove ${member.email} from this workspace?`)) {
                            removeMember.mutate(member.userId);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {canManage && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invite a teammate</CardTitle>
              <CardDescription>Invitations expire after seven days. Email delivery is not configured.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  invite.mutate(new FormData(event.currentTarget));
                  event.currentTarget.reset();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email address</Label>
                  <Input id="inviteEmail" name="inviteEmail" type="email" required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Workspace role</Label>
                  <select id="inviteRole" name="inviteRole" defaultValue="MEMBER" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
                    {inviteRoles.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
                  </select>
                </div>
                <Button type="submit" disabled={invite.isPending}>{invite.isPending ? 'Creating invitation…' : 'Create invitation'}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending invitations</CardTitle>
              <CardDescription>Open invitations currently recorded for this workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              {(invitations.data ?? []).length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No pending invitations.</p>
              ) : (
                <ul className="divide-y">
                  {(invitations.data ?? []).map((invitation) => (
                    <li key={invitation.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{invitation.email}</span>
                        <span className="text-xs text-muted-foreground">{invitation.role} · expires {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(invitation.expiresAt))}</span>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={revokeInvitation.isPending}
                        onClick={() => revokeInvitation.mutate(invitation.id)}
                      >
                        Revoke
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clientSchema,
  projectSchema,
  taskSchema,
  type ClientInput,
  type ProjectInput,
  type TaskInput,
} from '@trifusion/contracts';
import { Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Spinner } from '@trifusion/ui';
import { apiClient, ApiClientError, type WorkspaceMember } from '../../lib/api-client';
import { useWorkspace } from '../../contexts/workspace-context';
import { useAuth } from '../../contexts/auth-context';
import type { ResourceKind } from './resource-list';

type RecordValue = {
  id: string;
  name?: string;
  title?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  notes?: string | null;
  description?: string | null;
  clientId?: string | null;
  projectId?: string;
  assigneeId?: string | null;
  status: string;
  priority?: string;
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

const nextProjectStatuses: Record<string, string[]> = {
  PLANNING: ['ACTIVE'],
  ACTIVE: ['ON_HOLD', 'COMPLETED'],
  ON_HOLD: ['ACTIVE'],
  COMPLETED: [],
  ARCHIVED: [],
};

const nextTaskStatuses: Record<string, string[]> = {
  TODO: ['IN_PROGRESS'],
  IN_PROGRESS: ['REVIEW', 'TODO'],
  REVIEW: ['DONE', 'IN_PROGRESS'],
  DONE: ['TODO', 'IN_PROGRESS'],
};

function dateInputValue(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function datePayload(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string' || !value) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

function field(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

async function getRecord(resource: ResourceKind, workspaceId: string, id: string): Promise<RecordValue> {
  switch (resource) {
    case 'clients':
      return apiClient.clients.get(workspaceId, id);
    case 'projects':
      return apiClient.projects.get(workspaceId, id);
    case 'tasks':
      return apiClient.tasks.get(workspaceId, id);
  }
}

function validateInput(resource: ResourceKind, form: FormData) {
  if (resource === 'clients') {
    const parsed = clientSchema.safeParse({
      name: field(form, 'name'),
      email: field(form, 'email') || null,
      phone: field(form, 'phone') || null,
      website: field(form, 'website') || null,
      address: field(form, 'address') || null,
      notes: field(form, 'notes') || null,
      status: 'ACTIVE',
    });
    return parsed;
  }
  if (resource === 'projects') {
    return projectSchema.safeParse({
      name: field(form, 'name'),
      description: field(form, 'description') || null,
      clientId: field(form, 'clientId') || null,
      status: field(form, 'status') || 'PLANNING',
      startDate: datePayload(form.get('startDate')),
      endDate: datePayload(form.get('endDate')),
    });
  }
  return taskSchema.safeParse({
    projectId: field(form, 'projectId'),
    assigneeId: field(form, 'assigneeId') || null,
    title: field(form, 'title'),
    description: field(form, 'description') || null,
    status: field(form, 'status') || 'TODO',
    priority: field(form, 'priority') || 'MEDIUM',
    dueDate: datePayload(form.get('dueDate')),
  });
}

export function ResourceForm({
  resource,
  recordId,
}: {
  resource: ResourceKind;
  recordId?: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { workspace, canWrite, canManage } = useWorkspace();
  const isEdit = Boolean(recordId);
  const [formError, setFormError] = useState<string | null>(null);

  const record = useQuery({
    queryKey: ['domain-record', user?.id, workspace?.id, resource, recordId],
    queryFn: () => getRecord(resource, workspace!.id, recordId!),
    enabled: Boolean(workspace && recordId),
  });

  const relations = useQuery({
    queryKey: ['form-relations', user?.id, workspace?.id, resource],
    queryFn: async () => {
      if (resource === 'projects') {
        const clients = await apiClient.clients.list(workspace!.id, { limit: 50, sortBy: 'name' });
        return { clients: clients.data, projects: [], members: [] as WorkspaceMember[] };
      }
      if (resource === 'tasks') {
        const [projects, members] = await Promise.all([
          apiClient.projects.list(workspace!.id, { limit: 50, sortBy: 'name' }),
          apiClient.workspaces.members(workspace!.id),
        ]);
        return { clients: [], projects: projects.data, members };
      }
      return { clients: [], projects: [], members: [] as WorkspaceMember[] };
    },
    enabled: Boolean(workspace && resource !== 'clients'),
  });

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const parsed = validateInput(resource, form);
      if (!parsed.success) {
        throw new Error(parsed.error.issues.map((issue) => issue.message).join('. '));
      }
      if (resource === 'clients') {
        return isEdit
          ? apiClient.clients.update(workspace!.id, recordId!, parsed.data as Partial<ClientInput>)
          : apiClient.clients.create(workspace!.id, parsed.data as ClientInput);
      }
      if (resource === 'projects') {
        return isEdit
          ? apiClient.projects.update(workspace!.id, recordId!, parsed.data as Partial<ProjectInput>)
          : apiClient.projects.create(workspace!.id, parsed.data as ProjectInput);
      }
      return isEdit
        ? apiClient.tasks.update(workspace!.id, recordId!, parsed.data as Partial<TaskInput>)
        : apiClient.tasks.create(workspace!.id, parsed.data as TaskInput);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['domain-list', user?.id, workspace?.id] });
      await queryClient.invalidateQueries({ queryKey: ['workspace-dashboard', user?.id, workspace?.id] });
      router.push(`/dashboard/${resource}`);
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const archive = useMutation({
    mutationFn: async () => {
      if (!workspace || !recordId) throw new Error('A workspace record is required to archive this item.');
      if (resource === 'clients') return apiClient.clients.archive(workspace.id, recordId);
      if (resource === 'projects') return apiClient.projects.archive(workspace.id, recordId);
      return apiClient.tasks.archive(workspace.id, recordId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['domain-list', user?.id, workspace?.id] });
      await queryClient.invalidateQueries({ queryKey: ['workspace-dashboard', user?.id, workspace?.id] });
      router.push(`/dashboard/${resource}`);
    },
    onError: (error: Error) => setFormError(error.message),
  });

  const item = record.data;
  const projectStatuses = useMemo(
    () => item ? [item.status, ...(nextProjectStatuses[item.status] ?? [])] : ['PLANNING', 'ACTIVE'],
    [item],
  );
  const taskStatuses = useMemo(
    () => item ? [item.status, ...(nextTaskStatuses[item.status] ?? [])] : ['TODO'],
    [item],
  );
  const pending = isEdit && (record.isPending || (resource !== 'clients' && relations.isPending));
  const error = isEdit && record.isError
    ? record.error
    : resource !== 'clients' && relations.isError
      ? relations.error
      : null;
  const title = resource === 'tasks' ? 'Task' : resource.slice(0, -1).replace(/^./, (letter) => letter.toUpperCase());
  const canEdit = canWrite && (!isEdit || !item?.status.endsWith('ARCHIVED'));

  if (pending) {
    return <div className="flex min-h-48 items-center justify-center" role="status"><Spinner /><span className="sr-only">Loading {title.toLowerCase()}</span></div>;
  }
  if (error) {
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Unable to load {title.toLowerCase()}</CardTitle>
          <CardDescription>{error instanceof ApiClientError ? error.message : 'The request failed.'}</CardDescription>
        </CardHeader>
        <CardContent><Button variant="outline" onClick={() => void (recordId ? record.refetch() : relations.refetch())}>Try again</Button></CardContent>
      </Card>
    );
  }
  if (!canWrite && !isEdit) {
    return <Alert><AlertDescription>Your workspace role is read-only. You cannot create {resource}.</AlertDescription></Alert>;
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    save.mutate(new FormData(event.currentTarget));
  };

  const readOnly = isEdit && !canEdit;
  const relationData = relations.data;

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <header>
        <Link href={`/dashboard/${resource}`} className="text-sm text-primary hover:underline">← Back to {resource}</Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{isEdit ? `View or edit ${title.toLowerCase()}` : `Create ${title.toLowerCase()}`}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Changes are validated by the NestJS API and saved in {workspace?.name}.
        </p>
      </header>
      <Card>
        <CardContent className="p-5 sm:p-7">
          <form className="space-y-5" onSubmit={submit}>
            {formError && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            {resource === 'clients' && (
              <>
                <TextField name="name" label="Client name" required defaultValue={item?.name} readOnly={readOnly} />
                <TextField name="email" label="Email" type="email" defaultValue={item?.email} readOnly={readOnly} />
                <TextField name="phone" label="Phone" defaultValue={item?.phone} readOnly={readOnly} />
                <TextField name="website" label="Website" type="url" defaultValue={item?.website} readOnly={readOnly} />
                <TextField name="address" label="Address" defaultValue={item?.address} readOnly={readOnly} />
                <TextField name="notes" label="Notes" defaultValue={item?.notes} readOnly={readOnly} multiline />
              </>
            )}
            {resource === 'projects' && (
              <>
                <TextField name="name" label="Project name" required defaultValue={item?.name} readOnly={readOnly} />
                <TextField name="description" label="Description" defaultValue={item?.description} readOnly={readOnly} multiline />
                <SelectField name="clientId" label="Client" defaultValue={item?.clientId ?? ''} disabled={readOnly}>
                  <option value="">No client</option>
                  {relationData?.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </SelectField>
                <SelectField name="status" label="Status" defaultValue={item?.status ?? 'PLANNING'} disabled={readOnly}>
                  {projectStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                </SelectField>
                <TextField name="startDate" label="Start date" type="date" defaultValue={dateInputValue(item?.startDate)} readOnly={readOnly} />
                <TextField name="endDate" label="End date" type="date" defaultValue={dateInputValue(item?.endDate)} readOnly={readOnly} />
              </>
            )}
            {resource === 'tasks' && (
              <>
                <TextField name="title" label="Task title" required defaultValue={item?.title} readOnly={readOnly} />
                <TextField name="description" label="Description" defaultValue={item?.description} readOnly={readOnly} multiline />
                <SelectField name="projectId" label="Project" required defaultValue={item?.projectId ?? ''} disabled={readOnly}>
                  <option value="">Select a project</option>
                  {relationData?.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </SelectField>
                <SelectField name="assigneeId" label="Assignee" defaultValue={item?.assigneeId ?? ''} disabled={readOnly}>
                  <option value="">Unassigned</option>
                  {relationData?.members.filter((member) => member.status === 'ACTIVE').map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name || member.email}
                    </option>
                  ))}
                </SelectField>
                <SelectField name="status" label="Status" defaultValue={item?.status ?? 'TODO'} disabled={readOnly}>
                  {taskStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                </SelectField>
                <SelectField name="priority" label="Priority" defaultValue={item?.priority ?? 'MEDIUM'} disabled={readOnly}>
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </SelectField>
                <TextField name="dueDate" label="Due date" type="date" defaultValue={dateInputValue(item?.dueDate)} readOnly={readOnly} />
              </>
            )}
            <div className="flex flex-wrap justify-between gap-3 border-t pt-5">
              <span>
                {isEdit && canManage && (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={archive.isPending}
                    onClick={() => {
                      if (window.confirm(`Archive this ${title.toLowerCase()}?`)) archive.mutate();
                    }}
                  >
                    {archive.isPending ? 'Archiving…' : `Archive ${title}`}
                  </Button>
                )}
              </span>
              <span className="flex gap-2">
                <Button asChild type="button" variant="outline"><Link href={`/dashboard/${resource}`}>Cancel</Link></Button>
                {!readOnly && (
                  <Button type="submit" disabled={save.isPending || (resource !== 'clients' && relations.isError)}>
                    {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : `Create ${title.toLowerCase()}`}
                  </Button>
                )}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  type = 'text',
  required,
  readOnly,
  multiline,
}: {
  name: string;
  label: string;
  defaultValue?: string | Date | null;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ? String(defaultValue) : ''}
          readOnly={readOnly}
          rows={4}
          className="flex min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          defaultValue={type === 'date' ? dateInputValue(defaultValue) : defaultValue ? String(defaultValue) : ''}
          required={required}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  disabled,
  required,
  children,
}: {
  name: string;
  label: string;
  defaultValue: string;
  disabled?: boolean;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        className="h-10 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </select>
    </div>
  );
}

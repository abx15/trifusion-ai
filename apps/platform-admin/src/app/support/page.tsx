'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Box, Typography, Paper, Stack, Chip } from '@mui/material';
import { KPICard, EmptyState, Table, Alert, Spinner } from '@trifusion/ui';
import { PlatformDashboardShell } from '../../components/platform-dashboard-shell';
import { usePlatformStaff } from '../../contexts/platform-staff-context';
import { Ticket, Clipboard, User, AlertTriangle, Mail, Shield } from 'lucide-react';

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`/api/backend${path}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

interface SupportStats {
  openTickets: number;
  assignedTickets: number;
  pendingCustomerResponses: number;
  criticalIncidents: number;
  slaBreaches: number;
  activeSupportSessions: number;
  avgResolutionTime: string | null;
  recentTickets: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    workspaceId: string | null;
    assigneeId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  activeSessions: Array<{
    id: string;
    workspaceId: string;
    workspaceName: string;
    agentId: string;
    startedAt: string;
    expiresAt: string;
  }>;
}

export default function SupportDashboardPage() {
  const { staff, refresh } = usePlatformStaff();
  const [viewFilter, setViewFilter] = useState<'all' | 'assigned'>('all');


  const statsQuery = useQuery<SupportStats>({
    queryKey: ['support-dashboard-stats', staff?.id ?? 'anonymous', viewFilter],
    queryFn: async () => {
      if (!staff) throw new Error('Platform staff session is unavailable.');
      const [tickets, assignedTicketsResponse] = await Promise.all([
        fetchJson('/platform/v1/support/tickets?limit=20'),
        fetchJson(
          `/platform/v1/support/tickets?limit=1&assigneeId=${encodeURIComponent(staff?.id ?? 'anonymous')}`
        ),
      ]);
      const sessions = await fetchJson('/platform/v1/support/sessions?limit=20');

      const ticketList = Array.isArray(tickets) ? tickets : (tickets.tickets ?? []);
      const sessionList = Array.isArray(sessions) ? sessions : (sessions.sessions ?? []);
      const summary = tickets.summary;
      const activeSupportSessions = sessionList.filter((s: any) => s.status === 'ACTIVE').length;

      return {
        openTickets: summary?.openTickets ?? 0,
        assignedTickets: assignedTicketsResponse.total ?? 0,
        pendingCustomerResponses: summary?.pendingCustomerResponses ?? 0,
        criticalIncidents: summary?.criticalIncidents ?? 0,
        slaBreaches: summary?.slaBreaches ?? 0,
        activeSupportSessions,
        avgResolutionTime:
          summary?.averageResolutionHours == null
            ? null
            : `${Number(summary.averageResolutionHours).toFixed(1)}h`,
        recentTickets: ticketList.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          workspaceId: t.workspaceId,
          assigneeId: t.assigneeId,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        })),
        activeSessions: sessionList.map((s: any) => ({
          id: s.id,
          workspaceId: s.workspaceId,
          workspaceName: s.workspaceName,
          agentId: s.agentId,
          startedAt: s.startedAt,
          expiresAt: s.expiresAt,
        })),
      };
    },
    enabled: Boolean(
      staff && ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)
    ),
  });

  if (!staff || !['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) {
    return (
      <section
        className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8 text-center"
        role="alert"
      >
        <h1 className="text-xl font-semibold">Support access required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only SUPPORT_AGENT, SUPERADMIN, or PLATFORM_ADMIN can access the support dashboard.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-5 rounded-md border px-4 py-2 text-sm"
        >
          Refresh access
        </button>
      </section>
    );
  }

  const loading = statsQuery.isPending;
  const error = statsQuery.error;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="large" />
        <span className="ml-2">Loading support command center…</span>
      </div>
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        {error instanceof Error ? error.message : 'Unable to load support data.'}
      </Alert>
    );
  }

  const stats = statsQuery.data!;
  const ticketsToShow =
    viewFilter === 'assigned'
      ? stats.recentTickets.filter((t) => t.assigneeId === staff?.id ?? 'anonymous')
      : stats.recentTickets;

  return (
    <PlatformDashboardShell
      role="SUPPORT_AGENT"
      navItems={[
        {
          id: 'overview',
          label: 'Support Overview',
          icon: 'LayoutDashboard',
          href: '/platform-admin/support',
        },
        {
          id: 'ticket-queue',
          label: 'Ticket Queue',
          icon: 'Ticket',
          href: '/platform-admin/support/ticket-queue',
        },
        {
          id: 'my-tickets',
          label: 'My Assigned Tickets',
          icon: 'Clipboard',
          href: '/platform-admin/support/my-tickets',
        },
        {
          id: 'ticket-details',
          label: 'Ticket Details',
          icon: 'FileText',
          href: '/platform-admin/support/ticket-details',
        },
        {
          id: 'customer-requests',
          label: 'Customer Requests',
          icon: 'Mail',
          href: '/platform-admin/support/customer-requests',
        },
        {
          id: 'consent-management',
          label: 'Consent Management',
          icon: 'Shield',
          href: '/platform-admin/support/consent-management',
        },
        {
          id: 'active-sessions',
          label: 'Active Support Sessions',
          icon: 'User',
          href: '/platform-admin/support/active-sessions',
        },
        {
          id: 'session-history',
          label: 'Session History',
          icon: 'History',
          href: '/platform-admin/support/session-history',
        },
        {
          id: 'sla-monitoring',
          label: 'SLA Monitoring',
          icon: 'Clock',
          href: '/platform-admin/support/sla-monitoring',
        },
        {
          id: 'escalations',
          label: 'Escalations',
          icon: 'AlertTriangle',
          href: '/platform-admin/support/escalations',
        },
        {
          id: 'resolution-reports',
          label: 'Resolution Reports',
          icon: 'BarChart',
          href: '/platform-admin/support/resolution-reports',
        },
      ]}
      breadcrumbs={[
        { label: 'Support Command Center', href: '/platform-admin/support' },
        { label: 'Overview' },
      ]}
    >
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, mb: 4 }}>
        <KPICard
          title="Open Tickets"
          value={stats.openTickets}
          trend={{
            value: stats.openTickets > 0 ? 'requires attention' : 'clear',
            positive: stats.openTickets === 0,
          }}
          icon={<Ticket style={{ fontSize: 20, color: '#003F5C' }} />}
        />
        <KPICard
          title="My Assigned"
          value={stats.assignedTickets}
          icon={<Clipboard style={{ fontSize: 20, color: '#58508D' }} />}
        />
        <KPICard
          title="Pending Customer Response"
          value={stats.pendingCustomerResponses}
          icon={<Mail style={{ fontSize: 20, color: '#FFA600' }} />}
        />
        <KPICard
          title="Critical Incidents"
          value={stats.criticalIncidents}
          trend={{
            value: stats.criticalIncidents > 0 ? 'escalate immediately' : 'none',
            positive: stats.criticalIncidents === 0,
          }}
          icon={<AlertTriangle style={{ fontSize: 20, color: '#FF6361' }} />}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Ticket Queue
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <ButtonCmp
                  variant={viewFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setViewFilter('all')}
                >
                  All Tickets
                </ButtonCmp>
                <ButtonCmp
                  variant={viewFilter === 'assigned' ? 'contained' : 'outlined'}
                  onClick={() => setViewFilter('assigned')}
                >
                  My Assigned
                </ButtonCmp>
              </Box>
            </Box>
            {ticketsToShow.length > 0 ? (
              <Table
                columns={[
                  { key: 'title', label: 'Title', width: '30%' },
                  { key: 'status', label: 'Status', width: '15%' },
                  { key: 'priority', label: 'Priority', width: '15%' },
                  { key: 'assignee', label: 'Assignee', width: '20%' },
                  { key: 'updatedAt', label: 'Updated', width: '20%' },
                ]}
                data={ticketsToShow.map((t) => ({
                  id: t.id,
                  title: t.title,
                  status: t.status.replaceAll('_', ' '),
                  priority: t.priority,
                  assignee:
                    t.assigneeId === staff?.id ?? 'anonymous'
                      ? 'Me (you)'
                      : t.assigneeId
                        ? 'Assigned'
                        : 'Unassigned',
                  updatedAt: new Date(t.updatedAt).toLocaleDateString(),
                }))}
                emptyMessage="No tickets found."
              />
            ) : (
              <EmptyState title="No tickets" description="No support tickets found." />
            )}
          </Stack>
        </Paper>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Active Support Sessions
            </Typography>
            {stats.activeSessions.length > 0 ? (
              <Table
                columns={[
                  { key: 'workspace', label: 'Workspace', width: '40%' },
                  { key: 'startedAt', label: 'Started', width: '30%' },
                  { key: 'expiresAt', label: 'Expires', width: '30%' },
                ]}
                data={stats.activeSessions.map((s) => ({
                  id: s.id,
                  workspace: s.workspaceName,
                  startedAt: new Date(s.startedAt).toLocaleDateString(),
                  expiresAt: new Date(s.expiresAt).toLocaleDateString(),
                }))}
                emptyMessage="No active sessions."
              />
            ) : (
              <EmptyState title="No active sessions" description="No active support sessions." />
            )}
          </Stack>
        </Paper>
      </Box>

      <Box sx={{ mt: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            SLA & Resolution
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip
              label={`SLA Breaches: ${stats.slaBreaches}`}
              color={stats.slaBreaches > 0 ? 'error' : 'success'}
              size="small"
            />
            <Chip
              label={`Avg Resolution: ${stats.avgResolutionTime ?? 'Unavailable'}`}
              color="primary"
              size="small"
            />
            <Chip
              label={`Active Sessions: ${stats.activeSupportSessions}`}
              color="info"
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            All support access is consent-based and time-bounded. Every session generates an
            immutable audit event (PLATFORM_SUPPORT_ACCESS).
          </Typography>
        </Paper>
        <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            <LinkCmp
              href="/platform-admin/support/ticket-queue"
              variant="outlined"
              startIcon={<Ticket style={{ fontSize: 18 }} />}
            >
              View Ticket Queue
            </LinkCmp>
            <LinkCmp
              href="/platform-admin/support/my-tickets"
              variant="outlined"
              startIcon={<Clipboard style={{ fontSize: 18 }} />}
            >
              My Assigned Tickets
            </LinkCmp>
            <LinkCmp
              href="/platform-admin/support/active-sessions"
              variant="outlined"
              startIcon={<User style={{ fontSize: 18 }} />}
            >
              Active Sessions
            </LinkCmp>
            <LinkCmp
              href="/platform-admin/support/consent-management"
              variant="outlined"
              startIcon={<Shield style={{ fontSize: 18 }} />}
            >
              Consent Management
            </LinkCmp>
          </Box>
        </Paper>
      </Box>
    </PlatformDashboardShell>
  );
}

function ButtonCmp({
  children,
  variant,
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'contained' | 'outlined';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
        variant === 'outlined'
          ? 'border-divider text-slate-700 hover:bg-slate-100'
          : 'bg-primary text-white hover:bg-primary-dark'
      }`}
    >
      {children}
    </button>
  );
}

function LinkCmp({
  children,
  variant,
  href,
  startIcon,
}: {
  children: React.ReactNode;
  variant?: 'contained' | 'outlined';
  href: string;
  startIcon?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
        variant === 'outlined'
          ? 'border-divider text-slate-700 hover:bg-slate-100'
          : 'bg-primary text-white hover:bg-primary-dark'
      }`}
    >
      {startIcon && <span>{startIcon}</span>}
      {children}
    </a>
  );
}

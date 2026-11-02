export type CustomerRole = 'OWNER' | 'TEAM_ADMIN' | 'MEMBER' | 'VIEWER';
export type PlatformRole = 'SUPERADMIN' | 'PLATFORM_ADMIN' | 'ANALYST' | 'SUPPORT_AGENT';

// ---------------------------------------------------------------------------
// Customer Workspace dashboard paths
// ---------------------------------------------------------------------------
export const CUSTOMER_DASHBOARD_PATHS: Record<CustomerRole, string> = {
  OWNER: '/dashboard/owner',
  TEAM_ADMIN: '/dashboard/team-admin',
  MEMBER: '/dashboard/member',
  VIEWER: '/dashboard/viewer',
};

export function getCustomerDashboardPath(role: CustomerRole): string {
  return CUSTOMER_DASHBOARD_PATHS[role];
}

// ---------------------------------------------------------------------------
// Platform Staff dashboard paths
// ---------------------------------------------------------------------------
export const PLATFORM_DASHBOARD_PATHS: Record<PlatformRole, string> = {
  SUPERADMIN: '/platform-admin/superadmin',
  PLATFORM_ADMIN: '/platform-admin/admin',
  ANALYST: '/platform-admin/analyst',
  SUPPORT_AGENT: '/platform-admin/support',
};

export function getPlatformDashboardPath(role: PlatformRole): string {
  return PLATFORM_DASHBOARD_PATHS[role];
}

// ---------------------------------------------------------------------------
// Navigation item types
// ---------------------------------------------------------------------------
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles?: CustomerRole[];
}

export interface PlatformNavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles?: PlatformRole[];
}

// ---------------------------------------------------------------------------
// Dashboard config types
// ---------------------------------------------------------------------------
export interface DashboardConfig {
  role: CustomerRole;
  design: 'glassmorphism' | 'minimalist' | 'productivity' | 'editorial';
  layout: 'bento' | 'grid' | 'kanban' | 'list';
  nav: NavItem[];
  widgets: string[];
  primaryColor: string;
}

export interface PlatformDashboardConfig {
  role: PlatformRole;
  design: 'glassmorphism' | 'minimalist' | 'dark' | 'helpdesk';
  layout: 'bento' | 'grid' | 'kanban' | 'list';
  nav: PlatformNavItem[];
  widgets: string[];
  primaryColor: string;
}

// ---------------------------------------------------------------------------
// Customer Workspace Role Configurations
// Each role gets a unique destination path (not a shared generic dashboard).
// ---------------------------------------------------------------------------
export const CUSTOMER_ROLE_CONFIGS: Record<CustomerRole, DashboardConfig> = {
  OWNER: {
    role: 'OWNER',
    design: 'glassmorphism',
    layout: 'bento',
    primaryColor: '#003F5C',
    nav: [
      { id: 'overview', label: 'Workspace Overview', icon: 'LayoutDashboard', href: '/dashboard/owner', roles: ['OWNER'] },
      { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/dashboard/projects', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'clients', label: 'Clients', icon: 'Briefcase', href: '/dashboard/clients', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', href: '/dashboard/tasks', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'team-members', label: 'Team Members', icon: 'Users', href: '/dashboard/owner/members', roles: ['OWNER'] },
      { id: 'departments', label: 'Departments', icon: 'Layers', href: '/dashboard/owner/departments', roles: ['OWNER'] },
      { id: 'teams', label: 'Teams', icon: 'Group', href: '/dashboard/owner/teams', roles: ['OWNER'] },
      { id: 'invitations', label: 'Invitations', icon: 'Mail', href: '/dashboard/owner/invitations', roles: ['OWNER'] },
      { id: 'settings', label: 'Workspace Settings', icon: 'Settings', href: '/dashboard/settings', roles: ['OWNER', 'TEAM_ADMIN'] },
      { id: 'activity', label: 'Workspace Audit Logs', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN'] },
      { id: 'billing', label: 'Subscription & Billing', icon: 'CreditCard', href: '/dashboard/owner/billing', roles: ['OWNER'] },
      { id: 'reports', label: 'Reports', icon: 'BarChart', href: '/dashboard/owner/reports', roles: ['OWNER'] },
    ],
    widgets: ['workspaceOverview', 'projectStats', 'taskStats', 'recentActivity', 'teamMembers', 'billingSummary'],
  },
  TEAM_ADMIN: {
    role: 'TEAM_ADMIN',
    design: 'minimalist',
    layout: 'bento',
    primaryColor: '#58508D',
    nav: [
      { id: 'overview', label: 'Team Overview', icon: 'LayoutDashboard', href: '/dashboard/team-admin', roles: ['TEAM_ADMIN'] },
      { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/dashboard/projects', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'clients', label: 'Clients', icon: 'Briefcase', href: '/dashboard/clients', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'tasks', label: 'Task Assignments', icon: 'CheckSquare', href: '/dashboard/tasks', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'team-members', label: 'Team Members', icon: 'Users', href: '/dashboard/team-admin/members', roles: ['TEAM_ADMIN'] },
      { id: 'activity', label: 'Team Activity', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN'] },
      { id: 'reports', label: 'Reports', icon: 'BarChart', href: '/dashboard/team-admin/reports', roles: ['TEAM_ADMIN'] },
      { id: 'settings', label: 'Permitted Settings', icon: 'Settings', href: '/dashboard/settings', roles: ['OWNER', 'TEAM_ADMIN'] },
    ],
    widgets: ['teamOverview', 'projectStats', 'taskStats', 'teamWorkload', 'recentActivity'],
  },
  MEMBER: {
    role: 'MEMBER',
    design: 'productivity',
    layout: 'kanban',
    primaryColor: '#8A508F',
    nav: [
      { id: 'overview', label: 'My Dashboard', icon: 'LayoutDashboard', href: '/dashboard/member', roles: ['MEMBER'] },
      { id: 'my-tasks', label: 'My Tasks', icon: 'CheckSquare', href: '/dashboard/member/tasks', roles: ['MEMBER'] },
      { id: 'assigned-projects', label: 'Assigned Projects', icon: 'FolderKanban', href: '/dashboard/member/projects', roles: ['MEMBER'] },
      { id: 'clients', label: 'Clients', icon: 'Briefcase', href: '/dashboard/clients', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'calendar', label: 'My Calendar', icon: 'Calendar', href: '/dashboard/member/calendar', roles: ['MEMBER'] },
      { id: 'activity', label: 'My Activity', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'notifications', label: 'Notifications', icon: 'Bell', href: '/dashboard/notifications', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'directory', label: 'Team Directory', icon: 'Users', href: '/dashboard/member/directory', roles: ['MEMBER'] },
    ],
    widgets: ['myTasks', 'assignedProjects', 'upcomingDeadlines', 'personalProductivity', 'recentActivity'],
  },
  VIEWER: {
    role: 'VIEWER',
    design: 'editorial',
    layout: 'list',
    primaryColor: '#64748B',
    nav: [
      { id: 'overview', label: 'Workspace Overview', icon: 'LayoutDashboard', href: '/dashboard/viewer', roles: ['VIEWER'] },
      { id: 'projects', label: 'Projects Overview', icon: 'FolderKanban', href: '/dashboard/viewer/projects', roles: ['VIEWER'] },
      { id: 'clients', label: 'Clients Overview', icon: 'Briefcase', href: '/dashboard/viewer/clients', roles: ['VIEWER'] },
      { id: 'tasks', label: 'Task Monitoring', icon: 'CheckSquare', href: '/dashboard/viewer/tasks', roles: ['VIEWER'] },
      { id: 'progress', label: 'Progress Analytics', icon: 'BarChart', href: '/dashboard/viewer/progress', roles: ['VIEWER'] },
      { id: 'activity', label: 'Team Activity', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'notifications', label: 'Notifications', icon: 'Bell', href: '/dashboard/notifications', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
    ],
    widgets: ['workspaceOverview', 'projectProgress', 'taskStatus', 'upcomingMilestones', 'teamActivity'],
  },
};

// ---------------------------------------------------------------------------
// Platform Staff Role Configurations
// ---------------------------------------------------------------------------
export const PLATFORM_ROLE_CONFIGS: Record<PlatformRole, PlatformDashboardConfig> = {
  SUPERADMIN: {
    role: 'SUPERADMIN',
    design: 'glassmorphism',
    layout: 'bento',
    primaryColor: '#003F5C',
    nav: [
      { id: 'overview', label: 'Dashboard Overview', icon: 'LayoutDashboard', href: '/platform-admin/superadmin', roles: ['SUPERADMIN'] },
      { id: 'analytics', label: 'Platform Analytics', icon: 'BarChart', href: '/platform-admin/superadmin/analytics', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'tenants', label: 'Tenant Management', icon: 'Building', href: '/platform-admin/superadmin/tenants', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'users', label: 'User Management', icon: 'Users', href: '/platform-admin/superadmin/users', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'staff', label: 'Platform Staff Management', icon: 'Shield', href: '/platform-admin/superadmin/staff', roles: ['SUPERADMIN'] },
      { id: 'roles', label: 'Role & Permission Management', icon: 'Lock', href: '/platform-admin/superadmin/roles', roles: ['SUPERADMIN'] },
      { id: 'config', label: 'Global Configuration', icon: 'Settings', href: '/platform-admin/superadmin/config', roles: ['SUPERADMIN'] },
      { id: 'subscriptions', label: 'Subscription Management', icon: 'CreditCard', href: '/platform-admin/superadmin/subscriptions', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'health', label: 'Platform Health', icon: 'Activity', href: '/platform-admin/superadmin/health', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'api-monitoring', label: 'API Monitoring', icon: 'Monitor', href: '/platform-admin/superadmin/api-monitoring', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'security', label: 'Security Center', icon: 'Shield', href: '/platform-admin/superadmin/security', roles: ['SUPERADMIN'] },
      { id: 'audit-logs', label: 'Global Audit Logs', icon: 'Activity', href: '/platform-admin/superadmin/audit-logs', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'reports', label: 'Reports', icon: 'BarChart', href: '/platform-admin/superadmin/reports', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'integrations', label: 'Integrations', icon: 'Link', href: '/platform-admin/superadmin/integrations', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'system-settings', label: 'System Settings', icon: 'Settings', href: '/platform-admin/superadmin/system-settings', roles: ['SUPERADMIN'] },
    ],
    widgets: ['totalUsers', 'activeUsers', 'totalTenants', 'activeTenants', 'suspendedTenants', 'platformGrowth', 'apiPerformance', 'resourceUtilization', 'subscriptionStats', 'securityAlerts', 'recentAdminActivity'],
  },
  PLATFORM_ADMIN: {
    role: 'PLATFORM_ADMIN',
    design: 'minimalist',
    layout: 'grid',
    primaryColor: '#58508D',
    nav: [
      { id: 'overview', label: 'Operations Overview', icon: 'LayoutDashboard', href: '/platform-admin/admin', roles: ['PLATFORM_ADMIN', 'SUPERADMIN'] },
      { id: 'tenants', label: 'Tenant Management', icon: 'Building', href: '/platform-admin/admin/tenants', roles: ['PLATFORM_ADMIN', 'SUPERADMIN'] },
      { id: 'users', label: 'User Management', icon: 'Users', href: '/platform-admin/admin/users', roles: ['PLATFORM_ADMIN', 'SUPERADMIN'] },
      { id: 'activation', label: 'Account Activation', icon: 'PlayCircle', href: '/platform-admin/admin/activation', roles: ['PLATFORM_ADMIN', 'SUPERADMIN'] },
      { id: 'suspension', label: 'Account Suspension', icon: 'PauseCircle', href: '/platform-admin/admin/suspension', roles: ['PLATFORM_ADMIN', 'SUPERADMIN'] },
      { id: 'workspace-monitoring', label: 'Workspace Monitoring', icon: 'Monitor', href: '/platform-admin/admin/workspace-monitoring', roles: ['PLATFORM_ADMIN', 'SUPERADMIN'] },
      { id: 'usage-quotas', label: 'Usage & Quotas', icon: 'BarChart', href: '/platform-admin/admin/usage-quotas', roles: ['PLATFORM_ADMIN', 'SUPERADMIN', 'ANALYST'] },
      { id: 'platform-activity', label: 'Platform Activity', icon: 'Activity', href: '/platform-admin/admin/platform-activity', roles: ['PLATFORM_ADMIN', 'SUPERADMIN', 'ANALYST'] },
      { id: 'support', label: 'Support Management', icon: 'Headset', href: '/platform-admin/admin/support', roles: ['PLATFORM_ADMIN', 'SUPERADMIN', 'SUPPORT_AGENT'] },
      { id: 'reports', label: 'Operational Reports', icon: 'BarChart', href: '/platform-admin/admin/reports', roles: ['PLATFORM_ADMIN', 'SUPERADMIN', 'ANALYST'] },
      { id: 'settings', label: 'Settings', icon: 'Settings', href: '/platform-admin/admin/settings', roles: ['PLATFORM_ADMIN', 'SUPERADMIN'] },
    ],
    widgets: ['activeTenants', 'pendingActivations', 'activeUsers', 'suspendedAccounts', 'tenantGrowth', 'usageStatistics', 'recentOperationalActivity', 'supportActivity'],
  },
  ANALYST: {
    role: 'ANALYST',
    design: 'dark',
    layout: 'bento',
    primaryColor: '#8A508F',
    nav: [
      { id: 'overview', label: 'Analytics Overview', icon: 'LayoutDashboard', href: '/platform-admin/analyst', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'user-analytics', label: 'User Analytics', icon: 'Users', href: '/platform-admin/analyst/user-analytics', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'tenant-analytics', label: 'Tenant Analytics', icon: 'Building', href: '/platform-admin/analyst/tenant-analytics', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'growth-analytics', label: 'Growth Analytics', icon: 'TrendingUp', href: '/platform-admin/analyst/growth-analytics', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'api-analytics', label: 'API Analytics', icon: 'Monitor', href: '/platform-admin/analyst/api-analytics', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'performance-analytics', label: 'Performance Analytics', icon: 'Activity', href: '/platform-admin/analyst/performance-analytics', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'resource-analytics', label: 'Resource Analytics', icon: 'HardDrive', href: '/platform-admin/analyst/resource-analytics', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'usage-reports', label: 'Usage Reports', icon: 'FileText', href: '/platform-admin/analyst/usage-reports', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'audit-analytics', label: 'Audit Analytics', icon: 'Activity', href: '/platform-admin/analyst/audit-analytics', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'custom-reports', label: 'Custom Reports', icon: 'BarChart', href: '/platform-admin/analyst/custom-reports', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'export-center', label: 'Export Center', icon: 'Download', href: '/platform-admin/analyst/export-center', roles: ['ANALYST', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
    ],
    widgets: ['userGrowthCharts', 'tenantGrowthCharts', 'activeUsersOverTime', 'apiRequestTrends', 'usageDistribution', 'performanceTrends', 'resourceConsumption', 'dateComparisons'],
  },
  SUPPORT_AGENT: {
    role: 'SUPPORT_AGENT',
    design: 'helpdesk',
    layout: 'kanban',
    primaryColor: '#FF6361',
    nav: [
      { id: 'overview', label: 'Support Overview', icon: 'LayoutDashboard', href: '/platform-admin/support', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'ticket-queue', label: 'Ticket Queue', icon: 'Ticket', href: '/platform-admin/support/ticket-queue', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'my-tickets', label: 'My Assigned Tickets', icon: 'Clipboard', href: '/platform-admin/support/my-tickets', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'ticket-details', label: 'Ticket Details', icon: 'FileText', href: '/platform-admin/support/ticket-details', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'customer-requests', label: 'Customer Requests', icon: 'Mail', href: '/platform-admin/support/customer-requests', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'consent-management', label: 'Consent Management', icon: 'Shield', href: '/platform-admin/support/consent-management', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'active-sessions', label: 'Active Support Sessions', icon: 'User', href: '/platform-admin/support/active-sessions', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'session-history', label: 'Session History', icon: 'History', href: '/platform-admin/support/session-history', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'sla-monitoring', label: 'SLA Monitoring', icon: 'Clock', href: '/platform-admin/support/sla-monitoring', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'escalations', label: 'Escalations', icon: 'AlertTriangle', href: '/platform-admin/support/escalations', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'resolution-reports', label: 'Resolution Reports', icon: 'BarChart', href: '/platform-admin/support/resolution-reports', roles: ['SUPPORT_AGENT', 'SUPERADMIN', 'PLATFORM_ADMIN'] },
    ],
    widgets: ['openTickets', 'assignedTickets', 'pendingCustomerResponses', 'criticalIncidents', 'slaBreaches', 'activeSupportSessions', 'resolutionTime', 'recentTicketActivity'],
  },
};

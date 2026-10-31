export type CustomerRole = 'OWNER' | 'TEAM_ADMIN' | 'MEMBER' | 'VIEWER';
export type PlatformRole = 'SUPERADMIN' | 'PLATFORM_ADMIN' | 'ANALYST' | 'SUPPORT_AGENT';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles?: CustomerRole[];
}

export interface DashboardConfig {
  role: CustomerRole;
  design: 'glassmorphism' | 'minimalist' | 'productivity' | 'editorial';
  layout: 'bento' | 'grid' | 'kanban' | 'list';
  nav: NavItem[];
  widgets: string[];
  primaryColor: string;
}

// Customer Workspace Role Configurations
export const CUSTOMER_ROLE_CONFIGS: Record<CustomerRole, DashboardConfig> = {
  OWNER: {
    role: 'OWNER',
    design: 'glassmorphism',
    layout: 'bento',
    primaryColor: '#003F5C',
    nav: [
      { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', href: '/dashboard', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'clients', label: 'Clients', icon: 'Briefcase', href: '/dashboard/clients', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/dashboard/projects', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', href: '/dashboard/tasks', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'activity', label: 'Activity', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'members', label: 'Members', icon: 'Users', href: '/dashboard/settings', roles: ['OWNER', 'TEAM_ADMIN'] },
      { id: 'settings', label: 'Settings', icon: 'Settings', href: '/dashboard/settings', roles: ['OWNER', 'TEAM_ADMIN'] },
    ],
    widgets: ['workspaceOverview', 'projectStats', 'taskStats', 'recentActivity', 'teamMembers', 'quickActions'],
  },
  TEAM_ADMIN: {
    role: 'TEAM_ADMIN',
    design: 'minimalist',
    layout: 'bento',
    primaryColor: '#58508D',
    nav: [
      { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', href: '/dashboard', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'clients', label: 'Clients', icon: 'Briefcase', href: '/dashboard/clients', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/dashboard/projects', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', href: '/dashboard/tasks', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'activity', label: 'Activity', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'members', label: 'Team Members', icon: 'Users', href: '/dashboard/settings', roles: ['OWNER', 'TEAM_ADMIN'] },
    ],
    widgets: ['workspaceOverview', 'projectStats', 'taskStats', 'teamMembers', 'recentActivity'],
  },
  MEMBER: {
    role: 'MEMBER',
    design: 'productivity',
    layout: 'kanban',
    primaryColor: '#8A508F',
    nav: [
      { id: 'overview', label: 'My Workspace', icon: 'LayoutDashboard', href: '/dashboard', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'tasks', label: 'My Tasks', icon: 'CheckSquare', href: '/dashboard/tasks', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/dashboard/projects', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'clients', label: 'Clients', icon: 'Briefcase', href: '/dashboard/clients', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'activity', label: 'Activity', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
    ],
    widgets: ['myTasks', 'assignedProjects', 'recentActivity', 'notifications'],
  },
  VIEWER: {
    role: 'VIEWER',
    design: 'editorial',
    layout: 'list',
    primaryColor: '#64748B',
    nav: [
      { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', href: '/dashboard', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'projects', label: 'Projects', icon: 'FolderKanban', href: '/dashboard/projects', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'clients', label: 'Clients', icon: 'Briefcase', href: '/dashboard/clients', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'tasks', label: 'Tasks', icon: 'CheckSquare', href: '/dashboard/tasks', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
      { id: 'activity', label: 'Activity', icon: 'Activity', href: '/dashboard/activity', roles: ['OWNER', 'TEAM_ADMIN', 'MEMBER', 'VIEWER'] },
    ],
    widgets: ['workspaceOverview', 'projectProgress', 'taskStatus', 'recentActivity'],
  },
};

// Platform Staff Role Configurations
export interface PlatformNavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles?: PlatformRole[];
}

export interface PlatformDashboardConfig {
  role: PlatformRole;
  design: 'glassmorphism' | 'minimalist' | 'dark' | 'helpdesk';
  layout: 'bento' | 'grid' | 'kanban' | 'list';
  nav: PlatformNavItem[];
  widgets: string[];
  primaryColor: string;
}

export const PLATFORM_ROLE_CONFIGS: Record<PlatformRole, PlatformDashboardConfig> = {
  SUPERADMIN: {
    role: 'SUPERADMIN',
    design: 'glassmorphism',
    layout: 'bento',
    primaryColor: '#003F5C',
    nav: [
      { id: 'overview', label: 'Platform Overview', icon: 'LayoutDashboard', href: '/platform-admin', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'workspaces', label: 'Workspaces', icon: 'Building', href: '/platform-admin/workspaces', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'users', label: 'Users', icon: 'Users', href: '/platform-admin/users', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'staff', label: 'Staff Roles', icon: 'Shield', href: '/platform-admin/staff', roles: ['SUPERADMIN'] },
      { id: 'audit', label: 'Audit Logs', icon: 'Activity', href: '/platform-admin/audit', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'settings', label: 'Global Settings', icon: 'Settings', href: '/platform-admin/settings', roles: ['SUPERADMIN'] },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart', href: '/platform-admin/analytics', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
    ],
    widgets: ['platformOverview', 'workspaceStats', 'userStats', 'staffManagement', 'globalAudit', 'systemHealth'],
  },
  PLATFORM_ADMIN: {
    role: 'PLATFORM_ADMIN',
    design: 'minimalist',
    layout: 'grid',
    primaryColor: '#58508D',
    nav: [
      { id: 'overview', label: 'Operations', icon: 'LayoutDashboard', href: '/platform-admin', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'workspaces', label: 'Workspaces', icon: 'Building', href: '/platform-admin/workspaces', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'users', label: 'Users', icon: 'Users', href: '/platform-admin/users', roles: ['SUPERADMIN', 'PLATFORM_ADMIN'] },
      { id: 'audit', label: 'Audit Logs', icon: 'Activity', href: '/platform-admin/audit', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart', href: '/platform-admin/analytics', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
    ],
    widgets: ['tenantOverview', 'workspaceManagement', 'userManagement', 'usageMetrics'],
  },
  ANALYST: {
    role: 'ANALYST',
    design: 'dark',
    layout: 'bento',
    primaryColor: '#8A508F',
    nav: [
      { id: 'overview', label: 'Platform Analytics', icon: 'LayoutDashboard', href: '/platform-admin/analytics', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'metrics', label: 'Metrics', icon: 'BarChart', href: '/platform-admin/metrics', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
      { id: 'audit', label: 'Audit Analytics', icon: 'Activity', href: '/platform-admin/audit', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'] },
    ],
    widgets: ['platformTelemetry', 'userGrowth', 'apiUsage', 'quotaReports', 'performanceMonitoring'],
  },
  SUPPORT_AGENT: {
    role: 'SUPPORT_AGENT',
    design: 'helpdesk',
    layout: 'kanban',
    primaryColor: '#FF6361',
    nav: [
      { id: 'overview', label: 'Support Dashboard', icon: 'Headset', href: '/platform-admin', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'] },
      { id: 'tickets', label: 'Tickets', icon: 'Ticket', href: '/platform-admin/tickets', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'] },
      { id: 'cases', label: 'Assigned Cases', icon: 'Clipboard', href: '/platform-admin/cases', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'] },
      { id: 'sessions', label: 'Active Sessions', icon: 'User', href: '/platform-admin/sessions', roles: ['SUPERADMIN', 'PLATFORM_ADMIN', 'SUPPORT_AGENT'] },
    ],
    widgets: ['ticketOverview', 'slaMetrics', 'activeSessions', 'resolutionRate'],
  },
};

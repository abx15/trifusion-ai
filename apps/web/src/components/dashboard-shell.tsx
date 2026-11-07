'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Drawer as MuiDrawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { resolveIcon } from '../lib/icon-map';
import { Button } from '@trifusion/ui';
import { useAuth } from '../contexts/auth-context';
import { useWorkspace } from '../contexts/workspace-context';
import type { CustomerRole } from '@trifusion/contracts';

interface DashboardShellProps {
  children: React.ReactNode;
  role: CustomerRole;
  navItems: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    disabled?: boolean;
  }>;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

export function DashboardShell({
  children,
  role,
  navItems,
  breadcrumbs,
}: DashboardShellProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { workspace, selectWorkspace, selectionError, isValidating } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  const activeItem = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  React.useEffect(() => {
    if (!workspace || !isAuthenticated || isLoading) return;
    if (workspace.role !== role) {
      router.replace(getRoleDashboardPath(workspace.role));
    }
  }, [workspace, role, isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !user || (workspace && workspace.role !== role)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center" role="status">
        <span className="loading-spinner" />
        <span className="ml-2">Verifying workspace access…</span>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mx-auto mt-12 max-w-xl rounded-xl border bg-white p-6 text-center" role="alert">
        <h2 className="text-lg font-semibold">Workspace access unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {selectionError ?? 'No active workspace is available for this account.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 lg:flex">
      {mobileMenuOpen && (
        <MuiDrawer
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          variant="temporary"
          sx={{
            '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box', backgroundColor: 'background.paper' },
          }}
          ModalProps={{ keepMounted: true }}
        >
          <Toolbar sx={{ pr: 2, pb: 2 }}>
            <Link href={getRoleDashboardPath(role)} className="text-xl font-bold tracking-tight text-primary no-underline">
              TriFusion <span className="text-secondary">Workspace</span>
            </Link>
          </Toolbar>
          <Box sx={{ pt: 1 }}>
            <span className="block px-3 py-1 text-xs font-medium text-muted-foreground">Workspace</span>
            <select
              className="w-full appearance-none rounded-md border bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={workspace?.id ?? ''}
              disabled={isValidating || !user.workspaces.length}
              onChange={(e) => void selectWorkspace(e.target.value).catch(() => undefined)}
            >
              {user.workspaces.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.role}
                </option>
              ))}
            </select>
          </Box>
          <nav aria-label="Mobile navigation" className="mt-4 space-y-1 p-3">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm ${
                  activeItem?.id === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-secondary hover:bg-muted'
                }`}
              >
                <span className="h-4 w-4">{React.createElement(resolveIcon(item.icon))}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => void handleLogout()}
            className="mt-4 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <span>🚪</span> Sign out
          </button>
        </MuiDrawer>
      )}

      <MuiDrawer
        open
        variant="permanent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Toolbar sx={{ pr: 2, pb: 2 }}>
          <Link
            href={getRoleDashboardPath(role)}
            className="text-xl font-bold tracking-tight text-primary no-underline"
            style={{ textDecoration: 'none' }}
          >
            TriFusion <span className="text-secondary">Workspace</span>
          </Link>
        </Toolbar>
        <Box sx={{ pt: 1, px: 2 }}>
          <span className="block px-2 py-1 text-xs font-medium text-muted-foreground">Workspace</span>
          <select
            className="w-full appearance-none rounded-md border bg-background py-1.5 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={workspace?.id ?? ''}
            disabled={isValidating || !user.workspaces.length}
            onChange={(e) => void selectWorkspace(e.target.value).catch(() => undefined)}
          >
            {user.workspaces.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.role}
              </option>
            ))}
          </select>
          {selectionError && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              {selectionError}
            </p>
          )}
        </Box>
        <List dense>
          {navItems.map((item: { id: string; label: string; icon: string; href: string; disabled?: boolean }) => {
            const active = activeItem?.id === item.id;
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={active}
                  disabled={item.disabled}
                  component={Link}
                  href={item.href}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    opacity: item.disabled ? 0.5 : 1,
                    pointerEvents: item.disabled ? 'none' : 'auto',
                    '&:hover': { backgroundColor: 'action.hover' },
                    ...(active && {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: active ? 'primary.contrastText' : 'text.secondary' }}>
                    {React.createElement(resolveIcon(item.icon))}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ pt: 2, px: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <span>🚪</span> Sign out
          </button>
        </Box>
      </MuiDrawer>

      <div className="min-w-0 flex-1">
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ px: 3, minHeight: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton
              size="large"
              onClick={() => setMobileMenuOpen((open) => !open)}
              sx={{ mr: 2, color: 'text.primary', display: { xs: 'flex', md: 'none' } }}
            >
              {mobileMenuOpen ? <span>✕</span> : <span>≡</span>}
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0, ml: 2, mr: 2 }}>
              <Link href={getRoleDashboardPath(role)} style={{ textDecoration: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.25, mb: 0.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {workspace?.name}
                </Typography>
              </Link>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0 }}>
                Role: {role}
              </Typography>
            </Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <select
                  className="w-full appearance-none rounded-md border bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={workspace?.id ?? ''}
                  disabled={isValidating || !user.workspaces.length}
                  onChange={(e) => void selectWorkspace(e.target.value).catch(() => undefined)}
                >
                  {user.workspaces.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.role}
                    </option>
                  ))}
                </select>
              </Box>
              {selectionError && (
                <p className="mt-2 text-xs text-destructive" role="alert">
                  {selectionError}
                </p>
              )}
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="ghost"
                size="small"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => void handleLogout()}
              >
                <span>🚪</span> Sign out
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                if (isLast) {
                  return (
                    <Typography key={item.label} variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href || '#'}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    className="hover:text-primary"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </Box>
          </Box>
        )}

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function getRoleDashboardPath(role: CustomerRole): string {
  switch (role) {
    case 'OWNER': return '/dashboard/owner';
    case 'TEAM_ADMIN': return '/dashboard/team-admin';
    case 'MEMBER': return '/dashboard/member';
    case 'VIEWER': return '/dashboard/viewer';
    default: return '/dashboard/viewer';
  }
}

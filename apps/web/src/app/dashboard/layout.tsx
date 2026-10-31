'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import {
  Drawer,
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
import { Button, Spinner } from '@trifusion/ui';
import { useAuth } from '../../contexts/auth-context';
import { WorkspaceProvider, useWorkspace } from '../../contexts/workspace-context';
import { CUSTOMER_ROLE_CONFIGS, type CustomerRole } from '@trifusion/contracts';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <RoleBasedDashboardFrame>{children}</RoleBasedDashboardFrame>
    </WorkspaceProvider>
  );
}

function RoleBasedDashboardFrame({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { workspace, selectWorkspace, selectionError, isValidating } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const role = workspace?.role as CustomerRole;
  const config = role ? CUSTOMER_ROLE_CONFIGS[role] : CUSTOMER_ROLE_CONFIGS.VIEWER;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Sign out failed.');
    }
  };

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center" role="status">
        <Spinner size="large" />
        <span className="sr-only">Loading your workspace</span>
      </div>
    );
  }

  const navItems = config.nav.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50/50 lg:flex">
      <Drawer
        open={true}
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
          <Link href="/dashboard" className="text-xl font-bold tracking-tight text-primary">
            TriFusion <span className="text-secondary">Workspace</span>
          </Link>
        </Toolbar>
        <List dense>
          {navItems.map((item) => {
            const active = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  selected={active}
                  component={Link}
                  href={item.href}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    '&:hover': { backgroundColor: 'action.hover' },
                    ...(active && {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': { backgroundColor: 'primary.dark' },
                    }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: active ? 'primary.contrastText' : 'text.secondary' }}>
                    <span className="h-4 w-4">{item.icon}</span>
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ pt: 2, px: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <ListItemButton
            onClick={() => void handleLogout()}
            sx={{ borderRadius: 2, mx: 1, color: 'text.secondary', '&:hover': { backgroundColor: 'action.hover' } }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>{/* logout icon */}</ListItemIcon>
            <ListItemText primary="Sign out" />
          </ListItemButton>
          {logoutError && <p role="alert" className="mt-2 text-xs text-destructive">{logoutError}</p>}
        </Box>
      </Drawer>

      <div className="min-w-0 flex-1">
        <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ px: 3, minHeight: 64 }}>
            <IconButton
              size="large"
              onClick={() => setMenuOpen((open) => !open)}
              sx={{ mr: 2, color: 'text.primary', display: { xs: 'flex', md: 'none' } }}
            >
              {menuOpen ? <X /> : <Menu />}
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.25, mb: 0.5 }}>
                {workspace?.name}
              </Typography>
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
                  onChange={(event) => void selectWorkspace(event.target.value).catch(() => undefined)}
                >
                  {user.workspaces.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.role}
                    </option>
                  ))}
                </select>
              </Box>
              {selectionError && <p className="mt-2 text-xs text-destructive" role="alert">{selectionError}</p>}
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              <Button
                variant="ghost"
                size="small"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => void handleLogout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
              {logoutError && <p role="alert" className="mt-2 text-xs text-destructive">{logoutError}</p>}
            </Box>
          </Toolbar>
        </AppBar>

        {menuOpen && (
          <div className="fixed inset-0 z-20 bg-background p-5 pt-20 lg:hidden">
            <Box sx={{ mb: 2 }}>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Workspace</span>
              <select
                className="w-full appearance-none rounded-md border bg-background py-2 pl-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={workspace?.id ?? ''}
                disabled={isValidating || !user.workspaces.length}
                onChange={(event) => void selectWorkspace(event.target.value).catch(() => undefined)}
              >
                {user.workspaces.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.role}
                  </option>
                ))}
              </select>
            </Box>
            {selectionError && <p className="mt-2 text-xs text-destructive" role="alert">{selectionError}</p>}
            <nav aria-label="Mobile workspace navigation" className="mt-6 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="h-4 w-4">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => void handleLogout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
              {logoutError && <p role="alert" className="mt-2 text-xs text-destructive">{logoutError}</p>}
            </nav>
          </div>
        )}

        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

RoleBasedDashboardFrame.displayName = 'RoleBasedDashboardFrame';

export default DashboardLayout;

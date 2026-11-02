'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { resolveIcon } from '../lib/icon-map';
import { usePlatformStaff } from '../contexts/platform-staff-context';
import { Button } from '@trifusion/ui';

interface PlatformDashboardShellProps {
  children: React.ReactNode;
  role: 'SUPERADMIN' | 'PLATFORM_ADMIN' | 'ANALYST' | 'SUPPORT_AGENT';
  navItems: Array<{
    id: string;
    label: string;
    icon: string;
    href: string;
    disabled?: boolean;
  }>;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

export function PlatformDashboardShell({
  children,
  role,
  navItems,
  breadcrumbs,
}: PlatformDashboardShellProps) {
  const { staff, isLoading } = usePlatformStaff();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/backend/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error('Logout failed');
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  const activeItem = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + '/'));

  if (isLoading || !staff) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <span className="loading-spinner" />
        <span className="ml-2">Verifying platform staff access…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {mobileMenuOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            bg: 'background.paper',
            p: 3,
            pb: 20,
            overflowY: 'auto',
          }}
          className="lg:hidden"
        >
          <Toolbar sx={{ pr: 2, pb: 2 }}>
            <Link href={getPlatformDashboardPath(role)} style={{ textDecoration: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
                TriFusion <span className="text-primary">Platform</span>
              </Typography>
            </Link>
          </Toolbar>
          <Box sx={{ pt: 1, px: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
              {staff.role.replaceAll('_', ' ')}
            </Typography>
          </Box>
          <nav aria-label="Mobile platform navigation" className="mt-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm ${
                  activeItem?.id === item.id ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'
                }`}
                style={{ textDecoration: 'none' }}
              >
                {React.createElement(resolveIcon(item.icon))}
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => void handleLogout()}
            className="mt-4 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <span>🚪</span> Sign out
          </button>
        </Box>
      )}

      <Box
        className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:bg-white lg:p-5"
        sx={{ borderRight: '1px solid', borderColor: 'divider' }}
      >
        <Toolbar sx={{ pr: 2, pb: 2 }}>
          <Link href={getPlatformDashboardPath(role)} style={{ textDecoration: 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
              TriFusion <span className="text-primary">Platform</span>
            </Typography>
          </Link>
        </Toolbar>
        <Box sx={{ pt: 1, px: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, fontWeight: 600 }}>
            {staff.role.replaceAll('_', ' ')}
          </Typography>
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
        <Box sx={{ pt: 2, px: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <button
            onClick={() => void handleLogout()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <span>🚪</span> Sign out
          </button>
        </Box>
      </Box>

      <div className="min-w-0 flex-1">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bg: 'background.paper' }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, minWidth: 0, ml: 2, mr: 2 }}>
            <Link href={getPlatformDashboardPath(role)} style={{ textDecoration: 'none' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: -0.25, mb: 0.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Platform Administration
              </Typography>
            </Link>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0 }}>
              Role: {staff.role.replaceAll('_', ' ')}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0 }}>
            <Button variant="ghost" size="small" onClick={() => void handleLogout()}>
              <span>🚪</span> Sign out
            </Button>
          </Box>
        </Box>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
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

function getPlatformDashboardPath(role: string): string {
  switch (role) {
    case 'SUPERADMIN': return '/platform-admin/superadmin';
    case 'PLATFORM_ADMIN': return '/platform-admin/admin';
    case 'ANALYST': return '/platform-admin/analyst';
    case 'SUPPORT_AGENT': return '/platform-admin/support';
    default: return '/platform-admin/support';
  }
}

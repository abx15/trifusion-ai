'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Activity, BarChart3, LogOut, Menu, Settings, Shield, Users, X } from 'lucide-react';
import { PlatformStaffProvider, usePlatformStaff } from '../contexts/platform-staff-context';

function ShellContents({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { staff, isLoading, statusCode, errorMessage, refresh } = usePlatformStaff();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLogin = pathname === '/login';

  if (isLogin) return <>{children}</>;

  const links = [
    { href: '/', label: 'Dashboard', icon: Shield, allowed: Boolean(staff) },
    { href: '/health', label: 'Service Health', icon: Activity, allowed: Boolean(staff && ['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) },
    { href: '/metrics', label: 'Platform Metrics', icon: BarChart3, allowed: Boolean(staff && ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'].includes(staff.role)) },
    { href: '/audit', label: 'Audit Logs', icon: Activity, allowed: Boolean(staff && ['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST'].includes(staff.role)) },
    { href: '/grants', label: 'Access Grants', icon: Shield, allowed: Boolean(staff && ['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) },
    { href: '/flags', label: 'Feature Flags', icon: Settings, allowed: Boolean(staff && ['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) },
    { href: '/staff', label: 'Staff Roles', icon: Users, allowed: staff?.role === 'SUPERADMIN' },
    { href: '/workspaces', label: 'Workspaces', icon: Users, allowed: Boolean(staff && ['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) },
    { href: '/users', label: 'Users', icon: Users, allowed: Boolean(staff && ['SUPERADMIN', 'PLATFORM_ADMIN'].includes(staff.role)) },
  ];

  const logout = async () => {
    setLogoutError(null);
    try {
      const response = await fetch('/api/backend/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) {
        const result: unknown = await response.json();
        const message = result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
          ? result.message
          : 'Sign out could not be confirmed.';
        throw new Error(message);
      }
      router.replace('/login');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Sign out failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white p-5 lg:flex">
        <Link href="/" className="mb-8 text-lg font-bold">TriFusion <span className="text-blue-700">Admin</span></Link>
        <nav aria-label="Platform administration" className="space-y-1">
          {links.filter((link) => link.allowed).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              <Icon aria-hidden="true" className="h-4 w-4" />{label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t pt-4">
          {staff && <p className="mb-3 text-xs text-slate-600">{staff.role.replaceAll('_', ' ')}</p>}
          <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
          </button>
          {logoutError && <p role="alert" className="mt-2 text-xs text-red-700">{logoutError}</p>}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 lg:hidden">
          <Link href="/" className="font-semibold">TriFusion Admin</Link>
          <button type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            {menuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          </button>
        </header>
        {menuOpen && (
          <nav aria-label="Mobile platform administration" className="space-y-1 border-b bg-white p-3 lg:hidden">
            {links.filter((link) => link.allowed).map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-slate-100">
                <Icon aria-hidden="true" className="h-4 w-4" />{label}
              </Link>
            ))}
            <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-slate-100">
              <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
            </button>
          </nav>
        )}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <div className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8 text-center" role="status">Verifying platform staff access…</div>
        ) : !staff ? (
          <section className="mx-auto mt-20 max-w-xl rounded-lg border bg-white p-8 text-center" role="alert">
            <h1 className="text-xl font-semibold">Platform staff access required</h1>
            <p className="mt-2 text-sm text-slate-600">
              This identity is not authorized for platform administration. Customer workspace access does not grant platform privileges.
            </p>
            <p className="mt-1 text-xs text-slate-500">API response: {statusCode ?? 'unavailable'}</p>
            {errorMessage && <p className="mt-2 text-sm text-red-700">{errorMessage}</p>}
            <button type="button" onClick={() => void refresh()} className="mt-5 rounded-md border px-4 py-2 text-sm">Check access again</button>
          </section>
        ) : children}
        </main>
      </div>
    </div>
  );
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  return (
    <PlatformStaffProvider>
      <ShellContents>{children}</ShellContents>
    </PlatformStaffProvider>
  );
}

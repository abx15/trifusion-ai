'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Activity,
  Briefcase,
  CheckSquare,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react';
import { Button, Spinner } from '@trifusion/ui';
import { useAuth } from '../../contexts/auth-context';
import { WorkspaceProvider, useWorkspace } from '../../contexts/workspace-context';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Briefcase },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { href: '/dashboard/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity },
  { href: '/dashboard/settings', label: 'Workspace settings', icon: Settings },
];

function DashboardFrame({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { workspace, selectWorkspace, selectionError, isValidating } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center" role="status">
        <Spinner size="lg" />
        <span className="sr-only">Loading your workspace</span>
      </div>
    );
  }

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Sign out failed.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/20 lg:flex">
      <aside className="hidden w-64 shrink-0 border-r bg-card p-5 lg:flex lg:flex-col">
        <Link className="mb-8 text-lg font-bold tracking-tight" href="/dashboard">
          TriFusion <span className="text-primary">Workspace</span>
        </Link>
        <WorkspacePicker
          workspaces={user.workspaces}
          selectedId={workspace?.id ?? ''}
          isValidating={isValidating}
          onSelect={selectWorkspace}
        />
        {selectionError && <p className="mt-2 text-xs text-destructive" role="alert">{selectionError}</p>}
        <nav aria-label="Workspace navigation" className="mt-8 space-y-1">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = href === '/dashboard'
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon aria-hidden="true" className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t pt-4">
          <p className="truncate text-sm font-medium">{user.firstName} {user.lastName}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start"
            onClick={() => void handleLogout()}
          >
            <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />
            Sign out
          </Button>
          {logoutError && <p role="alert" className="mt-2 text-xs text-destructive">{logoutError}</p>}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6 lg:hidden">
          <Link href="/dashboard" className="font-semibold">TriFusion</Link>
          <Button
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </header>
        {menuOpen && (
          <div className="fixed inset-0 z-20 bg-background p-5 pt-20 lg:hidden">
            <WorkspacePicker
              workspaces={user.workspaces}
              selectedId={workspace?.id ?? ''}
              isValidating={isValidating}
              onSelect={selectWorkspace}
            />
            {selectionError && <p className="mt-2 text-xs text-destructive" role="alert">{selectionError}</p>}
            <nav aria-label="Mobile workspace navigation" className="mt-6 space-y-1">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => void handleLogout()}
              >
                <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />
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

function WorkspacePicker({
  workspaces,
  selectedId,
  isValidating,
  onSelect,
}: {
  workspaces: Array<{ id: string; name: string; type: string; role: string }>;
  selectedId: string;
  isValidating: boolean;
  onSelect: (id: string) => Promise<void>;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">Workspace</span>
      <span className="relative block">
        <select
          aria-label="Select workspace"
          className="w-full appearance-none rounded-md border bg-background py-2 pl-3 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={selectedId}
          disabled={isValidating || !workspaces.length}
          onChange={(event) => void onSelect(event.target.value).catch(() => undefined)}
        >
          {workspaces.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.role}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
      </span>
    </label>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <DashboardFrame>{children}</DashboardFrame>
    </WorkspaceProvider>
  );
}

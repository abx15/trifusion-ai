'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '@trifusion/ui';
import { Badge } from '@trifusion/ui';
import { Layers, User, LogOut, ArrowRight } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const personalWorkspace = user?.workspaces?.find((w) => w.type === 'PERSONAL') || user?.workspaces?.[0];
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Layers className="h-5 w-5" />
            </span>
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              TriFusion AI
            </span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </Link>
            <a
              href="http://localhost:3001/api/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              API Docs
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {personalWorkspace && (
                <Badge variant="secondary" className="hidden sm:inline-flex text-xs font-normal">
                  {personalWorkspace.name} ({personalWorkspace.role})
                </Badge>
              )}
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.firstName}</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleLogout()}
                title="Sign out"
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              {logoutError && <p role="alert" className="absolute right-4 top-16 rounded-md border bg-background p-2 text-xs text-destructive">{logoutError}</p>}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-1 shadow-sm">
                  Get Started <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

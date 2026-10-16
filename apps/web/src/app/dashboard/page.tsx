'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { apiClient } from '../../lib/api-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Spinner,
} from '@trifusion/ui';
import {
  Briefcase,
  FolderKanban,
  CheckSquare,
  Bot,
  ShieldCheck,
  Activity,
  Layers,
  LogOut,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [apiHealth, setApiHealth] = useState<{
    status: string;
    services?: { database: string };
  } | null>(null);

  useEffect(() => {
    apiClient.health
      .check()
      .then((data) => setApiHealth(data))
      .catch(() => setApiHealth({ status: 'offline' }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Spinner size="lg" className="text-primary mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading your workspace...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-6 space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You must be signed in to view and manage your workspace.
          </CardDescription>
          <div className="pt-2">
            <Link href="/login">
              <Button className="w-full">Sign In to Continue</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const primaryWorkspace =
    user.workspaces?.find((w) => w.type === 'PERSONAL') || user.workspaces?.[0];

  return (
    <div className="flex-1 container px-4 py-8 sm:px-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Personal Workspace:{' '}
            <span className="font-medium text-foreground">
              {primaryWorkspace?.name || 'My Workspace'}
            </span>{' '}
            <Badge variant="outline" className="ml-1 text-xs">
              {primaryWorkspace?.role || 'OWNER'}
            </Badge>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={apiHealth?.status === 'ok' ? 'success' : 'secondary'}
            className="gap-1 py-1 px-3"
          >
            <Activity className="h-3 w-3" />
            API: {apiHealth?.status === 'ok' ? 'Connected' : 'Connecting...'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Identity & Workspace Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Authenticated Session Details
            </CardTitle>
            <CardDescription>
              Verified via NestJS JWT Strategy & PostgreSQL Identity Engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-lg">
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <span className="font-mono font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">User ID</span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Email Status</span>
                <Badge variant={user.isEmailVerified ? 'success' : 'secondary'}>
                  {user.isEmailVerified ? 'Verified' : 'Pending Verification'}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Active Workspaces</span>
                <span className="font-semibold">{user.workspaces?.length || 1} Workspace</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              Phase 1 Milestone
            </CardTitle>
            <CardDescription>
              Application Foundation & Identity is operational
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>✅ NestJS Auth (JWT + Bcrypt) connected</p>
            <p>✅ Automatic Personal Workspace created</p>
            <p>✅ Next.js App Router client connected</p>
            <p>⏳ Phase 2: Workspaces & Invites (Upcoming)</p>
            <p>⏳ Phase 3: Clients, Projects & Tasks (Upcoming)</p>
          </CardContent>
        </Card>
      </div>

      {/* Modules Roadmap Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Workspace Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="p-5">
              <Briefcase className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-base flex items-center justify-between">
                Clients
                <Badge variant="outline" className="text-[10px]">Phase 3</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage clients, contracts, and contacts within this tenant.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="p-5">
              <FolderKanban className="h-8 w-8 text-indigo-500 mb-2" />
              <CardTitle className="text-base flex items-center justify-between">
                Projects
                <Badge variant="outline" className="text-[10px]">Phase 3</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Link client projects, manage dates, and assign team members.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="p-5">
              <CheckSquare className="h-8 w-8 text-emerald-500 mb-2" />
              <CardTitle className="text-base flex items-center justify-between">
                Tasks
                <Badge variant="outline" className="text-[10px]">Phase 3</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Kanban & list task assignment, priority, and progress tracking.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="opacity-90 hover:opacity-100 transition-opacity">
            <CardHeader className="p-5">
              <Bot className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle className="text-base flex items-center justify-between">
                AI Assistant
                <Badge variant="outline" className="text-[10px]">Phase 5</Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Summarize projects, generate weekly reports with tenant boundaries.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}


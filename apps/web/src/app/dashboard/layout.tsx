'use client';

import { WorkspaceProvider } from '../../contexts/workspace-context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}

import type { Metadata } from 'next';
import { WorkspaceProvider } from '../../contexts/workspace-context';

export const metadata: Metadata = {
  title: 'Workspace',
  description: 'Manage clients, projects, tasks, files and AI tools in your private TriFusion AI workspace.',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}

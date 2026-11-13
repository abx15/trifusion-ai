import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Workspaces", description: "Review and manage customer workspaces.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

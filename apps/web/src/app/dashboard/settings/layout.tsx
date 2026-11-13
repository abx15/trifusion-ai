import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Workspace settings", description: "Manage your workspace preferences and settings.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

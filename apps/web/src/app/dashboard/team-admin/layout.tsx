import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Team administration", description: "Manage workspace members and team operations.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

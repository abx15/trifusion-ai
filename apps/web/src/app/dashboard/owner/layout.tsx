import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Owner dashboard", description: "Manage your business workspace and operations.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

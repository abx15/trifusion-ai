import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Platform users", description: "Manage platform user accounts.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Superadmin console", description: "Manage platform-wide settings and privileged operations.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

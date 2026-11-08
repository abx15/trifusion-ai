import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Audit logs", description: "Review security and administrative audit events.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Projects", description: "Plan and track projects across your workspace.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

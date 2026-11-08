import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Tasks", description: "Track tasks, assignments and delivery progress.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

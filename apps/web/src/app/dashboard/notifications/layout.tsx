import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Notifications", description: "Review your workspace notifications.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Platform metrics", description: "Review platform usage and operational metrics.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

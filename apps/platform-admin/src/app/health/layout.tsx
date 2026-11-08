import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Service health", description: "Monitor configured platform service health.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

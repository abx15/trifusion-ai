import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Business analytics", description: "Review platform usage, performance and business analytics.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

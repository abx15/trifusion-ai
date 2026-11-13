import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Analytics", description: "Review platform analytics and operational insights.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

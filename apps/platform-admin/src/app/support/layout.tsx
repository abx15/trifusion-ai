import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Support workspace", description: "Review and resolve platform support requests.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

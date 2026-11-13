import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Platform administration", description: "Manage platform operations and administration.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

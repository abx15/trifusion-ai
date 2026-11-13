import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Clients", description: "Manage client records and relationships in your workspace.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

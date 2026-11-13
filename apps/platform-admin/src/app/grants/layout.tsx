import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Access grants", description: "Manage platform staff access grants.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

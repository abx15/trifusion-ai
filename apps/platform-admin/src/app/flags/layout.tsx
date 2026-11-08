import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Feature flags", description: "Manage platform feature availability.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

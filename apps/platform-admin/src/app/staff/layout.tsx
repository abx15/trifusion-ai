import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Platform staff", description: "Manage authorized platform staff accounts and roles.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

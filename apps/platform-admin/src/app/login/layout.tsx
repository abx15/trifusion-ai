import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Staff sign in", description: "Secure sign-in for authorized TriFusion AI platform staff.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

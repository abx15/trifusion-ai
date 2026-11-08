import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Member dashboard", description: "View assigned work and team activity.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

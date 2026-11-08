import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Files", description: "Access and manage files stored in your workspace.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

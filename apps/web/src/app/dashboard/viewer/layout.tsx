import type { Metadata } from 'next';
export const metadata: Metadata = { title: "Workspace overview", description: "View workspace information and shared progress.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

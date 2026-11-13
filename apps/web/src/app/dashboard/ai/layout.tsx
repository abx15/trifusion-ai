import type { Metadata } from 'next';
export const metadata: Metadata = { title: "AI assistant", description: "Use AI tools and contextual assistance in your workspace.", robots: { index: false, follow: false } };
export default function PageLayout({ children }: { children: React.ReactNode }) { return children; }

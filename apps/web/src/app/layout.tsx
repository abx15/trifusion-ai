import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '../components/providers';
import { SiteChrome } from '../components/layout/site-chrome';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: {
    default: 'TriFusion AI | Intelligent Business Workspace',
    template: '%s | TriFusion AI',
  },
  description: 'Bring projects, tasks, clients, team collaboration and AI assistance into one secure business workspace with TriFusion AI.',
  applicationName: 'TriFusion AI',
  keywords: ['AI business workspace', 'project management', 'team collaboration', 'multi-tenant workspace', 'AI assistant'],
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: {
    type: 'website',
    title: 'TriFusion AI | Intelligent Business Workspace',
    description: 'Projects, clients, collaboration and AI assistance in one secure workspace.',
    siteName: 'TriFusion AI',
  },
  twitter: {
    card: 'summary',
    title: 'TriFusion AI | Intelligent Business Workspace',
    description: 'Projects, clients, collaboration and AI assistance in one secure workspace.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#003F5C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased font-sans">
        <Providers><SiteChrome>{children}</SiteChrome></Providers>
      </body>
    </html>
  );
}

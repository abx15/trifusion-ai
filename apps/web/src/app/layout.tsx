import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '../components/providers';
import { SiteChrome } from '../components/layout/site-chrome';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TriFusion AI — Business Workspace',
  description:
    'AI-powered Business Workspace for individuals, freelancers, digital agencies, and IT/service companies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col bg-background text-foreground antialiased`}>
        <Providers>
          <SiteChrome>{children}</SiteChrome>
        </Providers>
      </body>
    </html>
  );
}

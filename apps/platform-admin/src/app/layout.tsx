import type { Metadata, Viewport } from 'next';
import './globals.css';
import { TrifusionProvider } from '@trifusion/ui';
import { PlatformShell } from '../components/platform-shell';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: { default: 'Platform Administration', template: '%s | TriFusion AI Admin' },
  description: 'Secure TriFusion AI platform administration and operations portal.',
  applicationName: 'TriFusion AI Admin',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#003F5C',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        <TrifusionProvider><PlatformShell>{children}</PlatformShell></TrifusionProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { TrifusionProvider } from '@trifusion/ui';
import { PlatformShell } from '../components/platform-shell';

export const metadata: Metadata = {
  title: 'TriFusion AI - Platform Admin',
  description: 'TriFusion AI Platform Administration and Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        <TrifusionProvider>
          <PlatformShell>{children}</PlatformShell>
        </TrifusionProvider>
      </body>
    </html>
  );
}

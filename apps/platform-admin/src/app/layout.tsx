import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PlatformShell } from '../components/platform-shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TriFusion AI - Admin Panel',
  description: 'TriFusion AI Platform Administration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}><PlatformShell>{children}</PlatformShell></body>
    </html>
  );
}

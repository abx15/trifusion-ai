'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkspaceRoute = pathname.startsWith('/dashboard');

  return (
    <>
      {!isWorkspaceRoute && <Navbar />}
      <main className="flex-1 flex flex-col">{children}</main>
      {!isWorkspaceRoute && <Footer />}
    </>
  );
}

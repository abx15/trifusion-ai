'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type PlatformRole =
  | 'SUPERADMIN'
  | 'PLATFORM_ADMIN'
  | 'ANALYST'
  | 'SUPPORT_AGENT';

export interface PlatformStaff {
  id: string;
  role: PlatformRole;
}

interface PlatformStaffState {
  staff: PlatformStaff | null;
  isLoading: boolean;
  statusCode: number | null;
  errorMessage: string | null;
  refresh: () => Promise<void>;
}

const PlatformStaffContext = createContext<PlatformStaffState | undefined>(undefined);

async function loadStaff(): Promise<{ staff: PlatformStaff | null; statusCode: number | null }> {
  const response = await fetch('/api/backend/platform/staff/me', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return { staff: null, statusCode: response.status };

  const value: unknown = await response.json();
  if (
    !value ||
    typeof value !== 'object' ||
    !('id' in value) ||
    !('role' in value) ||
    typeof value.id !== 'string' ||
    !['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST', 'SUPPORT_AGENT'].includes(String(value.role))
  ) {
    throw new Error('Platform staff API returned an invalid identity');
  }
  return { staff: { id: value.id, role: value.role as PlatformRole }, statusCode: null };
}

export function PlatformStaffProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [staff, setStaff] = useState<PlatformStaff | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(pathname !== '/login');

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadStaff();
      setStaff(result.staff);
      setStatusCode(result.statusCode);
      setErrorMessage(null);
    } catch (error) {
      setStaff(null);
      setStatusCode(502);
      setErrorMessage(error instanceof Error ? error.message : 'Platform identity could not be verified.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pathname === '/login') {
      setIsLoading(false);
      return;
    }
    void refresh();
  }, [pathname, refresh]);

  return (
    <PlatformStaffContext.Provider value={{ staff, isLoading, statusCode, errorMessage, refresh }}>
      {children}
    </PlatformStaffContext.Provider>
  );
}

export function usePlatformStaff() {
  const context = useContext(PlatformStaffContext);
  if (!context) throw new Error('usePlatformStaff must be used within PlatformStaffProvider');
  return context;
}

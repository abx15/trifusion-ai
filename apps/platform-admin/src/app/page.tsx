'use client';

import { useEffect, useState } from 'react';
import { usePlatformStaff } from '../contexts/platform-staff-context';
import { useRouter } from 'next/navigation';
import { Spinner } from '@trifusion/ui';

function getPlatformDashboardPath(role: string): string {
  switch (role) {
    case 'SUPERADMIN': return '/superadmin';
    case 'PLATFORM_ADMIN': return '/admin';
    case 'ANALYST': return '/analyst';
    case 'SUPPORT_AGENT': return '/support';
    default: return '/support';
  }
}

export default function PlatformDashboardPage() {
  const { staff, isLoading } = usePlatformStaff();
  const router = useRouter();
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    if (isLoading || redirected) return;
    if (!staff) {
      router.replace('/login');
      return;
    }
    const target = getPlatformDashboardPath(staff.role);
    setRedirected(true);
    router.replace(target);
  }, [staff, isLoading, router, redirected]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Spinner size="large" />
        <span className="ml-2">Verifying platform staff access…</span>
      </div>
    );
  }

  return null;
}

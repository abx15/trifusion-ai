'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '../../contexts/workspace-context';
import { CUSTOMER_ROLE_CONFIGS, getCustomerDashboardPath } from '@trifusion/contracts';
import { Spinner } from '@trifusion/ui';

export default function DashboardPage() {
  const { workspace, role } = useWorkspace();
  const router = useRouter();
  const customerRole = role as 'OWNER' | 'TEAM_ADMIN' | 'MEMBER' | 'VIEWER' | null;
  const config = customerRole ? CUSTOMER_ROLE_CONFIGS[customerRole] : CUSTOMER_ROLE_CONFIGS.VIEWER;

  useEffect(() => {
    if (!workspace) return;
    router.replace(getCustomerDashboardPath(customerRole ?? 'VIEWER'));
  }, [workspace, customerRole, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <Spinner size="large" />
      <span className="ml-2">Opening your {config.role} dashboard…</span>
    </div>
  );
}

'use client';

import { SyncStatus } from '@/lib/types/database';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { SyncButton } from './SyncButton';

interface DashboardHeaderProps {
  syncStatus: SyncStatus;
}

export function DashboardHeader({ syncStatus }: DashboardHeaderProps) {
  const lastSync = syncStatus.lastIncrementalSync
    ? new Date(syncStatus.lastIncrementalSync)
    : null;

  return (
    <header className="border-b border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Up Bank Dashboard</h1>
            {lastSync && (
              <p className="text-sm text-muted-foreground mt-1">
                Last synced {formatDistanceToNow(lastSync, { addSuffix: true })}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Transactions
              </Link>
            </nav>
            <SyncButton />
          </div>
        </div>
      </div>
    </header>
  );
}

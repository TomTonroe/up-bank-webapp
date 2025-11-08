'use client';

import { SyncStatus } from '@/lib/types/database';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SyncButton } from './SyncButton';

interface DashboardHeaderProps {
  syncStatus: SyncStatus;
}

export function DashboardHeader({ syncStatus }: DashboardHeaderProps) {
  const lastSync = syncStatus.lastIncrementalSync
    ? new Date(syncStatus.lastIncrementalSync)
    : null;
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/transactions', label: 'Transactions' },
  ];

  return (
    <header className="relative z-30 border-b border-white/5 bg-background/60 backdrop-blur-xl shadow-[0_12px_32px_-24px_rgba(10,16,35,0.9)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/55 before:to-transparent supports-[backdrop-filter]:bg-background/35">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Up Bank Intelligence
          </h1>
          {lastSync && (
            <p className="mt-1 text-sm text-muted-foreground/80">
              Last synced {formatDistanceToNow(lastSync, { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === link.href
                  : pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300',
                    'text-muted-foreground/80 hover:text-foreground focus-visible:text-foreground',
                    'hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none',
                    'before:absolute before:inset-x-2 before:bottom-1 before:h-[2px] before:origin-left before:scale-x-0 before:rounded-full before:bg-gradient-to-r before:from-primary before:to-secondary before:transition-transform before:duration-300 group-hover:before:scale-x-100',
                    isActive && 'text-foreground before:scale-x-100'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <SyncButton />
        </div>
      </div>
    </header>
  );
}

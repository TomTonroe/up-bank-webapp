import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DbAccount } from '@/lib/types/database';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface AccountsOverviewProps {
  accounts: DbAccount[];
}

function formatCurrency(valueInBaseUnits: number): string {
  return `$${(valueInBaseUnits / 100).toFixed(2)}`;
}

function getAccountTypeStyles(type: string): string {
  switch (type) {
    case 'SAVER':
      return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
    case 'TRANSACTIONAL':
      return 'border-sky-400/20 bg-sky-500/10 text-sky-200';
    case 'HOME_LOAN':
      return 'border-indigo-400/20 bg-indigo-500/10 text-indigo-200';
    default:
      return 'border-white/15 bg-white/10 text-foreground/90';
  }
}

export function AccountsOverview({ accounts }: AccountsOverviewProps) {
  return (
    <Card>
      <CardHeader className="relative z-10 flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
            Accounts
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/75">
            View and manage all of your Up balances
          </CardDescription>
        </div>
        <Link
          href="/accounts"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-primary transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary/80"
        >
          View all
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </CardHeader>
      <CardContent className="relative z-10 space-y-4">
        {accounts.map((account) => (
          <Link
            key={account.id}
            href={`/accounts/${account.id}`}
            className="group relative block overflow-hidden rounded-xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_25px_60px_-45px_rgba(10,16,35,0.85)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:bg-white/10"
          >
            <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:bg-gradient-to-br group-hover:from-primary/20 group-hover:via-transparent group-hover:to-transparent" />
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      'border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                      getAccountTypeStyles(account.account_type)
                    )}
                  >
                    {account.account_type.replace('_', ' ')}
                  </Badge>
                  {account.ownership_type === 'JOINT' && (
                    <Badge className="border-white/15 bg-white/10 text-muted-foreground/80">
                      Joint
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {account.display_name}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(account.balance_value_in_base_units)}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/70">
                  {account.balance_currency}
                </p>
              </div>
            </div>
          </Link>
        ))}

        {accounts.length === 0 && (
          <p className="rounded-lg border border-white/5 bg-white/5 py-8 text-center text-sm text-muted-foreground/80">
            No accounts found just yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

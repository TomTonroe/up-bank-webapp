import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DbTransaction } from '@/lib/types/database';
import { ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface RecentTransactionsProps {
  transactions: DbTransaction[];
}

function formatCurrency(valueInBaseUnits: number): string {
  const value = Math.abs(valueInBaseUnits) / 100;
  const sign = valueInBaseUnits < 0 ? '-' : '+';
  return `${sign}$${value.toFixed(2)}`;
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="relative z-10 flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
          <CardDescription className="text-sm text-muted-foreground/75">
            Your latest movement in real-time
          </CardDescription>
        </div>
        <Link
          href="/transactions"
          className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-primary transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary/80"
        >
          View all
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </CardHeader>
      <CardContent className="relative z-10 space-y-3">
        {transactions.map((transaction) => {
          const isDebit = transaction.amount_value_in_base_units < 0;

          return (
            <div
              key={transaction.id}
              className="group relative flex items-start gap-4 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-4 py-4 shadow-[0_24px_50px_-40px_rgba(12,20,35,0.85)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_30px_70px_-45px_rgba(32,64,112,0.7)]"
            >
              <span
                className={cn(
                  'absolute left-0 top-2 bottom-2 w-1 rounded-full transition-all duration-300 group-hover:scale-y-105',
                  isDebit
                    ? 'from-rose-500 via-rose-400/70 to-rose-300/60 bg-gradient-to-b'
                    : 'from-emerald-500 via-emerald-400/70 to-emerald-300/60 bg-gradient-to-b'
                )}
              />
              <div className="relative z-10 flex flex-1 flex-col gap-1">
                <p className="truncate text-sm font-medium tracking-wide text-foreground">
                  {transaction.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/70">
                  <span>
                    {formatDistanceToNow(new Date(transaction.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {transaction.category_name && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="truncate">{transaction.category_name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="relative z-10 text-right">
                <p
                  className={cn(
                    'text-lg font-semibold tracking-tight',
                    isDebit ? 'text-rose-200' : 'text-emerald-200'
                  )}
                >
                  {formatCurrency(transaction.amount_value_in_base_units)}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground/60">
                  {isDebit ? 'Outflow' : 'Inflow'}
                </p>
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <p className="rounded-lg border border-white/5 bg-white/5 py-10 text-center text-sm text-muted-foreground/80">
            No transactions found for this period.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

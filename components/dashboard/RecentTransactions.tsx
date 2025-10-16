import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DbTransaction } from '@/lib/types/database';
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest transactions</CardDescription>
          </div>
          <Link
            href="/transactions"
            className="text-sm text-primary hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  {transaction.category_name && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category_name}
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right ml-4">
                <p
                  className={`text-lg font-semibold ${
                    transaction.amount_value_in_base_units < 0
                      ? 'text-destructive'
                      : 'text-success'
                  }`}
                >
                  {formatCurrency(transaction.amount_value_in_base_units)}
                </p>
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No transactions found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DbAccount } from '@/lib/types/database';
import Link from 'next/link';

interface AccountsOverviewProps {
  accounts: DbAccount[];
}

function formatCurrency(valueInBaseUnits: number): string {
  return `$${(valueInBaseUnits / 100).toFixed(2)}`;
}

function getAccountTypeColor(type: string): string {
  switch (type) {
    case 'SAVER':
      return 'bg-success/15 text-success';
    case 'TRANSACTIONAL':
      return 'bg-primary/15 text-primary';
    case 'HOME_LOAN':
      return 'bg-info/15 text-info';
    default:
      return 'bg-muted text-foreground';
  }
}

export function AccountsOverview({ accounts }: AccountsOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>View all your Up Bank accounts</CardDescription>
          </div>
          <Link
            href="/accounts"
            className="text-sm text-primary hover:underline font-medium"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {accounts.map((account) => (
            <Link
              key={account.id}
              href={`/accounts/${account.id}`}
              className="block p-4 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getAccountTypeColor(account.account_type)}>
                      {account.account_type}
                    </Badge>
                    {account.ownership_type === 'JOINT' && (
                      <Badge variant="outline">JOINT</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold">
                    {account.display_name}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(account.balance_value_in_base_units)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {account.balance_currency}
                  </p>
                </div>
              </div>
            </Link>
          ))}

          {accounts.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No accounts found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

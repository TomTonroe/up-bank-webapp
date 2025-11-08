import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  totalBalance: number;
  thisMonthSpending: number;
  thisMonthIncome: number;
  totalTransactions: number;
}

function formatCurrency(valueInBaseUnits: number): string {
  return `$${(valueInBaseUnits / 100).toFixed(2)}`;
}

export function StatsCards({
  totalBalance,
  thisMonthSpending,
  thisMonthIncome,
  totalTransactions,
}: StatsCardsProps) {
  const statCards = [
    {
      key: 'total-balance',
      title: 'Total Balance',
      value: formatCurrency(totalBalance),
      description: 'Across all accounts',
      icon: DollarSign,
      iconClass: 'bg-indigo-400/15 text-indigo-100',
      valueClass: 'text-foreground',
    },
    {
      key: 'spending',
      title: 'This Month Spending',
      value: formatCurrency(thisMonthSpending),
      description: 'Expenses this month',
      icon: TrendingDown,
      iconClass: 'bg-rose-400/15 text-rose-100',
      valueClass: 'text-rose-200',
    },
    {
      key: 'income',
      title: 'This Month Income',
      value: formatCurrency(thisMonthIncome),
      description: 'Inbound cashflow this month',
      icon: TrendingUp,
      iconClass: 'bg-emerald-400/15 text-emerald-100',
      valueClass: 'text-emerald-200',
    },
    {
      key: 'transactions',
      title: 'Transactions',
      value: totalTransactions.toString(),
      description: 'Transactions recorded this month',
      icon: Receipt,
      iconClass: 'bg-sky-400/15 text-sky-100',
      valueClass: 'text-sky-100',
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.key} className="relative h-full">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground/70">
                  {card.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground/70">
                  {card.description}
                </CardDescription>
              </div>
              <span
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl border border-white/10 backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]',
                  card.iconClass
                )}
              >
                <Icon className="size-5" />
              </span>
            </CardHeader>
            <CardContent>
              <p className={cn('text-3xl font-semibold tracking-tight drop-shadow-[0_0_8px_rgba(15,23,42,0.35)]', card.valueClass)}>
                {card.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

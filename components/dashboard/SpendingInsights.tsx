'use client';

import { useMemo } from 'react';
import { differenceInCalendarDays, format, startOfDay, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DbTransaction } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/chart-colors';
import {
  Activity,
  CalendarRange,
  LineChart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface SpendingInsightsProps {
  transactions: DbTransaction[];
}

type InsightMetric = {
  key: string;
  title: string;
  value: string;
  annotation?: string;
  delta?: {
    label: string;
    direction: 'up' | 'down';
  };
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export function SpendingInsights({ transactions }: SpendingInsightsProps) {
  const metrics = useMemo<{
    items: InsightMetric[];
    lastExpenseDaysAgo: number | null;
  }>(() => {
    if (!transactions.length) {
      return { items: [], lastExpenseDaysAgo: null };
    }

    const now = new Date();
    const expenses = transactions.filter(
      (tx) => tx.amount_value_in_base_units < 0
    );

    const sumAbsolute = (list: typeof expenses) =>
      list.reduce(
        (sum, tx) => sum + Math.abs(tx.amount_value_in_base_units),
        0
      );

    const last7Start = subDays(now, 7);
    const prev7Start = subDays(now, 14);

    const last7Expenses = expenses.filter(
      (tx) => new Date(tx.created_at) >= last7Start
    );
    const prev7Expenses = expenses.filter((tx) => {
      const date = new Date(tx.created_at);
      return date >= prev7Start && date < last7Start;
    });

    const last7Total = sumAbsolute(last7Expenses);
    const prev7Total = sumAbsolute(prev7Expenses);

    const spendDelta =
      prev7Total === 0
        ? null
        : ((last7Total - prev7Total) / prev7Total) * 100;

    const last30Start = subDays(now, 30);
    const last30Expenses = expenses.filter(
      (tx) => new Date(tx.created_at) >= last30Start
    );

    const categoryMap = new Map<
      string,
      { amount: number; count: number }
    >();
    last30Expenses.forEach((tx) => {
      const category = tx.category_name ?? 'Uncategorised';
      const entry = categoryMap.get(category) ?? { amount: 0, count: 0 };
      entry.amount += Math.abs(tx.amount_value_in_base_units);
      entry.count += 1;
      categoryMap.set(category, entry);
    });

    const topCategory = Array.from(categoryMap.entries())
      .map(([name, stats]) => ({
        name,
        amount: stats.amount,
        count: stats.count,
      }))
      .sort((a, b) => b.amount - a.amount)[0];

    const dailyTotals = new Map<number, number>();
    last30Expenses.forEach((tx) => {
      const dayStart = startOfDay(new Date(tx.created_at)).getTime();
      dailyTotals.set(
        dayStart,
        (dailyTotals.get(dayStart) ?? 0) + Math.abs(tx.amount_value_in_base_units)
      );
    });

    const rollingDailyTotals: number[] = Array.from({ length: 30 }).map(
      (_, index) => {
        const dayStart = startOfDay(subDays(now, index)).getTime();
        return dailyTotals.get(dayStart) ?? 0;
      }
    );

    const heaviestDayEntry = Array.from(dailyTotals.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    const averageDaily =
      rollingDailyTotals.reduce((sum, value) => sum + value, 0) /
      rollingDailyTotals.length;

    const variance =
      rollingDailyTotals.reduce(
        (sum, value) => sum + Math.pow(value - averageDaily, 2),
        0
      ) / rollingDailyTotals.length;

    const volatility = Math.sqrt(variance);

    const mostRecentExpense = expenses.reduce<Date | null>((latest, tx) => {
      const txDate = new Date(tx.created_at);
      if (!latest || txDate > latest) return txDate;
      return latest;
    }, null);

    const lastExpenseDaysAgo = mostRecentExpense
      ? differenceInCalendarDays(now, mostRecentExpense)
      : null;

    const insightMetrics: InsightMetric[] = [
      {
        key: 'seven-day',
        title: '7-day spend',
        value: formatCurrency(last7Total),
        annotation: 'vs prior 7 days',
        delta: spendDelta
          ? {
              label: `${Math.abs(spendDelta).toFixed(1)}% ${
                spendDelta > 0 ? 'higher' : 'lower'
              }`,
              direction: spendDelta > 0 ? 'up' : 'down',
            }
          : undefined,
        icon: spendDelta && spendDelta > 0 ? TrendingUp : TrendingDown,
      },
      {
        key: 'top-category',
        title: 'Top category (30d)',
        value: topCategory ? topCategory.name : 'No spend yet',
        annotation: topCategory
          ? `${formatCurrency(topCategory.amount)} · ${topCategory.count} txns`
          : undefined,
        icon: Activity,
      },
      {
        key: 'heaviest-day',
        title: 'Peak spend day',
        value: heaviestDayEntry
          ? format(new Date(heaviestDayEntry[0]), 'EEE dd MMM')
          : 'No data',
        annotation: heaviestDayEntry
          ? formatCurrency(heaviestDayEntry[1])
          : undefined,
        icon: CalendarRange,
      },
      {
        key: 'volatility',
        title: 'Spend volatility',
        value: formatCurrency(Math.round(volatility)),
        annotation: `${formatCurrency(Math.round(averageDaily))} average daily`,
        icon: LineChart,
      },
    ];

    return {
      items: insightMetrics,
      lastExpenseDaysAgo,
    };
  }, [transactions]);

  if (metrics.items.length === 0) {
    return null;
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col gap-2 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Spending Insights
          </CardTitle>
          <Badge className="bg-primary/15 text-primary-foreground">
            30 day view
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground/75">
          Highlights from your recent spending activity
        </p>
      </CardHeader>
      <CardContent className="mt-6 space-y-4">
        {metrics.items.map((metric) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.key}
              className="group flex items-center justify-between gap-4 rounded-xl border border-white/8 bg-white/5 px-4 py-3 transition-all duration-200 hover:border-white/20 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                    {metric.title}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {metric.value}
                  </p>
                  {metric.annotation && (
                    <p className="text-xs text-muted-foreground/70">
                      {metric.annotation}
                    </p>
                  )}
                </div>
              </div>

              {metric.delta && (
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    metric.delta.direction === 'up'
                      ? 'text-rose-200'
                      : 'text-emerald-200'
                  )}
                >
                  {metric.delta.label}
                </div>
              )}
            </div>
          );
        })}

        {metrics.lastExpenseDaysAgo !== null && (
          <p className="text-xs text-muted-foreground/60">
            Last money out {metrics.lastExpenseDaysAgo === 0
              ? 'today'
              : `${metrics.lastExpenseDaysAgo} day${
                  metrics.lastExpenseDaysAgo === 1 ? '' : 's'
                } ago`}
            .
          </p>
        )}
      </CardContent>
    </Card>
  );
}

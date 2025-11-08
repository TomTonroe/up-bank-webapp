'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { DbTransaction } from '@/lib/types/database';
import { CHART_COLORS, formatCurrency } from '@/lib/utils/chart-colors';
import {
  addDays,
  format,
  startOfWeek,
  subWeeks,
} from 'date-fns';

interface WeeklySpendingPulseProps {
  transactions: DbTransaction[];
  weeks?: number;
}

interface WeeklyPoint {
  week: string;
  income: number;
  expenses: number;
  net: number;
  transactionCount: number;
  rangeLabel: string;
}

export function WeeklySpendingPulse({
  transactions,
  weeks = 12,
}: WeeklySpendingPulseProps) {
  const chartData = useMemo<WeeklyPoint[]>(() => {
    if (!transactions.length) return [];

    const now = new Date();
    const weekStarts = Array.from({ length: weeks }).map((_, index) =>
      startOfWeek(subWeeks(now, weeks - 1 - index), { weekStartsOn: 1 })
    );

    const buckets = new Map<number, WeeklyPoint>();

    weekStarts.forEach((start) => {
      const ts = start.getTime();
      buckets.set(ts, {
        week: format(start, 'dd MMM'),
        income: 0,
        expenses: 0,
        net: 0,
        transactionCount: 0,
        rangeLabel: `${format(start, 'MMM d')} – ${format(
          addDays(start, 6),
          'MMM d'
        )}`,
      });
    });

    transactions.forEach((tx) => {
      const txDate = new Date(tx.created_at);
      const bucketStart = startOfWeek(txDate, { weekStartsOn: 1 });
      const key = bucketStart.getTime();

      if (!buckets.has(key)) {
        // Skip data outside our rolling window
        return;
      }

      const bucket = buckets.get(key)!;
      const amount = tx.amount_value_in_base_units;

      if (amount >= 0) {
        bucket.income += amount;
      } else {
        bucket.expenses += Math.abs(amount);
      }

      bucket.transactionCount += 1;
      bucket.net = bucket.income - bucket.expenses;
    });

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, value]) => ({
        ...value,
        income: value.income / 100,
        expenses: value.expenses / 100,
        net: value.net / 100,
      }));
  }, [transactions, weeks]);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const data = payload[0]?.payload as WeeklyPoint | undefined;

    if (!data) {
      return null;
    }

    return (
      <div className="rounded-lg border border-white/10 bg-card/90 p-3 shadow-xl backdrop-blur">
        <p className="text-sm font-semibold text-foreground">
          {data.rangeLabel}
        </p>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground/80">Income</span>
            <span className="font-medium text-emerald-200">
              {formatCurrency(data.income * 100)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground/80">Expenses</span>
            <span className="font-medium text-rose-200">
              {formatCurrency(data.expenses * 100)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6 border-t border-white/5 pt-2">
            <span className="text-muted-foreground/80">Net</span>
            <span
              className="font-semibold"
              style={{
                color:
                  data.net >= 0 ? CHART_COLORS.income : CHART_COLORS.expenses,
              }}
            >
              {formatCurrency(data.net * 100)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground/80">Transactions</span>
            <span className="font-medium text-foreground/90">
              {data.transactionCount}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ChartCard
      title="Weekly Spending Pulse"
      description="Track rolling weekly income, outflow, and net position"
    >
      {chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          Not enough data to build a weekly trend yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="weeklyIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="weeklyExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis
              dataKey="week"
              stroke="rgba(148,163,184,0.6)"
              tick={{ fill: 'rgba(148,163,184,0.7)' }}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              stroke="rgba(148,163,184,0.6)"
              tick={{ fill: 'rgba(148,163,184,0.7)' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(129,140,248,0.25)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: '13px', color: 'rgba(148,163,184,0.8)' }} />
            <Area
              type="monotone"
              dataKey="income"
              stroke={CHART_COLORS.income}
              strokeWidth={2}
              fill="url(#weeklyIncome)"
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={CHART_COLORS.expenses}
              strokeWidth={2}
              fill="url(#weeklyExpense)"
              name="Expenses"
            />
            <Area
              type="monotone"
              dataKey="net"
              stroke={CHART_COLORS.balance}
              strokeWidth={2}
              fillOpacity={0}
              name="Net"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

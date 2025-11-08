'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector, getDaysFromTimeRange } from './TimeRangeSelector';
import { TimeRange } from '@/lib/types/analytics';
import { MerchantDataWithDate } from '@/lib/db/manager';
import { CHART_COLORS, formatCurrency } from '@/lib/utils/chart-colors';
import { subDays } from 'date-fns';

interface TopMerchantsProps {
  data: MerchantDataWithDate[];
  defaultRange?: TimeRange;
}

type MerchantDatum = {
  merchant: string;
  amount: number;
  transactionCount: number;
  averageTransaction: number;
};

export function TopMerchants({ data, defaultRange = '30d' }: TopMerchantsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  // Filter and aggregate data based on time range
  const chartData: MerchantDatum[] = useMemo(() => {
    const days = getDaysFromTimeRange(timeRange);
    const cutoffDate = days ? subDays(new Date(), days) : null;

    // Filter transactions by date
    const filteredData = cutoffDate
      ? data.filter((item) => new Date(item.created_at) >= cutoffDate)
      : data;

    // Aggregate by merchant
    const merchantMap = new Map<string, { amount: number; count: number }>();
    filteredData.forEach((item) => {
      const existing = merchantMap.get(item.merchant) || { amount: 0, count: 0 };
      merchantMap.set(item.merchant, {
        amount: existing.amount + item.amount,
        count: existing.count + 1,
      });
    });

    // Convert to chart format and get top 10
    const dataset: MerchantDatum[] = Array.from(merchantMap.entries())
      .map(([merchant, { amount, count }]) => ({
        merchant,
        amount: amount / 100,
        transactionCount: count,
        averageTransaction: amount / count / 100,
      }));

    return dataset.sort((a, b) => b.amount - a.amount).slice(0, 10);
  }, [data, timeRange]);

  // Truncate long merchant names
  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const datum = payload[0]?.payload as MerchantDatum | undefined;

    if (!datum) {
      return null;
    }

    return (
      <div className="max-w-xs rounded-lg border bg-card p-3 shadow-md">
        <p className="mb-2 break-words text-sm font-semibold">{datum.merchant}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Total Spent:</span>
            <span className="font-medium">{formatCurrency(datum.amount * 100)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Transactions:</span>
            <span className="font-medium">{datum.transactionCount}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Average:</span>
            <span className="font-medium">{formatCurrency(datum.averageTransaction * 100)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ChartCard
      title="Top Merchants"
      description="Where you spend the most"
      action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No merchant data available for this time period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 100, bottom: 0 }}
            >
              <defs>
                <linearGradient id="merchantBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={CHART_COLORS.expenses} stopOpacity={0.3} />
                  <stop offset="50%" stopColor={CHART_COLORS.expenses} stopOpacity={0.65} />
                  <stop offset="100%" stopColor={CHART_COLORS.balance} stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis
                type="number"
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="rgba(148,163,184,0.6)"
                tick={{ fill: 'rgba(148,163,184,0.7)' }}
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="merchant"
                tickFormatter={(value) => truncateName(value, 20)}
                stroke="rgba(148,163,184,0.6)"
                tick={{ fill: 'rgba(148,163,184,0.8)' }}
                fontSize={12}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(129,140,248,0.08)' }} />
              <Bar
                dataKey="amount"
                fill="url(#merchantBar)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Merchant list with details */}
          <div className="mt-4 space-y-2">
            {chartData.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 p-2 transition-all duration-200 hover:border-white/15 hover:bg-white/10"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-foreground/80">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{item.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.transactionCount} {item.transactionCount === 1 ? 'transaction' : 'transactions'}
                    </p>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-sm font-semibold">{formatCurrency(item.amount * 100)}</p>
                  <p className="text-xs text-muted-foreground">
                    avg {formatCurrency(item.averageTransaction * 100)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ChartCard>
  );
}

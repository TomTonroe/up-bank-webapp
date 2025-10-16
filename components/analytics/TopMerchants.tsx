'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

export function TopMerchants({ data, defaultRange = '30d' }: TopMerchantsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  // Filter and aggregate data based on time range
  const chartData = useMemo(() => {
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
    return Array.from(merchantMap.entries())
      .map(([merchant, { amount, count }]) => ({
        merchant,
        amount: amount / 100,
        transactionCount: count,
        averageTransaction: amount / count / 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [data, timeRange]);

  // Truncate long merchant names
  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-card p-3 shadow-md max-w-xs">
          <p className="text-sm font-semibold mb-2 break-words">{data.merchant}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Total Spent:</span>
              <span className="font-medium">{formatCurrency(data.amount * 100)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Transactions:</span>
              <span className="font-medium">{data.transactionCount}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Average:</span>
              <span className="font-medium">{formatCurrency(data.averageTransaction * 100)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
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
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="merchant"
                tickFormatter={(value) => truncateName(value, 20)}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="amount"
                fill={CHART_COLORS.expenses}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Merchant list with details */}
          <div className="mt-4 space-y-2">
            {chartData.slice(0, 5).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium">
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

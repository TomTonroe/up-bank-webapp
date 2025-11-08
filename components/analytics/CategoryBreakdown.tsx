'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, TooltipProps } from 'recharts';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector, getDaysFromTimeRange } from './TimeRangeSelector';
import { TimeRange } from '@/lib/types/analytics';
import { CategorySpendingDataWithDate } from '@/lib/db/manager';
import { getCategoryColor, formatCurrency } from '@/lib/utils/chart-colors';
import { subDays } from 'date-fns';
import type { PieLabelRenderProps } from 'recharts';

interface CategoryBreakdownProps {
  data: CategorySpendingDataWithDate[];
  defaultRange?: TimeRange;
}

type CategoryDatum = {
  name: string;
  value: number;
  percentage: number;
  transactionCount: number;
};

export function CategoryBreakdown({ data, defaultRange = '30d' }: CategoryBreakdownProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  // Filter and aggregate data based on time range
  const chartData: CategoryDatum[] = useMemo(() => {
    const days = getDaysFromTimeRange(timeRange);
    const cutoffDate = days ? subDays(new Date(), days) : null;

    // Filter transactions by date
    const filteredData = cutoffDate
      ? data.filter((item) => new Date(item.created_at) >= cutoffDate)
      : data;

    // Aggregate by category
    const categoryMap = new Map<string, { amount: number; count: number }>();
    filteredData.forEach((item) => {
      const existing = categoryMap.get(item.category) || { amount: 0, count: 0 };
      categoryMap.set(item.category, {
        amount: existing.amount + item.amount,
        count: existing.count + 1,
      });
    });

    // Calculate total and convert to chart format
    const totalSpending = Array.from(categoryMap.values()).reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const dataset: CategoryDatum[] = Array.from(categoryMap.entries()).map(
      ([category, { amount, count }]) => ({
        name: category,
        value: amount / 100, // Convert to dollars
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
        transactionCount: count,
      })
    );

    return dataset.sort((a, b) => b.value - a.value);
  }, [data, timeRange]);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const datum = data?.payload as CategoryDatum | undefined;

      if (!datum) {
        return null;
      }
      return (
        <div className="rounded-lg border bg-card p-3 shadow-md">
          <p className="text-sm font-semibold mb-2">{datum.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{formatCurrency(datum.value * 100)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Percentage:</span>
              <span className="font-medium">{datum.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Transactions:</span>
              <span className="font-medium">{datum.transactionCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomLabelWithColor = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: PieLabelRenderProps) => {
    if (
      percent === undefined ||
      cx === undefined ||
      cy === undefined ||
      innerRadius === undefined ||
      outerRadius === undefined ||
      midAngle === undefined ||
      percent * 100 <= 5
    ) {
      return null;
    }

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={14}
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartCard
      title="Spending by Category"
      description="See where your money goes"
      action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No spending data available for this time period
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabelWithColor}
                outerRadius={110}
                innerRadius={68}
                dataKey="value"
                paddingAngle={3}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCategoryColor(entry.name)}
                    stroke="rgba(15,23,42,0.3)"
                    strokeWidth={1.5}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
            </PieChart>
          </ResponsiveContainer>

          {/* Category legend with amounts */}
          <div className="w-full mt-4 grid grid-cols-2 gap-2 text-sm">
            {chartData.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/5 p-2 transition-all duration-200 hover:border-white/15 hover:bg-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(item.name) }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="font-medium whitespace-nowrap">
                  {formatCurrency(item.value * 100)}
                </span>
              </div>
            ))}
          </div>

          {chartData.length > 8 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{chartData.length - 8} more categories
            </p>
          )}
        </div>
      )}
    </ChartCard>
  );
}

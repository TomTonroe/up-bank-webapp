'use client';

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector, getDaysFromTimeRange } from './TimeRangeSelector';
import { TimeRange } from '@/lib/types/analytics';
import { CategorySpendingDataWithDate } from '@/lib/db/manager';
import { getCategoryColor, formatCurrency } from '@/lib/utils/chart-colors';
import { subDays } from 'date-fns';

interface CategoryBreakdownProps {
  data: CategorySpendingDataWithDate[];
  defaultRange?: TimeRange;
}

export function CategoryBreakdown({ data, defaultRange = '30d' }: CategoryBreakdownProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  // Filter and aggregate data based on time range
  const chartData = useMemo(() => {
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

    return Array.from(categoryMap.entries())
      .map(([category, { amount, count }]) => ({
        name: category,
        value: amount / 100, // Convert to dollars
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0,
        transactionCount: count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data, timeRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-card p-3 shadow-md">
          <p className="text-sm font-semibold mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">{formatCurrency(data.value * 100)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Percentage:</span>
              <span className="font-medium">{data.payload.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Transactions:</span>
              <span className="font-medium">{data.payload.transactionCount}</span>
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
  }: any) => {
    // Only show label if percentage is > 5% to avoid clutter
    if (percent * 100 <= 5) return null;

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
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Category legend with amounts */}
          <div className="w-full mt-4 grid grid-cols-2 gap-2 text-sm">
            {chartData.slice(0, 8).map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-muted transition-colors">
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

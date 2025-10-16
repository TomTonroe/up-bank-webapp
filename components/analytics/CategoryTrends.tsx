'use client';

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector, getDaysFromTimeRange } from './TimeRangeSelector';
import { TimeRange } from '@/lib/types/analytics';
import { CategoryTrendData } from '@/lib/db/manager';
import { getCategoryColor, formatCurrency } from '@/lib/utils/chart-colors';
import { format, parseISO } from 'date-fns';

interface CategoryTrendsProps {
  data: CategoryTrendData[];
  defaultRange?: TimeRange;
}

type MonthRange = '3m' | '6m' | '12m' | 'all';

export function CategoryTrends({ data, defaultRange = '1y' }: CategoryTrendsProps) {
  const [monthRange, setMonthRange] = useState<MonthRange>('12m');
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  // Convert month range to number of months
  const getMonthsFromRange = (range: MonthRange): number | null => {
    if (range === '3m') return 3;
    if (range === '6m') return 6;
    if (range === '12m') return 12;
    return null; // all time
  };

  // Filter data based on month range
  const filteredData = useMemo(() => {
    const months = getMonthsFromRange(monthRange);
    if (months === null) return data;
    return data.slice(-months);
  }, [data, monthRange]);

  // Get all unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    filteredData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'month') categorySet.add(key);
      });
    });
    return Array.from(categorySet);
  }, [filteredData]);

  // Toggle category visibility
  const handleLegendClick = (category: string) => {
    const newHidden = new Set(hiddenCategories);
    if (newHidden.has(category)) {
      newHidden.delete(category);
    } else {
      newHidden.add(category);
    }
    setHiddenCategories(newHidden);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const monthDate = parseISO(`${label}-01`);
      const sortedPayload = [...payload].sort((a, b) => b.value - a.value);

      return (
        <div className="rounded-lg border bg-card p-3 shadow-md max-w-xs">
          <p className="text-sm font-semibold mb-2">{format(monthDate, 'MMMM yyyy')}</p>
          <div className="space-y-1 text-sm">
            {sortedPayload.slice(0, 8).map((entry: any) => (
              <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-muted-foreground truncate">{entry.dataKey}:</span>
                </div>
                <span className="font-medium">{formatCurrency(entry.value * 100)}</span>
              </div>
            ))}
            {sortedPayload.length > 8 && (
              <p className="text-xs text-muted-foreground pt-1">
                +{sortedPayload.length - 8} more categories
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom selector for month ranges
  const MonthRangeSelector = () => (
    <div className="inline-flex rounded-md border border-input bg-background" role="group">
      {[
        { value: '3m' as MonthRange, label: '3 Months' },
        { value: '6m' as MonthRange, label: '6 Months' },
        { value: '12m' as MonthRange, label: '12 Months' },
        { value: 'all' as MonthRange, label: 'All Time' },
      ].map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setMonthRange(option.value)}
          className={`
            px-3 py-1.5 text-sm font-medium transition-colors
            first:rounded-l-md last:rounded-r-md
            border-r last:border-r-0 border-input
            ${
              monthRange === option.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-muted'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard
      title="Category Spending Trends"
      description="Monthly spending patterns across categories"
      action={<MonthRangeSelector />}
    >
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No spending data available for this time period
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="month"
                tickFormatter={(month) => format(parseISO(`${month}-01`), 'MMM yy')}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}
                onClick={(e) => handleLegendClick(e.value)}
                formatter={(value) => (
                  <span style={{ opacity: hiddenCategories.has(value) ? 0.5 : 1 }}>
                    {value}
                  </span>
                )}
              />
              {categories.map((category) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stackId="1"
                  stroke={getCategoryColor(category)}
                  fill={getCategoryColor(category)}
                  hide={hiddenCategories.has(category)}
                  name={category}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-center text-muted-foreground">
            Click on legend items to show/hide categories
          </div>
        </>
      )}
    </ChartCard>
  );
}

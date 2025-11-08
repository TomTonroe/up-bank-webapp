'use client';

import { useMemo, useState } from 'react';
import { AreaChart, Area, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { CategoryTrendData } from '@/lib/db/manager';
import { formatCurrency, getCategoryColor } from '@/lib/utils/chart-colors';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Payload as LegendPayload } from 'recharts/types/component/DefaultLegendContent';
import type { Payload as TooltipPayload } from 'recharts/types/component/DefaultTooltipContent';
import type { TooltipProps } from 'recharts';

interface CategoryTrendsProps {
  data: CategoryTrendData[];
}

type MonthRange = '3m' | '6m' | '12m' | 'all';

export function CategoryTrends({ data }: CategoryTrendsProps) {
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

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length || typeof label !== 'string') {
      return null;
    }

    const monthDate = parseISO(`${label}-01`);
    const sortedPayload = [...payload].sort(
      (a, b) => Number(b.value ?? 0) - Number(a.value ?? 0)
    ) as TooltipPayload<number, string>[];

    return (
      <div className="rounded-lg border bg-card p-3 shadow-md max-w-xs">
        <p className="text-sm font-semibold mb-2">{format(monthDate, 'MMMM yyyy')}</p>
        <div className="space-y-1 text-sm">
          {sortedPayload.slice(0, 8).map((entry) => (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground truncate">{entry.dataKey}:</span>
              </div>
              <span className="font-medium">{formatCurrency(Number(entry.value ?? 0) * 100)}</span>
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
  };

  // Custom selector for month ranges
  const MonthRangeSelector = () => (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/40 p-1 backdrop-blur-lg"
      role="group"
    >
      {[
        { value: '3m' as MonthRange, label: '3 Months' },
        { value: '6m' as MonthRange, label: '6 Months' },
        { value: '12m' as MonthRange, label: '12 Months' },
        { value: 'all' as MonthRange, label: 'All Time' },
      ].map((option) => {
        const isActive = monthRange === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMonthRange(option.value)}
            aria-pressed={isActive}
            className={cn(
              'relative overflow-hidden rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              isActive
                ? 'bg-gradient-to-r from-primary/70 via-primary/65 to-secondary/60 text-primary-foreground shadow-[0_12px_30px_-18px_rgba(129,140,248,0.7)]'
                : 'text-muted-foreground/80 hover:text-foreground hover:bg-white/5'
            )}
          >
            <span
              className={cn(
                'relative z-10',
                isActive && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]'
              )}
            >
              {option.label}
            </span>
            <span
              className={cn(
                'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300',
                isActive &&
                  'bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.4),transparent_55%)] opacity-100'
              )}
            />
          </button>
        );
      })}
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis
                dataKey="month"
                tickFormatter={(month) => format(parseISO(`${month}-01`), 'MMM yy')}
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
              <Legend
                wrapperStyle={{ fontSize: '12px', color: 'rgba(148,163,184,0.8)' }}
                onClick={(entry: LegendPayload) => handleLegendClick(String(entry.value))}
                formatter={(value: string) => (
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
                  fillOpacity={0.4}
                  hide={hiddenCategories.has(category)}
                  name={category}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-sm text-muted-foreground/75">
            Click on legend items to show/hide categories
          </div>
        </>
      )}
    </ChartCard>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector, getDaysFromTimeRange } from './TimeRangeSelector';
import { TimeRange } from '@/lib/types/analytics';
import { TransactionForIncomeExpenses } from '@/lib/db/manager';
import { CHART_COLORS, formatCurrency } from '@/lib/utils/chart-colors';
import { format, parseISO, subDays, startOfMonth } from 'date-fns';

interface IncomeVsExpensesProps {
  data: TransactionForIncomeExpenses[];
  defaultRange?: TimeRange;
}

export function IncomeVsExpenses({ data, defaultRange = '1y' }: IncomeVsExpensesProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  // Filter and aggregate data based on time range
  const chartData = useMemo(() => {
    const days = getDaysFromTimeRange(timeRange);
    const cutoffDate = days ? subDays(new Date(), days) : null;

    // Filter transactions by date
    const filteredData = cutoffDate
      ? data.filter((item) => new Date(item.created_at) >= cutoffDate)
      : data;

    // Aggregate by month
    const monthMap = new Map<string, { income: number; expenses: number }>();
    filteredData.forEach((item) => {
      const month = format(startOfMonth(new Date(item.created_at)), 'yyyy-MM');
      const existing = monthMap.get(month) || { income: 0, expenses: 0 };

      if (item.amount > 0) {
        existing.income += item.amount;
      } else {
        existing.expenses += Math.abs(item.amount);
      }

      monthMap.set(month, existing);
    });

    // Convert to chart format
    return Array.from(monthMap.entries())
      .map(([month, { income, expenses }]) => {
        const incomeInDollars = income / 100;
        const expensesInDollars = expenses / 100;
        const net = incomeInDollars - expensesInDollars;
        const savingsRate = incomeInDollars > 0 ? (net / incomeInDollars) * 100 : 0;

        return {
          month,
          income: incomeInDollars,
          expenses: expensesInDollars,
          net,
          savingsRate,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [data, timeRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const monthDate = parseISO(`${data.month}-01`);

      return (
        <div className="rounded-lg border bg-card p-3 shadow-md">
          <p className="text-sm font-semibold mb-2">
            {format(monthDate, 'MMMM yyyy')}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Income:</span>
              <span className="font-medium" style={{ color: CHART_COLORS.income }}>
                {formatCurrency(data.income * 100)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Expenses:</span>
              <span className="font-medium" style={{ color: CHART_COLORS.expenses }}>
                {formatCurrency(data.expenses * 100)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t">
              <span className="text-muted-foreground">Net:</span>
              <span
                className="font-medium"
                style={{ color: data.net >= 0 ? CHART_COLORS.income : CHART_COLORS.expenses }}
              >
                {formatCurrency(data.net * 100)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Savings Rate:</span>
              <span className="font-medium">{data.savingsRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate overall stats
  const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const overallNet = totalIncome - totalExpenses;
  const overallSavingsRate = totalIncome > 0 ? (overallNet / totalIncome) * 100 : 0;

  return (
    <ChartCard
      title="Income vs Expenses"
      description="Monthly financial comparison"
      action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No financial data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Legend wrapperStyle={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }} />
              <Bar
                dataKey="income"
                fill={CHART_COLORS.income}
                name="Income"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill={CHART_COLORS.expenses}
                name="Expenses"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Income</p>
              <p className="text-sm font-semibold" style={{ color: CHART_COLORS.income }}>
                {formatCurrency(totalIncome * 100)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
              <p className="text-sm font-semibold" style={{ color: CHART_COLORS.expenses }}>
                {formatCurrency(totalExpenses * 100)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Net Savings</p>
              <p
                className="text-sm font-semibold"
                style={{ color: overallNet >= 0 ? CHART_COLORS.income : CHART_COLORS.expenses }}
              >
                {formatCurrency(overallNet * 100)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
              <p className="text-sm font-semibold">
                {overallSavingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}

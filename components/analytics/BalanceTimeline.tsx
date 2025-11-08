'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, TooltipProps } from 'recharts';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector, getDaysFromTimeRange } from './TimeRangeSelector';
import { TimeRange } from '@/lib/types/analytics';
import { BalanceTimelineData } from '@/lib/db/manager';
import { CHART_COLORS, formatCurrency } from '@/lib/utils/chart-colors';
import { format, parseISO } from 'date-fns';

interface BalanceTimelineProps {
  data: BalanceTimelineData[];
  currentTotalBalance: number;
  defaultRange?: TimeRange;
}

export function BalanceTimeline({ data, currentTotalBalance, defaultRange = '30d' }: BalanceTimelineProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  // Filter data based on time range
  const days = getDaysFromTimeRange(timeRange);
  const filteredData = days
    ? data.slice(-days)
    : data;

  // Calculate historical balance by working backwards from current balance
  // We'll reverse the array, calculate backwards, then reverse again
  const reversedData = [...filteredData].reverse();

  let runningBalance = currentTotalBalance;
  const balanceHistory = reversedData.map((item) => {
    const balanceAtEndOfDay = runningBalance;
    // Subtract the net change to get balance at start of day
    const netChange = item.income - item.expenses;
    runningBalance -= netChange;

    return {
      date: item.date,
      income: item.income / 100,
      expenses: item.expenses / 100,
      balance: balanceAtEndOfDay / 100,
      transactionCount: item.transactionCount,
    };
  });

  type BalancePoint = {
    date: string;
    income: number;
    expenses: number;
    balance: number;
    transactionCount: number;
  };

  // Reverse back to chronological order
  const chartData: BalancePoint[] = balanceHistory.reverse();

  // Determine appropriate tick interval and format based on data range
  const getTickInterval = () => {
    const dataLength = chartData.length;
    if (dataLength <= 7) return 0; // Show all days for 7 days or less
    if (dataLength <= 30) return Math.ceil(dataLength / 7); // ~7 ticks for 30 days
    if (dataLength <= 90) return Math.ceil(dataLength / 12); // ~12 ticks for 90 days
    if (dataLength <= 365) return Math.ceil(dataLength / 12); // ~12 ticks for 1 year
    return Math.ceil(dataLength / 24); // ~24 ticks for all time
  };

  const getTickFormat = (date: string) => {
    const dataLength = chartData.length;
    const parsedDate = parseISO(date);

    if (dataLength <= 7) return format(parsedDate, 'EEE d'); // "Mon 1"
    if (dataLength <= 30) return format(parsedDate, 'MMM d'); // "Jan 1"
    if (dataLength <= 90) return format(parsedDate, 'MMM d'); // "Jan 1"
    if (dataLength <= 365) return format(parsedDate, 'MMM yy'); // "Jan 24"
    return format(parsedDate, 'MMM yy'); // "Jan 24"
  };

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload as BalancePoint | undefined;

      if (!data) {
        return null;
      }
      return (
        <div className="rounded-lg border bg-card p-3 shadow-md">
          <p className="text-sm font-medium mb-2">
            {format(parseISO(data.date), 'MMM d, yyyy')}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Total Balance:</span>
              <span className="font-bold" style={{ color: CHART_COLORS.balance }}>
                {formatCurrency(data.balance * 100)}
              </span>
            </div>
            <div className="h-px bg-border my-1" />
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
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Net Change:</span>
              <span
                className="font-medium"
                style={{ color: data.income - data.expenses >= 0 ? CHART_COLORS.income : CHART_COLORS.expenses }}
              >
                {formatCurrency((data.income - data.expenses) * 100)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t">
              <span className="text-muted-foreground">Transactions:</span>
              <span className="font-medium">{data.transactionCount}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="Total Balance Over Time"
      description="Your complete balance across all accounts"
      action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No transaction data available for this time period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.balance} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART_COLORS.balance} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.expenses} stopOpacity={0.35} />
                <stop offset="95%" stopColor={CHART_COLORS.expenses} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis
              dataKey="date"
              tickFormatter={getTickFormat}
              interval={getTickInterval()}
              stroke="rgba(148,163,184,0.6)"
              tick={{ fill: 'rgba(148,163,184,0.7)' }}
              fontSize={12}
              angle={chartData.length > 90 ? -45 : 0}
              textAnchor={chartData.length > 90 ? 'end' : 'middle'}
              height={chartData.length > 90 ? 60 : 30}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              stroke="rgba(148,163,184,0.6)"
              tick={{ fill: 'rgba(148,163,184,0.7)' }}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(129,140,248,0.35)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: '13px', color: 'rgba(148,163,184,0.8)' }} iconType="line" />
            <Area
              type="monotone"
              dataKey="income"
              stroke={CHART_COLORS.income}
              strokeWidth={2}
              fill="url(#incomeGradient)"
              name="Income"
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={CHART_COLORS.expenses}
              strokeWidth={2}
              fill="url(#expenseGradient)"
              name="Expenses"
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={CHART_COLORS.balance}
              strokeWidth={2}
              fill="url(#balanceGradient)"
              name="Total Balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

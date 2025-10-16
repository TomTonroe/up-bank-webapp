'use client';

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartCard } from './ChartCard';
import { TimeRangeSelector, getDaysFromTimeRange } from './TimeRangeSelector';
import { TimeRange } from '@/lib/types/analytics';
import { VelocityData } from '@/lib/db/manager';
import { CHART_COLORS, formatCurrency } from '@/lib/utils/chart-colors';
import { format, parseISO } from 'date-fns';

interface TransactionVelocityProps {
  data: VelocityData[];
  defaultRange?: TimeRange;
}

export function TransactionVelocity({ data, defaultRange = '30d' }: TransactionVelocityProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);

  // Filter data based on time range
  const days = getDaysFromTimeRange(timeRange);
  const filteredData = days ? data.slice(-days) : data;

  // Convert to dollars
  const chartData = filteredData.map((item) => ({
    date: item.date,
    transactionCount: item.transactionCount,
    totalVolume: item.totalVolume / 100,
    averageSize: item.averageSize / 100,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-card p-3 shadow-md">
          <p className="text-sm font-medium mb-2">
            {format(parseISO(data.date), 'MMM d, yyyy')}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Transactions:</span>
              <span className="font-medium">{data.transactionCount}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Total Volume:</span>
              <span className="font-medium">{formatCurrency(data.totalVolume * 100)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Average Size:</span>
              <span className="font-medium">{formatCurrency(data.averageSize * 100)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Determine appropriate tick interval
  const getTickInterval = () => {
    const dataLength = chartData.length;
    if (dataLength <= 7) return 0;
    if (dataLength <= 30) return Math.ceil(dataLength / 7);
    if (dataLength <= 90) return Math.ceil(dataLength / 12);
    return Math.ceil(dataLength / 12);
  };

  const getTickFormat = (date: string) => {
    const dataLength = chartData.length;
    const parsedDate = parseISO(date);

    if (dataLength <= 7) return format(parsedDate, 'EEE d');
    if (dataLength <= 30) return format(parsedDate, 'MMM d');
    if (dataLength <= 90) return format(parsedDate, 'MMM d');
    return format(parsedDate, 'MMM yy');
  };

  return (
    <ChartCard
      title="Transaction Activity"
      description="Transaction frequency and volume over time"
      action={<TimeRangeSelector value={timeRange} onChange={setTimeRange} />}
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No transaction data available for this time period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={getTickFormat}
              interval={getTickInterval()}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
            />
            <YAxis
              yAxisId="left"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
              label={{ value: 'Count', angle: -90, position: 'insideLeft', fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              fontSize={12}
              label={{ value: 'Volume', angle: 90, position: 'insideRight', fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }} />
            <Bar
              yAxisId="left"
              dataKey="transactionCount"
              fill={CHART_COLORS.neutral}
              name="Transactions"
              opacity={0.6}
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="totalVolume"
              stroke={CHART_COLORS.balance}
              strokeWidth={2}
              name="Total Volume"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

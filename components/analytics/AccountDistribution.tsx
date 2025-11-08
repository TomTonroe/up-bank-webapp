'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { DbAccount } from '@/lib/types/database';
import { CHART_COLORS, formatCurrency } from '@/lib/utils/chart-colors';

interface AccountDistributionProps {
  accounts: DbAccount[];
}

export function AccountDistribution({ accounts }: AccountDistributionProps) {
  // Calculate total balance
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance_value_in_base_units,
    0
  );

  // Transform data for treemap
  const chartData = accounts
    .map((account) => ({
      name: account.display_name,
      size: account.balance_value_in_base_units / 100,
      percentage: totalBalance > 0 ? (account.balance_value_in_base_units / totalBalance) * 100 : 0,
      type: account.account_type,
      ownership: account.ownership_type,
    }))
    .filter((item) => item.size > 0); // Only show accounts with positive balance

  // Color by account type
  const getColor = (type: string) => {
    if (type === 'SAVER') return CHART_COLORS.income;
    if (type === 'TRANSACTIONAL') return CHART_COLORS.balance;
    return CHART_COLORS.neutral;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-card p-3 shadow-md">
          <p className="text-sm font-semibold mb-2">{data.name}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Balance:</span>
              <span className="font-medium">{formatCurrency(data.size * 100)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Percentage:</span>
              <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium capitalize">{data.type.toLowerCase()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, size, percentage, type } = props;

    // Only show label if area is large enough and data is valid
    const showLabel = width > 80 && height > 50 && name && size !== undefined && percentage !== undefined;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: getColor(type || 'TRANSACTIONAL'),
            stroke: 'rgba(255,255,255,0.12)',
            strokeWidth: 2,
            opacity: 0.92,
          }}
          rx={12}
        />
        {showLabel && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.92)"
              fontSize={14}
              fontWeight="600"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.85)"
              fontSize={12}
            >
              {formatCurrency((size || 0) * 100)}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 26}
              textAnchor="middle"
              fill="rgba(255,255,255,0.75)"
              fontSize={11}
              opacity={0.9}
            >
              {(percentage || 0).toFixed(1)}%
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <ChartCard
      title="Account Balance Distribution"
      description="How your money is distributed across accounts"
    >
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No account data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={chartData}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke="rgba(255,255,255,0.1)"
              fill={CHART_COLORS.balance}
              content={<CustomContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground/80">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.income }} />
              <span>Saver Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.balance }} />
              <span>Transactional Accounts</span>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="grid grid-cols-2 gap-4 text-center text-sm text-muted-foreground/80">
              <div>
                <p className="text-[11px] uppercase tracking-wide">Total Accounts</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{accounts.length}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide">Total Balance</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}

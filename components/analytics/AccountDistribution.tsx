'use client';

import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import { DbAccount } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/chart-colors';

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
    if (type === 'SAVER') return '#10b981'; // green-500
    if (type === 'TRANSACTIONAL') return '#3b82f6'; // blue-500
    return '#6b7280'; // gray-500
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
            stroke: '#fff',
            strokeWidth: 2,
            opacity: 0.9,
          }}
        />
        {showLabel && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#fff"
              fontSize={14}
              fontWeight="600"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={12}
            >
              {formatCurrency((size || 0) * 100)}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 26}
              textAnchor="middle"
              fill="#fff"
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
              stroke="#fff"
              fill="#8884d8"
              content={<CustomContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }} />
              <span>Saver Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
              <span>Transactional Accounts</span>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Accounts</p>
                <p className="text-lg font-semibold">{accounts.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}

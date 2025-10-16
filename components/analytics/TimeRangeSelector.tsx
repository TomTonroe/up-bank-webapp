'use client';

import { TimeRange, TimeRangeOption } from '@/lib/types/analytics';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const timeRangeOptions: TimeRangeOption[] = [
  { value: '7d', label: '7 Days', days: 7 },
  { value: '30d', label: '30 Days', days: 30 },
  { value: '90d', label: '90 Days', days: 90 },
  { value: '1y', label: '1 Year', days: 365 },
  { value: 'all', label: 'All Time', days: null },
];

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="inline-flex rounded-md border border-input bg-background" role="group">
      {timeRangeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`
            px-3 py-1.5 text-sm font-medium transition-colors
            first:rounded-l-md last:rounded-r-md
            border-r last:border-r-0 border-input
            ${
              value === option.value
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
}

export function getDaysFromTimeRange(range: TimeRange): number | null {
  const option = timeRangeOptions.find((opt) => opt.value === range);
  return option?.days ?? null;
}

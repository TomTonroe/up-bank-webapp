'use client';

import { cn } from '@/lib/utils';
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
    <div
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/40 p-1 backdrop-blur-lg"
      role="group"
    >
      {timeRangeOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative overflow-hidden rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
              isActive
                ? 'bg-gradient-to-r from-primary/70 via-primary/65 to-secondary/60 text-primary-foreground shadow-[0_12px_30px_-18px_rgba(99,102,241,0.7)]'
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
}

export function getDaysFromTimeRange(range: TimeRange): number | null {
  const option = timeRangeOptions.find((opt) => opt.value === range);
  return option?.days ?? null;
}

// Chart color palette for consistent styling across all visualizations

export const CHART_COLORS = {
  // Primary financial colors
  income: '#10b981',      // green-500
  expenses: '#ef4444',    // red-500
  balance: '#3b82f6',     // blue-500
  neutral: '#6b7280',     // gray-500

  // Category colors (diverse palette with good contrast)
  categories: [
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
    '#a855f7', // purple-500
    '#f43f5e', // rose-500
    '#22c55e', // green-500
    '#eab308', // yellow-500
    '#0ea5e9', // sky-500
  ],
};

// Get a consistent color for a category by hashing its name
export function getCategoryColor(categoryName: string): string {
  const colors = CHART_COLORS.categories;
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Format currency values for display
export function formatCurrency(valueInBaseUnits: number): string {
  const value = valueInBaseUnits / 100; // Convert cents to dollars
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// Format currency without symbol
export function formatCurrencyShort(valueInBaseUnits: number): string {
  const value = valueInBaseUnits / 100;
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

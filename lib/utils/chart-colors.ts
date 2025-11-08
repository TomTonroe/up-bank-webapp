// Chart color palette for consistent styling across all visualizations

export const CHART_COLORS = {
  // Primary financial colors tuned for the iridescent dark palette
  income: '#5EEAD4',      // teal glow
  expenses: '#FB7185',    // rose glow
  balance: '#818CF8',     // indigo glow
  neutral: '#94A3B8',     // slate accent

  // Category colors (harmonised spectrum for modern dark UI)
  categories: [
    '#A78BFA', // soft violet
    '#38BDF8', // sky teal
    '#F472B6', // pink highlight
    '#34D399', // mint
    '#FBBF24', // amber
    '#22D3EE', // cyan
    '#C084FC', // electric purple
    '#F97316', // warm orange
    '#F87171', // muted red
    '#4ADE80', // soft green
    '#F9A8D4', // blush
    '#60A5FA', // crystal blue
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

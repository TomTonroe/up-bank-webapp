import {
  getAllAccounts,
  getAllTransactions,
  getSyncStatus,
  getBalanceTimeline,
  getCategorySpendingWithDates,
  getTransactionsForIncomeExpenses,
  getMerchantsWithDates,
  getTransactionVelocity,
  getCategoryTrends,
} from '@/lib/db/manager';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { AccountsOverview } from '@/components/dashboard/AccountsOverview';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { BalanceTimeline } from '@/components/analytics/BalanceTimeline';
import { CategoryBreakdown } from '@/components/analytics/CategoryBreakdown';
import { IncomeVsExpenses } from '@/components/analytics/IncomeVsExpenses';
import { TopMerchants } from '@/components/analytics/TopMerchants';
import { AccountDistribution } from '@/components/analytics/AccountDistribution';
import { TransactionVelocity } from '@/components/analytics/TransactionVelocity';
import { CategoryTrends } from '@/components/analytics/CategoryTrends';
import { InitialSyncPrompt } from '@/components/setup/InitialSyncPrompt';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const syncStatus = getSyncStatus();

  // If no data exists, show initial sync prompt
  if (!syncStatus.isInitialized) {
    return <InitialSyncPrompt />;
  }

  const accounts = getAllAccounts();
  const recentTransactions = getAllTransactions(10);
  const allTransactions = getAllTransactions();

  // Calculate total balance
  const totalBalance = accounts.reduce(
    (sum, account) => sum + account.balance_value_in_base_units,
    0
  );

  // Calculate this month's stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const thisMonthTransactions = allTransactions.filter(
    (tx) => tx.created_at >= startOfMonth
  );

  const thisMonthSpending = thisMonthTransactions
    .filter((tx) => tx.amount_value_in_base_units < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount_value_in_base_units), 0);

  const thisMonthIncome = thisMonthTransactions
    .filter((tx) => tx.amount_value_in_base_units > 0)
    .reduce((sum, tx) => sum + tx.amount_value_in_base_units, 0);

  // Get analytics data
  const balanceTimelineData = getBalanceTimeline(null); // Get all historical data
  const categorySpendingData = getCategorySpendingWithDates(); // Get all spending data
  const incomeVsExpensesData = getTransactionsForIncomeExpenses(); // Get all transaction data
  const topMerchantsData = getMerchantsWithDates(); // Get all merchant data
  const velocityData = getTransactionVelocity(null); // Get all velocity data
  const categoryTrendsData = getCategoryTrends(null); // Get all category trend data

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader syncStatus={syncStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Cards */}
          <StatsCards
            totalBalance={totalBalance}
            thisMonthSpending={thisMonthSpending}
            thisMonthIncome={thisMonthIncome}
            totalTransactions={thisMonthTransactions.length}
          />

          {/* Analytics Charts - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceTimeline data={balanceTimelineData} currentTotalBalance={totalBalance} />
            <CategoryBreakdown data={categorySpendingData} />
          </div>

          {/* Analytics Charts - Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncomeVsExpenses data={incomeVsExpensesData} />
            <TopMerchants data={topMerchantsData} />
          </div>

          {/* Analytics Charts - Row 3 (Phase 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AccountDistribution accounts={accounts} />
            <TransactionVelocity data={velocityData} />
          </div>

          {/* Analytics Charts - Row 4 (Phase 2) */}
          <div className="grid grid-cols-1 gap-6">
            <CategoryTrends data={categoryTrendsData} />
          </div>

          {/* Accounts Overview */}
          <AccountsOverview accounts={accounts} />

          {/* Recent Transactions */}
          <RecentTransactions transactions={recentTransactions} />
        </div>
      </main>
    </div>
  );
}

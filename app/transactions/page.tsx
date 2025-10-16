import { getAllTransactions, getAllAccounts, getAllCategories, getSyncStatus } from '@/lib/db/manager';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TransactionList } from '@/components/transactions/TransactionList';

export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  const transactions = getAllTransactions();
  const accounts = getAllAccounts();
  const categories = getAllCategories();
  const syncStatus = getSyncStatus();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader syncStatus={syncStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">All Transactions</h1>
          <p className="text-muted-foreground mt-1">
            {transactions.length} total transactions
          </p>
        </div>

        <TransactionList
          transactions={transactions}
          accounts={accounts}
          categories={categories}
        />
      </main>
    </div>
  );
}

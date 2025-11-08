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
    <div className="relative min-h-screen bg-transparent">
      <DashboardHeader syncStatus={syncStatus} />

      <main className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            All Transactions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground/75">
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

'use client';

import { useEffect, useMemo, useState } from 'react';
import { DbTransaction, DbAccount, DbCategory } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/chart-colors';
import { format } from 'date-fns';
import { exportTransactionsToCsv } from '@/lib/utils/export';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TransactionListProps {
  transactions: DbTransaction[];
  accounts: DbAccount[];
  categories: DbCategory[];
}

export function TransactionList({ transactions, accounts, categories }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const selectClassName =
    'w-full rounded-lg border border-white/10 bg-background/60 px-3 py-2 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35';

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search filter
      if (searchTerm && !tx.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Account filter
      if (selectedAccount !== 'all' && tx.account_id !== selectedAccount) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && tx.category_name !== selectedCategory) {
        return false;
      }

      // Type filter
      if (selectedType === 'income' && tx.amount_value_in_base_units <= 0) {
        return false;
      }
      if (selectedType === 'expense' && tx.amount_value_in_base_units >= 0) {
        return false;
      }

      return true;
    });
  }, [transactions, searchTerm, selectedAccount, selectedCategory, selectedType]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedAccount, selectedCategory, selectedType]);

  // Get account name by ID
  const getAccountName = (accountId: string) => {
    return accounts.find((acc) => acc.id === accountId)?.display_name || 'Unknown';
  };

  // Handle CSV export
  const handleExport = () => {
    exportTransactionsToCsv(filteredTransactions);
  };

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Transactions</h2>
          <p className="mt-1 text-sm text-muted-foreground/75">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={handleExport}
          disabled={filteredTransactions.length === 0}
          size="sm"
          className="self-start shadow-[0_18px_40px_-20px_rgba(129,140,248,0.55)] disabled:shadow-none"
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 rounded-lg border-white/10 bg-background/60 text-sm placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-primary/35"
            />
          </div>

          {/* Account filter */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className={selectClassName}
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={selectClassName}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
              <option value="null">Uncategorized</option>
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
              className={selectClassName}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
        </div>

        {/* Filter summary */}
        <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4 text-sm text-muted-foreground/75 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </span>
          {(searchTerm || selectedAccount !== 'all' || selectedCategory !== 'all' || selectedType !== 'all') && (
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedAccount('all');
                setSelectedCategory('all');
                setSelectedType('all');
              }}
              variant="ghost"
              size="sm"
              className="self-start text-primary hover:text-primary/80"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="p-6">
          {paginatedTransactions.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground/75">
              No transactions found matching your filters
            </p>
          ) : (
            <div className="space-y-3">
              {paginatedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="group flex items-start justify-between gap-6 rounded-xl border border-white/5 bg-white/5 px-4 py-4 transition-all duration-200 hover:border-white/15 hover:bg-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tracking-wide text-foreground">
                      {tx.description}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground/70">
                      <span>{format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{getAccountName(tx.account_id)}</span>
                      {tx.category_name && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <Badge className="border-white/20 bg-white/10 text-[10px] font-semibold uppercase tracking-wide">
                            {tx.category_name}
                          </Badge>
                        </>
                      )}
                      {tx.message && (
                        <>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="italic text-muted-foreground/60">{tx.message}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p
                      className={cn(
                        'text-lg font-semibold tracking-tight',
                        tx.amount_value_in_base_units < 0
                          ? 'text-rose-200'
                          : 'text-emerald-200'
                      )}
                    >
                      {tx.amount_value_in_base_units < 0 ? '-' : '+'}
                      {formatCurrency(Math.abs(tx.amount_value_in_base_units))}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <Badge className="border-white/15 bg-white/10 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                        {tx.status.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-4">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="border-white/15 bg-background/60 text-sm text-muted-foreground/80 hover:bg-white/10"
            >
              Previous
            </Button>

            <span className="text-sm text-muted-foreground/70">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              className="border-white/15 bg-background/60 text-sm text-muted-foreground/80 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

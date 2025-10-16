'use client';

import { useState, useMemo } from 'react';
import { DbTransaction, DbAccount, DbCategory } from '@/lib/types/database';
import { formatCurrency } from '@/lib/utils/chart-colors';
import { format } from 'date-fns';
import { exportTransactionsToCsv } from '@/lib/utils/export';
import { Download } from 'lucide-react';

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
  useMemo(() => {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>

          {/* Account filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
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
            <label className="text-sm font-medium mb-2 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
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
            <label className="text-sm font-medium mb-2 block">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
        </div>

        {/* Filter summary */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </span>
          {(searchTerm || selectedAccount !== 'all' || selectedCategory !== 'all' || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedAccount('all');
                setSelectedCategory('all');
                setSelectedType('all');
              }}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          {paginatedTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No transactions found matching your filters
            </p>
          ) : (
            <div className="space-y-2">
              {paginatedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span>{format(new Date(tx.created_at), 'MMM d, yyyy h:mm a')}</span>
                      <span>•</span>
                      <span>{getAccountName(tx.account_id)}</span>
                      {tx.category_name && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                            {tx.category_name}
                          </span>
                        </>
                      )}
                      {tx.message && (
                        <>
                          <span>•</span>
                          <span className="italic">{tx.message}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p
                      className={`font-semibold text-lg ${
                        tx.amount_value_in_base_units < 0 ? 'text-destructive' : 'text-success'
                      }`}
                    >
                      {tx.amount_value_in_base_units < 0 ? '-' : '+'}
                      {formatCurrency(Math.abs(tx.amount_value_in_base_units))}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {tx.status.toLowerCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 pt-0 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-md border border-input bg-background text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Previous
            </button>

            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-md border border-input bg-background text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

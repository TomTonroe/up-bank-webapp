// CSV Export Utilities

import type { DbTransaction } from '@/lib/types/database';
import { format } from 'date-fns';

/**
 * Converts an array of transactions to CSV format
 *
 * @param transactions - Array of transaction objects
 * @returns CSV string with headers and data
 */
export function transactionsToCsv(transactions: DbTransaction[]): string {
  // Define CSV headers
  const headers = [
    'Date',
    'Description',
    'Amount',
    'Type',
    'Category',
    'Parent Category',
    'Account ID',
    'Status',
    'Message',
  ];

  // Convert transactions to CSV rows
  const rows = transactions.map((tx) => {
    const amount = tx.amount_value_in_base_units / 100;
    const type = amount < 0 ? 'Expense' : 'Income';

    return [
      format(new Date(tx.created_at), 'yyyy-MM-dd HH:mm:ss'),
      escapeCsvField(tx.description),
      amount.toFixed(2),
      type,
      escapeCsvField(tx.category_name || 'Uncategorized'),
      escapeCsvField(tx.parent_category_name || ''),
      tx.account_id,
      tx.status,
      escapeCsvField(tx.message || ''),
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Escapes a field value for CSV format
 * Handles quotes, commas, and newlines
 *
 * @param field - Field value to escape
 * @returns Escaped field value
 */
function escapeCsvField(field: string | null): string {
  if (field === null || field === undefined) {
    return '';
  }

  const stringField = String(field);

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }

  return stringField;
}

/**
 * Triggers a browser download of CSV content
 *
 * @param csvContent - CSV string to download
 * @param filename - Name of the file to download
 */
export function downloadCsv(csvContent: string, filename: string): void {
  // Create a Blob with CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Exports transactions to CSV file
 *
 * @param transactions - Array of transactions to export
 * @param filename - Optional filename (defaults to transactions_YYYY-MM-DD.csv)
 */
export function exportTransactionsToCsv(
  transactions: DbTransaction[],
  filename?: string
): void {
  const csvContent = transactionsToCsv(transactions);
  const defaultFilename = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCsv(csvContent, filename || defaultFilename);
}

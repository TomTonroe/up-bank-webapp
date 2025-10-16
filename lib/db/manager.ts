import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { allSchemas } from './schema';
import type {
  DbAccount,
  DbTransaction,
  DbCategory,
  DbSyncMetadata,
  SyncStatus,
} from '@/lib/types/database';

const DB_PATH = path.join(process.cwd(), 'data', 'up-bank.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure the data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

function initializeDatabase(database: Database.Database) {
  // Create all tables and indexes
  allSchemas.forEach((schema) => {
    database.exec(schema);
  });
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================================================
// Accounts
// ============================================================================

export function insertAccounts(accounts: DbAccount[]) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO accounts (
      id, display_name, account_type, ownership_type,
      balance_value, balance_currency, balance_value_in_base_units,
      created_at, synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((accounts: DbAccount[]) => {
    for (const account of accounts) {
      stmt.run(
        account.id,
        account.display_name,
        account.account_type,
        account.ownership_type,
        account.balance_value,
        account.balance_currency,
        account.balance_value_in_base_units,
        account.created_at,
        account.synced_at
      );
    }
  });

  insertMany(accounts);
}

export function getAllAccounts(): DbAccount[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM accounts ORDER BY created_at ASC').all() as DbAccount[];
}

export function getAccountById(id: string): DbAccount | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id) as DbAccount | undefined;
}

// ============================================================================
// Transactions
// ============================================================================

export function insertTransactions(transactions: DbTransaction[]) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO transactions (
      id, account_id, status, raw_text, description, message,
      amount_value, amount_currency, amount_value_in_base_units,
      foreign_amount_value, foreign_amount_currency,
      settled_at, created_at,
      category_id, category_name, parent_category_id, parent_category_name,
      synced_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((transactions: DbTransaction[]) => {
    for (const tx of transactions) {
      stmt.run(
        tx.id,
        tx.account_id,
        tx.status,
        tx.raw_text,
        tx.description,
        tx.message,
        tx.amount_value,
        tx.amount_currency,
        tx.amount_value_in_base_units,
        tx.foreign_amount_value,
        tx.foreign_amount_currency,
        tx.settled_at,
        tx.created_at,
        tx.category_id,
        tx.category_name,
        tx.parent_category_id,
        tx.parent_category_name,
        tx.synced_at
      );
    }
  });

  insertMany(transactions);
}

export function getAllTransactions(limit?: number): DbTransaction[] {
  const db = getDatabase();
  const query = limit
    ? 'SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM transactions ORDER BY created_at DESC';

  return limit
    ? (db.prepare(query).all(limit) as DbTransaction[])
    : (db.prepare(query).all() as DbTransaction[]);
}

export function getTransactionsByAccountId(accountId: string, limit?: number): DbTransaction[] {
  const db = getDatabase();
  const query = limit
    ? 'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM transactions WHERE account_id = ? ORDER BY created_at DESC';

  return limit
    ? (db.prepare(query).all(accountId, limit) as DbTransaction[])
    : (db.prepare(query).all(accountId) as DbTransaction[]);
}

export function getTransactionById(id: string): DbTransaction | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as DbTransaction | undefined;
}

export function searchTransactions(searchTerm: string, limit?: number): DbTransaction[] {
  const db = getDatabase();
  const query = limit
    ? 'SELECT * FROM transactions WHERE description LIKE ? ORDER BY created_at DESC LIMIT ?'
    : 'SELECT * FROM transactions WHERE description LIKE ? ORDER BY created_at DESC';

  const term = `%${searchTerm}%`;
  return limit
    ? (db.prepare(query).all(term, limit) as DbTransaction[])
    : (db.prepare(query).all(term) as DbTransaction[]);
}

export function getTransactionsCount(): number {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  return result.count;
}

// ============================================================================
// Categories
// ============================================================================

export function insertCategories(categories: DbCategory[]) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO categories (id, name, parent_id, synced_at)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((categories: DbCategory[]) => {
    for (const category of categories) {
      stmt.run(category.id, category.name, category.parent_id, category.synced_at);
    }
  });

  insertMany(categories);
}

export function getAllCategories(): DbCategory[] {
  const db = getDatabase();
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all() as DbCategory[];
}

export function getCategoryById(id: string): DbCategory | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as DbCategory | undefined;
}

// ============================================================================
// Sync Metadata
// ============================================================================

export function setSyncMetadata(key: string, value: string) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(key, value, new Date().toISOString());
}

export function getSyncMetadata(key: string): string | null {
  const db = getDatabase();
  const result = db.prepare('SELECT value FROM sync_metadata WHERE key = ?').get(key) as { value: string } | undefined;
  return result?.value ?? null;
}

export function getApiToken(): string | null {
  return getSyncMetadata('api_token');
}

export function setApiToken(token: string): void {
  setSyncMetadata('api_token', token);
}

export function getSyncStatus(): SyncStatus {
  const db = getDatabase();

  const lastFullSync = getSyncMetadata('last_full_sync');
  const lastIncrementalSync = getSyncMetadata('last_incremental_sync');

  const accountsCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number };
  const transactionsCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };

  return {
    isInitialized: lastFullSync !== null,
    lastFullSync,
    lastIncrementalSync,
    totalAccounts: accountsCount.count,
    totalTransactions: transactionsCount.count,
    totalCategories: categoriesCount.count,
  };
}

// ============================================================================
// Utility
// ============================================================================

export function clearAllData() {
  const db = getDatabase();
  db.exec('DELETE FROM transactions');
  db.exec('DELETE FROM categories');
  db.exec('DELETE FROM accounts');
  db.exec('DELETE FROM sync_metadata');
}

// ============================================================================
// Analytics
// ============================================================================

export interface BalanceTimelineData {
  date: string;
  income: number;
  expenses: number;
  transactionCount: number;
}

export function getBalanceTimeline(days: number | null): BalanceTimelineData[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  // If days is null, fetch all data
  if (days === null) {
    const query = `
      SELECT
        DATE(created_at) as date,
        SUM(
          CASE
            WHEN amount_value_in_base_units > 0 THEN amount_value_in_base_units
            ELSE 0
          END
        ) as income,
        SUM(
          CASE
            WHEN amount_value_in_base_units < 0 THEN ABS(amount_value_in_base_units)
            ELSE 0
          END
        ) as expenses,
        COUNT(*) as transactionCount
      FROM transactions
      WHERE status = 'SETTLED'
        ${internalFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    return db.prepare(query).all() as BalanceTimelineData[];
  }

  // Otherwise filter by days
  const query = `
    SELECT
      DATE(created_at) as date,
      SUM(
        CASE
          WHEN amount_value_in_base_units > 0 THEN amount_value_in_base_units
          ELSE 0
        END
      ) as income,
      SUM(
        CASE
          WHEN amount_value_in_base_units < 0 THEN ABS(amount_value_in_base_units)
          ELSE 0
        END
      ) as expenses,
      COUNT(*) as transactionCount
    FROM transactions
    WHERE created_at >= date('now', '-' || ? || ' days')
      AND status = 'SETTLED'
      ${internalFilter}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return db.prepare(query).all(days) as BalanceTimelineData[];
}

export interface CategorySpendingData {
  category: string;
  parentCategory: string | null;
  amount: number;
  transactionCount: number;
}

export interface CategorySpendingDataWithDate {
  category: string;
  parentCategory: string | null;
  amount: number;
  transactionCount: number;
  created_at: string;
}

export function getCategorySpendingWithDates(): CategorySpendingDataWithDate[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  const query = `
    SELECT
      COALESCE(category_name, 'Uncategorized') as category,
      parent_category_name as parentCategory,
      ABS(amount_value_in_base_units) as amount,
      created_at
    FROM transactions
    WHERE amount_value_in_base_units < 0
      AND status = 'SETTLED'
      ${internalFilter}
    ORDER BY created_at DESC
  `;

  return db.prepare(query).all() as CategorySpendingDataWithDate[];
}

export function getCategorySpending(days: number | null): CategorySpendingData[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  if (days === null) {
    const query = `
      SELECT
        COALESCE(category_name, 'Uncategorized') as category,
        parent_category_name as parentCategory,
        COUNT(*) as transactionCount,
        SUM(ABS(amount_value_in_base_units)) as amount
      FROM transactions
      WHERE amount_value_in_base_units < 0
        AND status = 'SETTLED'
        ${internalFilter}
      GROUP BY category, parentCategory
      ORDER BY amount DESC
    `;
    return db.prepare(query).all() as CategorySpendingData[];
  }

  const query = `
    SELECT
      COALESCE(category_name, 'Uncategorized') as category,
      parent_category_name as parentCategory,
      COUNT(*) as transactionCount,
      SUM(ABS(amount_value_in_base_units)) as amount
    FROM transactions
    WHERE amount_value_in_base_units < 0
      AND status = 'SETTLED'
      AND created_at >= date('now', '-' || ? || ' days')
      ${internalFilter}
    GROUP BY category, parentCategory
    ORDER BY amount DESC
  `;

  return db.prepare(query).all(days) as CategorySpendingData[];
}

export interface IncomeExpensesData {
  month: string;
  income: number;
  expenses: number;
}

export interface TransactionForIncomeExpenses {
  amount: number;
  created_at: string;
}

export function getTransactionsForIncomeExpenses(): TransactionForIncomeExpenses[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  const query = `
    SELECT
      amount_value_in_base_units as amount,
      created_at
    FROM transactions
    WHERE status = 'SETTLED'
      ${internalFilter}
    ORDER BY created_at ASC
  `;

  return db.prepare(query).all() as TransactionForIncomeExpenses[];
}

export function getIncomeVsExpenses(months: number): IncomeExpensesData[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  const query = `
    SELECT
      strftime('%Y-%m', created_at) as month,
      SUM(
        CASE
          WHEN amount_value_in_base_units > 0 THEN amount_value_in_base_units
          ELSE 0
        END
      ) as income,
      SUM(
        CASE
          WHEN amount_value_in_base_units < 0 THEN ABS(amount_value_in_base_units)
          ELSE 0
        END
      ) as expenses
    FROM transactions
    WHERE status = 'SETTLED'
      AND created_at >= date('now', '-' || ? || ' months')
      ${internalFilter}
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month ASC
  `;

  return db.prepare(query).all(months) as IncomeExpensesData[];
}

export interface MerchantData {
  merchant: string;
  amount: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface MerchantDataWithDate {
  merchant: string;
  amount: number;
  created_at: string;
}

export function getMerchantsWithDates(): MerchantDataWithDate[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  const query = `
    SELECT
      description as merchant,
      ABS(amount_value_in_base_units) as amount,
      created_at
    FROM transactions
    WHERE amount_value_in_base_units < 0
      AND status = 'SETTLED'
      ${internalFilter}
    ORDER BY created_at DESC
  `;

  return db.prepare(query).all() as MerchantDataWithDate[];
}

export function getTopMerchants(days: number, limit: number = 10): MerchantData[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  const query = `
    SELECT
      description as merchant,
      COUNT(*) as transactionCount,
      SUM(ABS(amount_value_in_base_units)) as amount,
      AVG(ABS(amount_value_in_base_units)) as averageTransaction
    FROM transactions
    WHERE amount_value_in_base_units < 0
      AND status = 'SETTLED'
      AND created_at >= date('now', '-' || ? || ' days')
      ${internalFilter}
    GROUP BY description
    ORDER BY amount DESC
    LIMIT ?
  `;

  return db.prepare(query).all(days, limit) as MerchantData[];
}

export interface VelocityData {
  date: string;
  transactionCount: number;
  totalVolume: number;
  averageSize: number;
}

export function getTransactionVelocity(days: number | null): VelocityData[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  if (days === null) {
    const query = `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as transactionCount,
        SUM(ABS(amount_value_in_base_units)) as totalVolume,
        AVG(ABS(amount_value_in_base_units)) as averageSize
      FROM transactions
      WHERE status = 'SETTLED'
        ${internalFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    return db.prepare(query).all() as VelocityData[];
  }

  const query = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as transactionCount,
      SUM(ABS(amount_value_in_base_units)) as totalVolume,
      AVG(ABS(amount_value_in_base_units)) as averageSize
    FROM transactions
    WHERE status = 'SETTLED'
      AND created_at >= date('now', '-' || ? || ' days')
      ${internalFilter}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return db.prepare(query).all(days) as VelocityData[];
}

export interface CategoryTrendData {
  month: string;
  [category: string]: number | string;
}

export function getCategoryTrends(months: number | null): CategoryTrendData[] {
  const db = getDatabase();
  const internalFilter = getInternalTransactionFilter();

  const query = months === null
    ? `
      SELECT
        strftime('%Y-%m', created_at) as month,
        COALESCE(parent_category_name, category_name, 'Uncategorized') as category,
        SUM(ABS(amount_value_in_base_units)) as total_spent
      FROM transactions
      WHERE amount_value_in_base_units < 0
        AND status = 'SETTLED'
        ${internalFilter}
      GROUP BY month, category
      ORDER BY month ASC, total_spent DESC
    `
    : `
      SELECT
        strftime('%Y-%m', created_at) as month,
        COALESCE(parent_category_name, category_name, 'Uncategorized') as category,
        SUM(ABS(amount_value_in_base_units)) as total_spent
      FROM transactions
      WHERE amount_value_in_base_units < 0
        AND status = 'SETTLED'
        AND created_at >= date('now', '-' || ? || ' months')
        ${internalFilter}
      GROUP BY month, category
      ORDER BY month ASC, total_spent DESC
    `;

  const results = months === null
    ? db.prepare(query).all() as { month: string; category: string; total_spent: number }[]
    : db.prepare(query).all(months) as { month: string; category: string; total_spent: number }[];

  // Transform into wide format for stacked area chart
  const monthMap = new Map<string, CategoryTrendData>();

  results.forEach((row) => {
    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, { month: row.month });
    }
    const monthData = monthMap.get(row.month)!;
    monthData[row.category] = row.total_spent / 100; // Convert to dollars
  });

  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export interface AccountDistributionData {
  account: string;
  accountType: string;
  balance: number;
}

export function getAccountDistribution(): AccountDistributionData[] {
  const db = getDatabase();
  const query = `
    SELECT
      display_name as account,
      account_type as accountType,
      balance_value_in_base_units as balance
    FROM accounts
    WHERE balance_value_in_base_units > 0
    ORDER BY balance DESC
  `;

  return db.prepare(query).all() as AccountDistributionData[];
}

// ============================================================================
// Internal Transaction Filtering
// ============================================================================

// Helper function to generate WHERE clause for excluding internal transactions
export function getInternalTransactionFilter(): string {
  return `
    AND description NOT LIKE '%Transfer from%'
    AND description NOT LIKE '%Transfer to%'
    AND description NOT LIKE '%Auto Transfer%'
    AND description NOT LIKE '%Quick save transfer%'
    AND description NOT LIKE 'Round Up'
    AND description NOT LIKE 'Cover from%'
    AND description NOT LIKE 'Cover to%'
    AND description NOT LIKE 'Forward to%'
  `;
}


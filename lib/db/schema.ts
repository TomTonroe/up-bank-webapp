// SQLite Database Schema

export const createAccountsTable = `
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    ownership_type TEXT NOT NULL,
    balance_value TEXT NOT NULL,
    balance_currency TEXT NOT NULL,
    balance_value_in_base_units INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    synced_at TEXT NOT NULL
  );
`;

export const createTransactionsTable = `
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    account_id TEXT,
    status TEXT NOT NULL,
    raw_text TEXT,
    description TEXT NOT NULL,
    message TEXT,
    amount_value TEXT NOT NULL,
    amount_currency TEXT NOT NULL,
    amount_value_in_base_units INTEGER NOT NULL,
    foreign_amount_value TEXT,
    foreign_amount_currency TEXT,
    settled_at TEXT,
    created_at TEXT NOT NULL,
    category_id TEXT,
    category_name TEXT,
    parent_category_id TEXT,
    parent_category_name TEXT,
    synced_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  );
`;

export const createCategoriesTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    synced_at TEXT NOT NULL
  );
`;

export const createSyncMetadataTable = `
  CREATE TABLE IF NOT EXISTS sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

// Indexes for performance
export const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions(description);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount_value_in_base_units);',
  // Analytics indexes
  'CREATE INDEX IF NOT EXISTS idx_transactions_status_date ON transactions(status, created_at);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_category_name ON transactions(category_name);',
  'CREATE INDEX IF NOT EXISTS idx_transactions_status_amount ON transactions(status, amount_value_in_base_units);',
];

export const allSchemas = [
  createAccountsTable,
  createTransactionsTable,
  createCategoriesTable,
  createSyncMetadataTable,
  ...createIndexes,
];

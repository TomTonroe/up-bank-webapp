// Database Model Types
// These represent the structure of data in SQLite

export interface DbAccount {
  id: string;
  display_name: string;
  account_type: string;
  ownership_type: string;
  balance_value: string;
  balance_currency: string;
  balance_value_in_base_units: number;
  created_at: string;
  synced_at: string;
}

export interface DbTransaction {
  id: string;
  account_id: string;
  status: string;
  raw_text: string | null;
  description: string;
  message: string | null;
  amount_value: string;
  amount_currency: string;
  amount_value_in_base_units: number;
  foreign_amount_value: string | null;
  foreign_amount_currency: string | null;
  settled_at: string | null;
  created_at: string;
  category_id: string | null;
  category_name: string | null;
  parent_category_id: string | null;
  parent_category_name: string | null;
  synced_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  parent_id: string | null;
  synced_at: string;
}

export interface DbSyncMetadata {
  key: string;
  value: string;
  updated_at: string;
}

// Sync status type
export interface SyncStatus {
  isInitialized: boolean;
  lastFullSync: string | null;
  lastIncrementalSync: string | null;
  totalAccounts: number;
  totalTransactions: number;
  totalCategories: number;
}

// Sync progress
export interface SyncProgress {
  stage: 'accounts' | 'categories' | 'transactions' | 'complete';
  current: number;
  total: number | null;
  message: string;
}

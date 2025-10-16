// Sync Service - Handles syncing data from Up Bank API to local database
import type { Account, Transaction, Category } from '@/lib/types/up-api';
import type { DbAccount, DbTransaction, DbCategory, SyncProgress } from '@/lib/types/database';
import {
  fetchAccounts,
  fetchCategories,
  fetchAllTransactionsPaginated,
  fetchTransactions,
} from '@/lib/api/up-client';
import {
  insertAccounts,
  insertTransactions,
  insertCategories,
  setSyncMetadata,
  getSyncMetadata,
} from '@/lib/db/manager';

// ============================================================================
// Transformation Functions (API -> Database)
// ============================================================================

function transformAccount(account: Account): DbAccount {
  return {
    id: account.id,
    display_name: account.attributes.displayName,
    account_type: account.attributes.accountType,
    ownership_type: account.attributes.ownershipType,
    balance_value: account.attributes.balance.value,
    balance_currency: account.attributes.balance.currencyCode,
    balance_value_in_base_units: account.attributes.balance.valueInBaseUnits,
    created_at: account.attributes.createdAt,
    synced_at: new Date().toISOString(),
  };
}

function transformTransaction(transaction: Transaction, categories?: Category[]): DbTransaction {
  const categoryId = transaction.relationships.category?.data?.id ?? null;
  const parentCategoryId = transaction.relationships.parentCategory?.data?.id ?? null;

  // Find category names from the categories list if provided
  let categoryName: string | null = null;
  let parentCategoryName: string | null = null;

  if (categories && categoryId) {
    const category = categories.find((c) => c.id === categoryId);
    categoryName = category?.attributes.name ?? null;
  }

  if (categories && parentCategoryId) {
    const parentCategory = categories.find((c) => c.id === parentCategoryId);
    parentCategoryName = parentCategory?.attributes.name ?? null;
  }

  return {
    id: transaction.id,
    account_id: transaction.relationships.account.data.id,
    status: transaction.attributes.status,
    raw_text: transaction.attributes.rawText,
    description: transaction.attributes.description,
    message: transaction.attributes.message,
    amount_value: transaction.attributes.amount.value,
    amount_currency: transaction.attributes.amount.currencyCode,
    amount_value_in_base_units: transaction.attributes.amount.valueInBaseUnits,
    foreign_amount_value: transaction.attributes.foreignAmount?.value ?? null,
    foreign_amount_currency: transaction.attributes.foreignAmount?.currencyCode ?? null,
    settled_at: transaction.attributes.settledAt,
    created_at: transaction.attributes.createdAt,
    category_id: categoryId,
    category_name: categoryName,
    parent_category_id: parentCategoryId,
    parent_category_name: parentCategoryName,
    synced_at: new Date().toISOString(),
  };
}

function transformCategory(category: Category): DbCategory {
  return {
    id: category.id,
    name: category.attributes.name,
    parent_id: category.relationships?.parent?.data?.id ?? null,
    synced_at: new Date().toISOString(),
  };
}

// ============================================================================
// Full Sync
// ============================================================================

export async function performFullSync(
  token: string,
  onProgress?: (progress: SyncProgress) => void
): Promise<void> {
  try {
    // Step 1: Fetch and store accounts
    onProgress?.({
      stage: 'accounts',
      current: 0,
      total: null,
      message: 'Fetching accounts...',
    });

    const accountsResponse = await fetchAccounts(token);
    const accounts = accountsResponse.data.map(transformAccount);
    insertAccounts(accounts);

    onProgress?.({
      stage: 'accounts',
      current: accounts.length,
      total: accounts.length,
      message: `Synced ${accounts.length} account(s)`,
    });

    // Step 2: Fetch and store categories
    onProgress?.({
      stage: 'categories',
      current: 0,
      total: null,
      message: 'Fetching categories...',
    });

    const categoriesResponse = await fetchCategories(token);
    const categories = categoriesResponse.data.map(transformCategory);
    insertCategories(categories);

    onProgress?.({
      stage: 'categories',
      current: categories.length,
      total: categories.length,
      message: `Synced ${categories.length} categories`,
    });

    // Step 3: Fetch and store all transactions (paginated)
    onProgress?.({
      stage: 'transactions',
      current: 0,
      total: null,
      message: 'Fetching transactions...',
    });

    let totalTransactions = 0;
    const batchSize = 100;

    for await (const transactionBatch of fetchAllTransactionsPaginated(token, {
      pageSize: batchSize,
    })) {
      const dbTransactions = transactionBatch.map((tx) =>
        transformTransaction(tx, categoriesResponse.data)
      );
      insertTransactions(dbTransactions);

      totalTransactions += transactionBatch.length;

      onProgress?.({
        stage: 'transactions',
        current: totalTransactions,
        total: null, // We don't know the total until we're done
        message: `Synced ${totalTransactions} transactions...`,
      });
    }

    // Step 4: Mark sync as complete
    setSyncMetadata('last_full_sync', new Date().toISOString());
    setSyncMetadata('last_incremental_sync', new Date().toISOString());

    onProgress?.({
      stage: 'complete',
      current: totalTransactions,
      total: totalTransactions,
      message: `Full sync complete! ${totalTransactions} transactions synced.`,
    });
  } catch (error) {
    console.error('Full sync failed:', error);
    throw error;
  }
}

// ============================================================================
// Incremental Sync
// ============================================================================

export async function performIncrementalSync(
  token: string,
  onProgress?: (progress: SyncProgress) => void
): Promise<number> {
  try {
    const lastSync = getSyncMetadata('last_incremental_sync');

    if (!lastSync) {
      throw new Error('No previous sync found. Please perform a full sync first.');
    }

    // Step 1: Update accounts (balances may have changed)
    onProgress?.({
      stage: 'accounts',
      current: 0,
      total: null,
      message: 'Updating accounts...',
    });

    const accountsResponse = await fetchAccounts(token);
    const accounts = accountsResponse.data.map(transformAccount);
    insertAccounts(accounts);

    // Step 2: Fetch new transactions since last sync
    onProgress?.({
      stage: 'transactions',
      current: 0,
      total: null,
      message: 'Fetching new transactions...',
    });

    const categoriesResponse = await fetchCategories(token);

    let newTransactionsCount = 0;
    let nextUrl: string | null | undefined = undefined;

    do {
      const response = await fetchTransactions(token, {
        since: lastSync,
        pageSize: 100,
        nextUrl: nextUrl ?? undefined,
      });

      if (response.data.length > 0) {
        const dbTransactions = response.data.map((tx) =>
          transformTransaction(tx, categoriesResponse.data)
        );
        insertTransactions(dbTransactions);
        newTransactionsCount += response.data.length;

        onProgress?.({
          stage: 'transactions',
          current: newTransactionsCount,
          total: null,
          message: `Synced ${newTransactionsCount} new transactions...`,
        });
      }

      nextUrl = response.links.next;
    } while (nextUrl);

    // Step 3: Update sync metadata
    setSyncMetadata('last_incremental_sync', new Date().toISOString());

    onProgress?.({
      stage: 'complete',
      current: newTransactionsCount,
      total: newTransactionsCount,
      message:
        newTransactionsCount > 0
          ? `Synced ${newTransactionsCount} new transaction(s)`
          : 'No new transactions',
    });

    return newTransactionsCount;
  } catch (error) {
    console.error('Incremental sync failed:', error);
    throw error;
  }
}

// ============================================================================
// Sync Status Check
// ============================================================================

export function needsFullSync(): boolean {
  const lastFullSync = getSyncMetadata('last_full_sync');
  return lastFullSync === null;
}

export function getLastSyncTime(): string | null {
  return getSyncMetadata('last_incremental_sync');
}

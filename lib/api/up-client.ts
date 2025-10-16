// Up Bank API Client
import type {
  Account,
  Transaction,
  Category,
  ApiResponse,
  ApiListResponse,
  PingResponse,
} from '@/lib/types/up-api';

const BASE_URL = 'https://api.up.com.au/api/v1';

export class UpBankApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'UpBankApiError';
  }
}

async function fetchFromUpApi<T>(endpoint: string, token: string): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new UpBankApiError(
      `Up Bank API error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json();
}

// ============================================================================
// Authentication
// ============================================================================

export async function ping(token: string): Promise<string> {
  const response = await fetchFromUpApi<any>('/util/ping', token);

  // The ping endpoint returns {meta: {id: string}} not {data: {id: string}}
  if (!response || !response.meta || !response.meta.id) {
    console.error('Invalid response structure:', response);
    throw new Error('Invalid response from Up Bank API');
  }

  return response.meta.id;
}

// ============================================================================
// Accounts
// ============================================================================

export async function fetchAccounts(token: string): Promise<ApiListResponse<Account>> {
  return fetchFromUpApi<ApiListResponse<Account>>('/accounts', token);
}

export async function fetchAccount(token: string, accountId: string): Promise<ApiResponse<Account>> {
  return fetchFromUpApi<ApiResponse<Account>>(`/accounts/${accountId}`, token);
}

// ============================================================================
// Transactions
// ============================================================================

export async function fetchTransactions(
  token: string,
  params?: {
    accountId?: string;
    since?: string;
    until?: string;
    pageSize?: number;
    nextUrl?: string;
  }
): Promise<ApiListResponse<Transaction>> {
  if (params?.nextUrl) {
    return fetchFromUpApi<ApiListResponse<Transaction>>(params.nextUrl, token);
  }

  const queryParams = new URLSearchParams();

  if (params?.accountId) {
    // Fetch transactions for specific account
    const endpoint = `/accounts/${params.accountId}/transactions`;
    if (params.since) queryParams.set('filter[since]', params.since);
    if (params.until) queryParams.set('filter[until]', params.until);
    if (params.pageSize) queryParams.set('page[size]', params.pageSize.toString());

    const query = queryParams.toString();
    return fetchFromUpApi<ApiListResponse<Transaction>>(
      query ? `${endpoint}?${query}` : endpoint,
      token
    );
  }

  // Fetch all transactions
  if (params?.since) queryParams.set('filter[since]', params.since);
  if (params?.until) queryParams.set('filter[until]', params.until);
  if (params?.pageSize) queryParams.set('page[size]', params.pageSize.toString());

  const query = queryParams.toString();
  return fetchFromUpApi<ApiListResponse<Transaction>>(
    query ? `/transactions?${query}` : '/transactions',
    token
  );
}

export async function fetchTransaction(
  token: string,
  transactionId: string
): Promise<ApiResponse<Transaction>> {
  return fetchFromUpApi<ApiResponse<Transaction>>(`/transactions/${transactionId}`, token);
}

// ============================================================================
// Categories
// ============================================================================

export async function fetchCategories(token: string): Promise<ApiListResponse<Category>> {
  return fetchFromUpApi<ApiListResponse<Category>>('/categories', token);
}

export async function fetchCategory(
  token: string,
  categoryId: string
): Promise<ApiResponse<Category>> {
  return fetchFromUpApi<ApiResponse<Category>>(`/categories/${categoryId}`, token);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fetch all pages of transactions
 * This will automatically paginate through all results
 */
export async function* fetchAllTransactionsPaginated(
  token: string,
  params?: {
    accountId?: string;
    since?: string;
    until?: string;
    pageSize?: number;
  }
): AsyncGenerator<Transaction[], void, unknown> {
  let nextUrl: string | null | undefined = undefined;

  do {
    const response = await fetchTransactions(token, {
      ...params,
      pageSize: params?.pageSize ?? 100, // Max page size
      nextUrl: nextUrl ?? undefined,
    });

    yield response.data;

    nextUrl = response.links.next;
  } while (nextUrl);
}

/**
 * Fetch all transactions at once (use with caution for large datasets)
 */
export async function fetchAllTransactions(
  token: string,
  params?: {
    accountId?: string;
    since?: string;
    until?: string;
  }
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = [];

  for await (const batch of fetchAllTransactionsPaginated(token, params)) {
    allTransactions.push(...batch);
  }

  return allTransactions;
}

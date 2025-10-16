// Up Bank API Type Definitions
// Based on Up API v1 OpenAPI specification

export type AccountType = 'SAVER' | 'TRANSACTIONAL' | 'HOME_LOAN';
export type OwnershipType = 'INDIVIDUAL' | 'JOINT';
export type TransactionStatus = 'HELD' | 'SETTLED';

export interface MoneyObject {
  currencyCode: string;
  value: string;
  valueInBaseUnits: number;
}

export interface AccountAttributes {
  displayName: string;
  accountType: AccountType;
  ownershipType: OwnershipType;
  balance: MoneyObject;
  createdAt: string;
}

export interface Account {
  type: 'accounts';
  id: string;
  attributes: AccountAttributes;
}

export interface CategoryAttributes {
  name: string;
}

export interface Category {
  type: 'categories';
  id: string;
  attributes: CategoryAttributes;
  relationships?: {
    parent?: {
      data: {
        type: 'categories';
        id: string;
      } | null;
    };
  };
}

export interface TransactionAttributes {
  status: TransactionStatus;
  rawText: string | null;
  description: string;
  message: string | null;
  amount: MoneyObject;
  foreignAmount: MoneyObject | null;
  settledAt: string | null;
  createdAt: string;
}

export interface Transaction {
  type: 'transactions';
  id: string;
  attributes: TransactionAttributes;
  relationships: {
    account: {
      data: {
        type: 'accounts';
        id: string;
      };
    };
    category?: {
      data: {
        type: 'categories';
        id: string;
      } | null;
    };
    parentCategory?: {
      data: {
        type: 'categories';
        id: string;
      } | null;
    };
    tags?: {
      data: Array<{
        type: 'tags';
        id: string;
      }>;
    };
  };
}

export interface PaginationLinks {
  prev: string | null;
  next: string | null;
}

export interface ApiResponse<T> {
  data: T;
  links?: PaginationLinks;
}

export interface ApiListResponse<T> {
  data: T[];
  links: PaginationLinks;
}

// Ping response
export interface PingResponse {
  data: {
    type: 'pings';
    id: string;
    attributes: Record<string, never>;
  };
}

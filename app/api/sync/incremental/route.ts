// API Route: POST /api/sync/incremental
// Performs an incremental sync (only new data since last sync)
import { NextResponse } from 'next/server';
import { performIncrementalSync } from '@/lib/sync/sync-service';
import { getUpBankToken } from '@/lib/config';

export async function POST() {
  try {
    const token = getUpBankToken();

    // Perform incremental sync
    const newTransactionsCount = await performIncrementalSync(token);

    return NextResponse.json({
      success: true,
      message:
        newTransactionsCount > 0
          ? `Synced ${newTransactionsCount} new transaction(s)`
          : 'No new transactions',
      newTransactionsCount,
    });
  } catch (error) {
    console.error('Incremental sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform incremental sync',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

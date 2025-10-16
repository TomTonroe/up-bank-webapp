// API Route: POST /api/sync/full
// Performs a full sync of all data from Up Bank API
import { NextResponse } from 'next/server';
import { performFullSync } from '@/lib/sync/sync-service';
import { getUpBankToken } from '@/lib/config';

export async function POST() {
  try {
    const token = getUpBankToken();

    // Perform full sync
    await performFullSync(token);

    return NextResponse.json({
      success: true,
      message: 'Full sync completed successfully',
    });
  } catch (error) {
    console.error('Full sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to perform full sync',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// API Route: GET /api/sync/status
// Returns the current sync status
import { NextResponse } from 'next/server';
import { getSyncStatus } from '@/lib/db/manager';

export async function GET() {
  try {
    const status = getSyncStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function InitialSyncPrompt() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSync = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sync/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        // Sync successful, redirect to dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Sync failed. Please check your .env.local configuration.');
      }
    } catch (err) {
      setError('Failed to connect to the sync service. Please check your configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl border bg-card text-card-foreground shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-2">Welcome to Up Bank Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          No data found. You need to perform an initial sync to download your Up Bank data.
        </p>
        <div className="space-y-4">
          <div className="rounded-md p-4 border bg-secondary">
            <p className="text-sm">
              Make sure you have set{' '}
              <code className="px-1 rounded bg-accent">UP_BANK_API_TOKEN</code> in your{' '}
              <code className="px-1 rounded bg-accent">.env.local</code> file.
            </p>
          </div>

          {error && (
            <div className="rounded-md p-4 border border-destructive bg-destructive/10">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSync}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Syncing...' : 'Run Initial Sync'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            This may take a few minutes depending on your transaction history
          </p>
        </div>
      </div>
    </div>
  );
}

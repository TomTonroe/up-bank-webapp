'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Sparkles } from 'lucide-react';

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setMessage('');

    try {
      const response = await fetch('/api/sync/incremental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Sync completed successfully');
        // Refresh the page to show new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(data.error || 'Sync failed');
      }
    } catch (error) {
      setMessage('Sync failed: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className="text-xs text-muted-foreground/80">{message}</span>
      )}
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        size="sm"
        className="shadow-[0_18px_40px_-20px_rgba(99,102,241,0.7)] disabled:translate-y-0"
        aria-busy={isSyncing}
      >
        {isSyncing ? (
          <span className="inline-flex items-center gap-2">
            <RefreshCcw className="size-4 animate-spin" />
            Syncing...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <Sparkles className="size-4" />
            Sync Now
          </span>
        )}
      </Button>
    </div>
  );
}

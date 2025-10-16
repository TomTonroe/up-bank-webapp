'use client';

import { useState } from 'react';

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
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
}

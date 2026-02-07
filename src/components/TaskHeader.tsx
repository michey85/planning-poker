'use client';

import { useState } from 'react';
import { useVotingStore } from '@/store/useVotingStore';

export default function TaskHeader() {
  const taskName = useVotingStore((s) => s.taskName);
  const sessionId = useVotingStore((s) => s.sessionId);
  const votes = useVotingStore((s) => s.votes);
  const [copied, setCopied] = useState(false);

  const votedCount = votes.filter((v) => v.value !== null).length;
  const totalCount = votes.length;
  const progress = totalCount > 0 ? (votedCount / totalCount) * 100 : 0;

  const barColor =
    progress >= 100
      ? 'bg-green-500'
      : progress >= 50
        ? 'bg-amber-500'
        : 'bg-border';

  const copyId = async () => {
    if (!sessionId) return;
    await navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold sm:text-3xl">{taskName}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/60">
        <button
          type="button"
          onClick={copyId}
          className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 font-mono text-xs transition-colors hover:border-accent"
        >
          {sessionId?.slice(0, 8)}...
          <span>{copied ? '✓' : '⎘'}</span>
        </button>
        <span>
          {votedCount} of {totalCount} voted
        </span>
      </div>
      {totalCount > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

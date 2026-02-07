'use client';

import { useState } from 'react';
import { pushToast } from '@/lib/toast';
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
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    pushToast('Session link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold sm:text-3xl">{taskName}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/60">
        <button
          type="button"
          onClick={copyId}
          aria-label="Copy session link"
          className="inline-flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs transition-colors hover:border-accent hover:text-foreground"
        >
          {copied ? (
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              className="size-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <span aria-live="polite">
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

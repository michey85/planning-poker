'use client';

import { useVotingStore } from '@/store/useVotingStore';

export default function VotingResults() {
  const votes = useVotingStore((s) => s.votes);

  const numericVotes = votes
    .map((v) => v.value)
    .filter((v): v is string => v !== null && v !== '?')
    .map(Number);

  const average =
    numericVotes.length > 0
      ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(
          1,
        )
      : '—';

  const median = (() => {
    if (numericVotes.length === 0) return '—';
    const sorted = [...numericVotes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
    }
    return sorted[mid].toString();
  })();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
        Results
      </h2>
      <div className="flex gap-6">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{average}</span>
          <span className="text-xs text-foreground/60">Average</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{median}</span>
          <span className="text-xs text-foreground/60">Median</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {votes.map((vote) => (
          <div
            key={vote.id}
            className="flex flex-col items-center gap-1 rounded border border-border px-3 py-2"
          >
            <span className="font-mono text-lg font-bold">
              {vote.value ?? '—'}
            </span>
            <span className="text-xs text-foreground/60">{vote.user_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

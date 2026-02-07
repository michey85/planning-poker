'use client';

import { useVotingStore } from '@/store/useVotingStore';
import { CARD_VALUES } from '@/types';

const FIBONACCI_ORDER = CARD_VALUES.filter((v) => v !== '?');

function fibonacciIndex(value: string): number {
  return FIBONACCI_ORDER.indexOf(value as (typeof FIBONACCI_ORDER)[number]);
}

function getConsensusLevel(numericValues: string[]): {
  label: string;
  color: string;
  detail?: string;
} {
  if (numericValues.length < 2)
    return { label: 'Consensus!', color: 'bg-green-100 text-green-800' };

  const indices = numericValues.map(fibonacciIndex).filter((i) => i >= 0);
  if (indices.length < 2)
    return { label: 'Consensus!', color: 'bg-green-100 text-green-800' };

  const min = Math.min(...indices);
  const max = Math.max(...indices);
  const spread = max - min;

  if (spread === 0) {
    return { label: 'Consensus!', color: 'bg-green-100 text-green-800' };
  }
  if (spread <= 2) {
    return { label: 'Close', color: 'bg-amber-100 text-amber-800' };
  }
  return {
    label: 'Divergent',
    color: 'bg-red-100 text-red-800',
    detail: `${FIBONACCI_ORDER[min]}–${FIBONACCI_ORDER[max]}`,
  };
}

export default function VotingResults() {
  const votes = useVotingStore((s) => s.votes);

  const numericVotes = votes
    .map((v) => v.value)
    .filter((v): v is string => v !== null && v !== '?');

  const numericNumbers = numericVotes.map(Number);

  const average =
    numericNumbers.length > 0
      ? (
          numericNumbers.reduce((a, b) => a + b, 0) / numericNumbers.length
        ).toFixed(1)
      : '—';

  const median = (() => {
    if (numericNumbers.length === 0) return '—';
    const sorted = [...numericNumbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1);
    }
    return sorted[mid].toString();
  })();

  const consensus =
    numericVotes.length > 0 ? getConsensusLevel(numericVotes) : null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
        Results
      </h2>
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{average}</span>
          <span className="text-xs text-foreground/60">Average</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold">{median}</span>
          <span className="text-xs text-foreground/60">Median</span>
        </div>
        {consensus && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${consensus.color}`}
          >
            {consensus.label}
            {consensus.detail && ` (${consensus.detail})`}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {votes.map((vote, index) => (
          <div
            key={vote.id}
            className="card-flip card-flipped"
            style={{ '--flip-delay': `${index * 0.1}s` } as React.CSSProperties}
          >
            <div className="card-inner flex h-20 w-14 items-center justify-center rounded-lg border border-border">
              <div className="card-front flex h-full w-full flex-col items-center justify-center gap-1">
                <span className="font-mono text-lg font-bold">
                  {vote.value ?? '—'}
                </span>
                <span className="max-w-[3rem] truncate text-[10px] text-foreground/60">
                  {vote.user_name}
                </span>
              </div>
              <div className="card-back flex h-full w-full items-center justify-center rounded-lg bg-accent/10">
                <span className="text-lg text-accent">?</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

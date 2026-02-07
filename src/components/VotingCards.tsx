'use client';

import { useVotingStore } from '@/store/useVotingStore';
import { CARD_VALUES } from '@/types';

export default function VotingCards() {
  const castVote = useVotingStore((s) => s.castVote);
  const currentUserVote = useVotingStore((s) => s.currentUserVote);
  const isRevealed = useVotingStore((s) => s.isRevealed);

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {CARD_VALUES.map((value) => {
        const isSelected = currentUserVote === value;
        return (
          <button
            key={value}
            type="button"
            disabled={isRevealed}
            onClick={() => castVote(value)}
            className={`flex h-20 w-14 items-center justify-center rounded-lg border-2 text-lg font-bold transition-colors sm:h-24 sm:w-16 sm:text-xl ${
              isSelected
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border hover:border-accent/50'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

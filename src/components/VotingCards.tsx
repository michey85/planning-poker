'use client';

import { useRef, useState } from 'react';
import { useVotingStore } from '@/store/useVotingStore';
import { CARD_VALUES } from '@/types';

export default function VotingCards() {
  const castVote = useVotingStore((s) => s.castVote);
  const currentUserVote = useVotingStore((s) => s.currentUserVote);
  const isRevealed = useVotingStore((s) => s.isRevealed);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = (index + 1) % CARD_VALUES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = (index - 1 + CARD_VALUES.length) % CARD_VALUES.length;
    } else {
      return;
    }
    setFocusedIndex(next);
    cardsRef.current[next]?.focus();
  };

  return (
    <fieldset className="flex flex-wrap justify-center gap-3 border-none p-0">
      <legend className="sr-only">Vote cards</legend>
      {CARD_VALUES.map((value, index) => {
        const isSelected = currentUserVote === value;
        return (
          <button
            key={value}
            ref={(el) => {
              cardsRef.current[index] = el;
            }}
            type="button"
            aria-pressed={isSelected}
            aria-label={`Vote ${value === '?' ? 'unsure' : `${value} points`}`}
            tabIndex={index === focusedIndex ? 0 : -1}
            disabled={isRevealed}
            onClick={() => castVote(value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => setFocusedIndex(index)}
            className={`flex h-20 w-14 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all sm:h-24 sm:w-16 sm:text-xl active:scale-95 hover:shadow-md ${
              isSelected
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border hover:border-accent/50'
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {value}
          </button>
        );
      })}
    </fieldset>
  );
}

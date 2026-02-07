'use client';

import { selectModerator, useVotingStore } from '@/store/useVotingStore';

export default function ParticipantsList() {
  const votes = useVotingStore((s) => s.votes);
  const isRevealed = useVotingStore((s) => s.isRevealed);
  const userName = useVotingStore((s) => s.userName);
  const moderator = useVotingStore(selectModerator);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
        Participants
      </h2>
      <ul className="flex flex-col gap-1" aria-label="Participants">
        {votes.map((vote, index) => {
          const isCurrentUser = vote.user_name === userName;
          const hasVoted = vote.value !== null;
          return (
            <li
              key={vote.id}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                isCurrentUser ? 'bg-accent/10' : ''
              }`}
            >
              <span
                className={`${isCurrentUser ? 'font-medium' : ''} min-w-0 truncate`}
              >
                {vote.user_name}
                {vote.user_name === moderator && (
                  <span className="ml-1.5 text-xs text-accent">(mod)</span>
                )}
                {isCurrentUser && ' (you)'}
              </span>
              <div
                className={`card-flip ${isRevealed ? 'card-flipped' : ''}`}
                style={
                  {
                    '--flip-delay': `${index * 0.1}s`,
                  } as React.CSSProperties
                }
              >
                <div className="card-inner h-6 w-8">
                  <div className="card-front flex h-full w-full items-center justify-center">
                    <span className="font-mono text-sm font-bold">
                      {vote.value ?? '—'}
                    </span>
                  </div>
                  <div className="card-back flex h-full w-full items-center justify-center">
                    <span className="font-mono text-sm">
                      {hasVoted ? '✓' : '⏳'}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {votes.length === 0 && (
          <li className="px-3 py-2 text-sm text-foreground/40">
            No participants yet
          </li>
        )}
      </ul>
    </div>
  );
}

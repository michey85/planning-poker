'use client';

import { useEffect, useState } from 'react';
import { useVotingStore } from '@/store/useVotingStore';
import ParticipantsList from './ParticipantsList';
import TaskHeader from './TaskHeader';
import UsernamePrompt from './UsernamePrompt';
import VotingCards from './VotingCards';
import VotingResults from './VotingResults';

export default function SessionRoom({ sessionId }: { sessionId: string }) {
  const userName = useVotingStore((s) => s.userName);
  const isRevealed = useVotingStore((s) => s.isRevealed);
  const joinSession = useVotingStore((s) => s.joinSession);
  const revealCards = useVotingStore((s) => s.revealCards);
  const resetVoting = useVotingStore((s) => s.resetVoting);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    joinSession(sessionId)
      .catch(() => setError('Session not found.'))
      .finally(() => setLoading(false));
  }, [sessionId, joinSession]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-foreground/60">Loading session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  if (!userName) {
    return <UsernamePrompt />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10">
      <TaskHeader />
      <VotingCards />
      <div className="flex gap-3">
        {!isRevealed ? (
          <button
            type="button"
            onClick={() => revealCards()}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Reveal Cards
          </button>
        ) : (
          <button
            type="button"
            onClick={() => resetVoting()}
            className="rounded-lg border border-accent bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
          >
            New Round
          </button>
        )}
      </div>
      {isRevealed && <VotingResults />}
      <ParticipantsList />
    </div>
  );
}

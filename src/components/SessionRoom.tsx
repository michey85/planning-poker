'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { useVotingStore } from '@/store/useVotingStore';
import ParticipantsList from './ParticipantsList';
import TaskHeader from './TaskHeader';
import UsernamePrompt from './UsernamePrompt';
import VotingCards from './VotingCards';
import VotingResults from './VotingResults';

export default function SessionRoom({ sessionId }: { sessionId: string }) {
  const userName = useVotingStore((s) => s.userName);
  const isRevealed = useVotingStore((s) => s.isRevealed);
  const storeSessionId = useVotingStore((s) => s.sessionId);
  const taskName = useVotingStore((s) => s.taskName);
  const votes = useVotingStore((s) => s.votes);
  const joinSession = useVotingStore((s) => s.joinSession);
  const revealCards = useVotingStore((s) => s.revealCards);
  const resetVoting = useVotingStore((s) => s.resetVoting);

  const { connectionStatus } = useRealtimeVotes(storeSessionId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewRound, setShowNewRound] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const allVoted = votes.length > 0 && votes.every((v) => v.value !== null);

  useEffect(() => {
    joinSession(sessionId)
      .catch(() => setError('Session not found.'))
      .finally(() => setLoading(false));
  }, [sessionId, joinSession]);

  useEffect(() => {
    if (showNewRound) {
      inputRef.current?.focus();
    }
  }, [showNewRound]);

  const handleNewRound = () => {
    setNewTaskName(taskName ?? '');
    setShowNewRound(true);
  };

  const confirmNewRound = () => {
    const name = newTaskName.trim();
    resetVoting(name && name !== taskName ? name : undefined);
    setShowNewRound(false);
  };

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
      {connectionStatus === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          Realtime connection lost. Updates may be delayed.
        </div>
      )}
      <TaskHeader />
      <VotingCards />
      <div className="flex flex-col gap-3">
        {!isRevealed ? (
          <button
            type="button"
            onClick={() => revealCards()}
            className={`w-fit rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover ${
              allVoted ? 'animate-pulse' : ''
            }`}
          >
            Reveal Cards
          </button>
        ) : showNewRound ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmNewRound()}
              placeholder="Task name for next round"
              className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={confirmNewRound}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Start Round
            </button>
            <button
              type="button"
              onClick={() => setShowNewRound(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/60 transition-colors hover:border-accent"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNewRound}
            className="w-fit rounded-lg border border-accent bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
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

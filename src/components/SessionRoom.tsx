'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { selectIsModerator, useVotingStore } from '@/store/useVotingStore';
import ParticipantsList from './ParticipantsList';
import TaskHeader from './TaskHeader';
import UsernamePrompt from './UsernamePrompt';
import VotingCards from './VotingCards';
import VotingResults from './VotingResults';

export default function SessionRoom({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const userName = useVotingStore((s) => s.userName);
  const isRevealed = useVotingStore((s) => s.isRevealed);
  const storeSessionId = useVotingStore((s) => s.sessionId);
  const taskName = useVotingStore((s) => s.taskName);
  const votes = useVotingStore((s) => s.votes);
  const sessionClosed = useVotingStore((s) => s.sessionClosed);
  const joinSession = useVotingStore((s) => s.joinSession);
  const revealCards = useVotingStore((s) => s.revealCards);
  const resetVoting = useVotingStore((s) => s.resetVoting);
  const closeSession = useVotingStore((s) => s.closeSession);
  const isModerator = useVotingStore(selectIsModerator);

  const { connectionStatus } = useRealtimeVotes(storeSessionId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewRound, setShowNewRound] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (userName) {
      mainRef.current?.focus();
    }
  }, [userName]);

  const handleNewRound = () => {
    setNewTaskName(taskName ?? '');
    setShowNewRound(true);
  };

  const handleReveal = async () => {
    setIsRevealing(true);
    try {
      await revealCards();
    } finally {
      setIsRevealing(false);
    }
  };

  const confirmNewRound = async () => {
    const name = newTaskName.trim();
    setIsResetting(true);
    try {
      await resetVoting(name && name !== taskName ? name : undefined);
      setShowNewRound(false);
    } finally {
      setIsResetting(false);
    }
  };

  const handleCloseSession = async () => {
    if (
      !window.confirm(
        'Are you sure you want to close this session? This action cannot be undone and all participants will be disconnected.',
      )
    ) {
      return;
    }
    setIsClosing(true);
    try {
      await closeSession();
      router.push('/');
    } catch {
      setIsClosing(false);
    }
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

  if (sessionClosed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg text-foreground">
            Session was closed by the moderator.
          </p>
          <a
            href="/"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mainRef}
      tabIndex={-1}
      className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 outline-none"
    >
      {connectionStatus === 'error' && (
        <div
          role="alert"
          aria-live="assertive"
          className="animate-fade-in rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          Realtime connection lost. Updates may be delayed.
        </div>
      )}
      <TaskHeader />
      <VotingCards />
      <div className="flex flex-col gap-3">
        {!isRevealed ? (
          isModerator ? (
            <button
              type="button"
              onClick={handleReveal}
              disabled={isRevealing}
              className={`w-fit rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 ${
                allVoted && !isRevealing ? 'animate-pulse' : ''
              }`}
            >
              {isRevealing ? 'Revealing...' : 'Reveal Cards'}
            </button>
          ) : (
            <p className="text-sm text-foreground/60">
              Waiting for moderator to reveal...
            </p>
          )
        ) : isModerator ? (
          showNewRound ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={inputRef}
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmNewRound()}
                placeholder="Task name for next round"
                className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={confirmNewRound}
                  disabled={isResetting}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {isResetting ? 'Starting...' : 'Start Round'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewRound(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/60 transition-colors hover:border-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleNewRound}
              className="w-fit rounded-lg border border-accent bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
            >
              New Round
            </button>
          )
        ) : (
          <p className="text-sm text-foreground/60">
            Waiting for next round...
          </p>
        )}
      </div>
      {isRevealed && <VotingResults />}
      <ParticipantsList />
      {isModerator && (
        <div className="mt-4 border-t border-border pt-6">
          <button
            type="button"
            onClick={handleCloseSession}
            disabled={isClosing}
            className="rounded-lg border border-red-500 bg-transparent px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
          >
            {isClosing ? 'Closing...' : 'Close Session'}
          </button>
        </div>
      )}
    </div>
  );
}

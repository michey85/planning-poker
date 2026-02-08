'use client';

import { useEffect, useRef, useState } from 'react';
import { selectIsModerator, useVotingStore } from '@/store/useVotingStore';

interface ModeratorControlsProps {
  onSessionClosed: () => void;
}

export default function ModeratorControls({
  onSessionClosed,
}: ModeratorControlsProps) {
  const revealCards = useVotingStore((s) => s.revealCards);
  const resetVoting = useVotingStore((s) => s.resetVoting);
  const closeSession = useVotingStore((s) => s.closeSession);
  const taskName = useVotingStore((s) => s.taskName);
  const isRevealed = useVotingStore((s) => s.isRevealed);
  const votes = useVotingStore((s) => s.votes);
  const isModerator = useVotingStore(selectIsModerator);

  const [showNewRound, setShowNewRound] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const allVoted = votes.length > 0 && votes.every((v) => v.value !== null);

  useEffect(() => {
    if (showNewRound) {
      inputRef.current?.focus();
    }
  }, [showNewRound]);

  const handleReveal = async () => {
    setIsRevealing(true);
    try {
      await revealCards();
    } finally {
      setIsRevealing(false);
    }
  };

  const handleNewRound = () => {
    setNewTaskName(taskName ?? '');
    setShowNewRound(true);
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
      onSessionClosed();
    } catch {
      setIsClosing(false);
    }
  };

  return (
    <>
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
      {isModerator && (
        <div className="mt-4 border-t border-border pt-6 order-10">
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
    </>
  );
}

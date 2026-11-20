'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { selectIsModerator, useVotingStore } from '@/store/useVotingStore';
import { CARD_VALUES } from '@/types';

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
  const historyEnabled = useVotingStore((s) => s.historyEnabled);
  const isModerator = useVotingStore(selectIsModerator);

  const [showNewRound, setShowNewRound] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [consensusValue, setConsensusValue] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const confirmTitleId = useId();
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
    const values = votes
      .map((v) => v.value)
      .filter((v): v is string => v !== null);
    const unanimous = values.length > 0 && values.every((v) => v === values[0]);
    setConsensusValue(unanimous ? values[0] : null);
    setShowNewRound(true);
  };

  const confirmNewRound = async () => {
    if (historyEnabled && !consensusValue) return;
    const name = newTaskName.trim();
    setIsResetting(true);
    try {
      await resetVoting(
        historyEnabled ? consensusValue : null,
        name && name !== taskName ? name : undefined,
      );
      setShowNewRound(false);
      setConsensusValue(null);
    } finally {
      setIsResetting(false);
    }
  };

  const openCloseConfirm = () => {
    confirmDialogRef.current?.showModal();
  };

  const handleCloseSession = async () => {
    confirmDialogRef.current?.close();
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
              {historyEnabled && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-sm text-foreground/60 w-full">
                    Consensus:
                  </span>
                  {CARD_VALUES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setConsensusValue(v)}
                      className={`rounded px-2.5 py-1 text-sm font-medium border transition-colors ${
                        consensusValue === v
                          ? 'bg-accent text-white border-accent'
                          : 'border-border text-foreground/60 hover:border-accent'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={confirmNewRound}
                  disabled={isResetting || (historyEnabled && !consensusValue)}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {isResetting ? 'Starting...' : 'Start Round'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewRound(false);
                    setConsensusValue(null);
                  }}
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
            onClick={openCloseConfirm}
            disabled={isClosing}
            className="rounded-lg border border-red-500 bg-transparent px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
          >
            {isClosing ? 'Closing...' : 'Close Session'}
          </button>
          <dialog
            ref={confirmDialogRef}
            aria-labelledby={confirmTitleId}
            className="m-auto max-w-sm rounded-xl border border-border bg-background p-6 text-foreground backdrop:bg-black/60"
          >
            <h2 id={confirmTitleId} className="text-lg font-semibold">
              Close this session?
            </h2>
            <p className="mt-2 text-sm text-foreground/60">
              This action cannot be undone and all participants will be
              disconnected.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => confirmDialogRef.current?.close()}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground/60 transition-colors hover:border-accent"
              >
                Keep session
              </button>
              <button
                type="button"
                onClick={handleCloseSession}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Close session
              </button>
            </div>
          </dialog>
        </div>
      )}
    </>
  );
}

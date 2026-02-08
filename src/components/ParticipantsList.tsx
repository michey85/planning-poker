'use client';

import { useState } from 'react';
import { selectModerator, useVotingStore } from '@/store/useVotingStore';

export default function ParticipantsList() {
  const votes = useVotingStore((s) => s.votes);
  const isRevealed = useVotingStore((s) => s.isRevealed);
  const userName = useVotingStore((s) => s.userName);
  const moderator = useVotingStore(selectModerator);
  const renameUser = useVotingStore((s) => s.renameUser);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [renameError, setRenameError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const startRename = () => {
    setNameInput(userName || '');
    setRenameError('');
    setEditingName(true);
  };

  const cancelRename = () => {
    setEditingName(false);
    setNameInput('');
    setRenameError('');
  };

  const confirmRename = async () => {
    const trimmed = nameInput.trim();

    if (trimmed === userName) {
      cancelRename();
      return;
    }

    if (trimmed.length < 2) {
      setRenameError('Name must be at least 2 characters');
      return;
    }

    const duplicate = votes.some(
      (v) =>
        v.user_name.toLowerCase() === trimmed.toLowerCase() &&
        v.user_name !== userName,
    );
    if (duplicate) {
      setRenameError('Name already in use');
      return;
    }

    setIsRenaming(true);
    setRenameError('');
    try {
      await renameUser(trimmed);
      setEditingName(false);
      setNameInput('');
    } catch {
      setRenameError('Failed to rename');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  };

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
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {isCurrentUser && editingName ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isRenaming}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        className="min-w-0 flex-1 rounded border border-accent/30 bg-background px-2 py-1 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={confirmRename}
                        disabled={isRenaming}
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent/20 disabled:opacity-50"
                        aria-label="Confirm rename"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={cancelRename}
                        disabled={isRenaming}
                        className="flex h-6 w-6 items-center justify-center rounded hover:bg-accent/20 disabled:opacity-50"
                        aria-label="Cancel rename"
                      >
                        ✕
                      </button>
                    </div>
                    {renameError && (
                      <span className="text-xs text-red-500">{renameError}</span>
                    )}
                  </>
                ) : (
                  <span
                    className={`${isCurrentUser ? 'font-medium' : ''} flex min-w-0 items-center gap-1.5 truncate`}
                  >
                    <span className="truncate">
                      {vote.user_name}
                      {vote.user_name === moderator && (
                        <span className="ml-1.5 text-xs text-accent">(mod)</span>
                      )}
                      {isCurrentUser && ' (you)'}
                    </span>
                    {isCurrentUser && (
                      <button
                        type="button"
                        onClick={startRename}
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded hover:bg-accent/20"
                        aria-label="Rename"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-60"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                    )}
                  </span>
                )}
              </div>
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

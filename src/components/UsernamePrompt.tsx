'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useVotingStore } from '@/store/useVotingStore';

export default function UsernamePrompt() {
  const setUserName = useVotingStore((s) => s.setUserName);
  const votes = useVotingStore((s) => s.votes);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Name is required.');
      return;
    }

    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    if (
      votes.some((v) => v.user_name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError('This name is already taken.');
      return;
    }

    setIsLoading(true);
    try {
      await setUserName(trimmed);
    } catch {
      setError('Failed to join. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border p-6"
      >
        <h2 className="text-xl font-semibold">Enter your name</h2>
        <p className="text-sm text-foreground/60">
          Choose a display name for this session.
        </p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="userName" className="text-sm font-medium">
            Name
          </label>
          <input
            ref={inputRef}
            id="userName"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            placeholder="e.g., Alice"
            className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            autoComplete="off"
            disabled={isLoading}
            aria-describedby={error ? 'userName-error' : undefined}
          />
          {error && (
            <p id="userName-error" className="text-sm text-error">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {isLoading ? 'Joining...' : 'Join'}
        </button>
      </form>
    </div>
  );
}

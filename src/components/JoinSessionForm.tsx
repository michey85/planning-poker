'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function JoinSessionForm() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = sessionId.trim();

    if (!trimmed) {
      setError('Session ID is required.');
      return;
    }

    if (!UUID_REGEX.test(trimmed)) {
      setError('Please enter a valid session ID (UUID format).');
      return;
    }

    setError('');
    // TODO: Validate session exists in Supabase before navigating
    console.log('Joining session:', trimmed);
    router.push(`/session/${trimmed}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Join Session</h2>
      <p className="text-sm text-foreground/60">
        Enter a session ID to join an existing session.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="sessionId" className="text-sm font-medium">
          Session ID
        </label>
        <input
          id="sessionId"
          type="text"
          value={sessionId}
          onChange={(e) => {
            setSessionId(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
          className="rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm outline-none transition-colors focus:border-accent"
          autoComplete="off"
        />
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
      <button
        type="submit"
        className="rounded-lg border border-accent bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
      >
        Join Session
      </button>
    </form>
  );
}

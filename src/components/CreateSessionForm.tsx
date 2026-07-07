'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';
import { createSession } from '@/lib/database';

export default function CreateSessionForm() {
  const router = useRouter();
  const [taskName, setTaskName] = useState('');
  const [trackHistory, setTrackHistory] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = taskName.trim();

    if (!trimmed) {
      setError('Task name is required.');
      return;
    }

    if (trimmed.length < 3) {
      setError('Task name must be at least 3 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const session = await createSession(trimmed, trackHistory);
      router.push(`/session/${session.id}`);
    } catch {
      setError('Failed to create session. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Create Session</h2>
      <p className="text-sm text-foreground/60">
        Start a new estimation session for your team.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="taskName" className="text-sm font-medium">
          Task Name
        </label>
        <input
          id="taskName"
          type="text"
          value={taskName}
          onChange={(e) => {
            setTaskName(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g., User authentication flow"
          className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          autoComplete="off"
        />
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={trackHistory}
          onChange={(e) => setTrackHistory(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        Track round history
      </label>
      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Session'}
      </button>
    </form>
  );
}

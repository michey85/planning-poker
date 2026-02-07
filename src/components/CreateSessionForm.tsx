'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

export default function CreateSessionForm() {
  const router = useRouter();
  const [taskName, setTaskName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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
    // TODO: Create session in Supabase, get back session ID
    console.log('Creating session:', trimmed);
    router.push(`/session/${crypto.randomUUID()}`);
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
      <button
        type="submit"
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Create Session
      </button>
    </form>
  );
}

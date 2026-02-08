'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import { useVotingStore } from '@/store/useVotingStore';
import ConnectionAlert from './ConnectionAlert';
import ModeratorControls from './ModeratorControls';
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
  const sessionClosed = useVotingStore((s) => s.sessionClosed);
  const joinSession = useVotingStore((s) => s.joinSession);

  const { connectionStatus } = useRealtimeVotes(storeSessionId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    joinSession(sessionId)
      .catch(() => setError('Session not found.'))
      .finally(() => setLoading(false));
  }, [sessionId, joinSession]);

  useEffect(() => {
    if (userName) {
      mainRef.current?.focus();
    }
  }, [userName]);

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
      <ConnectionAlert status={connectionStatus} />
      <TaskHeader />
      <Link
        href={`/guide?session=${sessionId}`}
        className="self-center text-sm text-foreground/60 transition-colors hover:text-accent"
      >
        What do these values mean?
      </Link>
      <VotingCards />
      <ModeratorControls onSessionClosed={() => router.push('/')} />
      {isRevealed && <VotingResults />}
      <ParticipantsList />
    </div>
  );
}

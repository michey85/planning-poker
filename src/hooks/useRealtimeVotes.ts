'use client';

import { useEffect, useState } from 'react';
import * as db from '@/lib/database';
import { useVotingStore } from '@/store/useVotingStore';
import type { Vote } from '@/types';
import { createClient } from '@/utils/supabase/client';

type ConnectionStatus = 'connecting' | 'connected' | 'error';

export function useRealtimeVotes(sessionId: string | null) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    let deleteTimeout: ReturnType<typeof setTimeout>;

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          useVotingStore.getState().addVote(payload.new as Vote);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'votes',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          useVotingStore.getState().updateVote(payload.new as Vote);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'votes',
        },
        () => {
          clearTimeout(deleteTimeout);
          deleteTimeout = setTimeout(async () => {
            const votes = await db.getVotes(sessionId);
            useVotingStore.getState().syncVotes(votes);
          }, 100);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const { is_revealed, task_name } = payload.new as {
            is_revealed: boolean;
            task_name: string;
          };
          useVotingStore.getState().syncSession({ is_revealed, task_name });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          useVotingStore.getState().markSessionClosed();
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
        } else if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          setConnectionStatus('error');
        }
      });

    return () => {
      clearTimeout(deleteTimeout);
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { connectionStatus };
}

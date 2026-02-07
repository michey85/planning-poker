import type { CardValue, Session, Vote } from '@/types';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// --- Sessions ---

export async function createSession(taskName: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ task_name: taskName })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSession(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select()
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function revealVotes(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ is_revealed: true })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function resetSession(
  sessionId: string,
  taskName?: string,
): Promise<void> {
  const { error: votesError } = await supabase
    .from('votes')
    .update({ value: null })
    .eq('session_id', sessionId);

  if (votesError) throw votesError;

  const sessionUpdate: { is_revealed: boolean; task_name?: string } = {
    is_revealed: false,
  };
  if (taskName !== undefined) {
    sessionUpdate.task_name = taskName;
  }

  const { error: sessionError } = await supabase
    .from('sessions')
    .update(sessionUpdate)
    .eq('id', sessionId);

  if (sessionError) throw sessionError;
}

// --- Votes ---

export async function castVote(
  sessionId: string,
  userName: string,
  value: CardValue | null,
): Promise<Vote> {
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      { session_id: sessionId, user_name: userName, value },
      { onConflict: 'session_id,user_name' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVotes(sessionId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from('votes')
    .select()
    .eq('session_id', sessionId);

  if (error) throw error;
  return data ?? [];
}

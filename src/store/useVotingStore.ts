import { create } from 'zustand';
import * as db from '@/lib/database';
import { pushToast } from '@/lib/toast';
import type { CardValue, Vote } from '@/types';

interface VotingState {
  sessionId: string | null;
  taskName: string | null;
  isRevealed: boolean;

  userName: string | null;
  currentUserVote: string | null;

  votes: Vote[];

  setUserName: (name: string) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  createSession: (taskName: string) => Promise<string>;
  castVote: (value: CardValue) => Promise<void>;
  revealCards: () => Promise<void>;
  resetVoting: (taskName?: string) => Promise<void>;
  syncVotes: (votes: Vote[]) => void;
  addVote: (vote: Vote) => void;
  updateVote: (vote: Vote) => void;
  syncSession: (updates: { is_revealed: boolean; task_name: string }) => void;
}

const initialState = {
  sessionId: null,
  taskName: null,
  isRevealed: false,
  userName: null,
  currentUserVote: null,
  votes: [],
};

export const useVotingStore = create<VotingState>((set, get) => ({
  ...initialState,

  setUserName: async (name) => {
    set({ userName: name });
    const { sessionId } = get();
    if (sessionId) {
      await db.castVote(sessionId, name, null);
    }
  },

  joinSession: async (sessionId) => {
    const session = await db.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    const votes = await db.getVotes(sessionId);
    set({
      sessionId: session.id,
      taskName: session.task_name,
      isRevealed: session.is_revealed,
      votes,
      currentUserVote: null,
    });
  },

  createSession: async (taskName) => {
    const session = await db.createSession(taskName);
    set({
      sessionId: session.id,
      taskName: session.task_name,
      isRevealed: session.is_revealed,
      votes: [],
      currentUserVote: null,
    });
    return session.id;
  },

  castVote: async (value) => {
    const { sessionId, userName, currentUserVote: prevVote } = get();
    if (!sessionId || !userName) throw new Error('No active session or user');
    set({ currentUserVote: value });
    try {
      await db.castVote(sessionId, userName, value);
    } catch {
      set({ currentUserVote: prevVote });
      pushToast('Failed to cast vote. Please try again.', 'error');
    }
  },

  revealCards: async () => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('No active session');
    try {
      await db.revealVotes(sessionId);
      set({ isRevealed: true });
    } catch {
      pushToast('Failed to reveal cards. Please try again.', 'error');
    }
  },

  resetVoting: async (taskName?: string) => {
    const {
      sessionId,
      isRevealed,
      currentUserVote,
      votes,
      taskName: prevTaskName,
    } = get();
    if (!sessionId) throw new Error('No active session');
    set((state) => ({
      isRevealed: false,
      currentUserVote: null,
      votes: state.votes.map((v) => ({ ...v, value: null })),
      ...(taskName !== undefined ? { taskName } : {}),
    }));
    try {
      await db.resetSession(sessionId, taskName);
    } catch {
      set({ isRevealed, currentUserVote, votes, taskName: prevTaskName });
      pushToast('Failed to start new round. Please try again.', 'error');
    }
  },

  syncVotes: (votes) => set({ votes }),

  addVote: (vote) =>
    set((state) => {
      if (state.votes.some((v) => v.id === vote.id)) return state;
      return { votes: [...state.votes, vote] };
    }),

  updateVote: (vote) =>
    set((state) => {
      const votes = state.votes.map((v) => (v.id === vote.id ? vote : v));
      const currentUserVote =
        vote.user_name === state.userName ? vote.value : state.currentUserVote;
      return { votes, currentUserVote };
    }),

  syncSession: (updates) =>
    set((state) => {
      const newRound = !updates.is_revealed && state.isRevealed;
      return {
        isRevealed: updates.is_revealed,
        taskName: updates.task_name,
        ...(newRound ? { currentUserVote: null } : {}),
      };
    }),
}));

export const selectModerator = (state: VotingState): string | null => {
  if (state.votes.length === 0) return null;
  const sorted = [...state.votes].sort(
    (a, b) => new Date(a.voted_at).getTime() - new Date(b.voted_at).getTime(),
  );
  return sorted[0].user_name;
};

export const selectIsModerator = (state: VotingState): boolean => {
  return state.userName !== null && selectModerator(state) === state.userName;
};

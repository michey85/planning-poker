import { create } from 'zustand';
import * as db from '@/lib/database';
import type { CardValue, Vote } from '@/types';

interface VotingState {
  sessionId: string | null;
  taskName: string | null;
  isRevealed: boolean;

  userName: string | null;
  currentUserVote: string | null;

  votes: Vote[];

  setUserName: (name: string) => void;
  joinSession: (sessionId: string) => Promise<void>;
  createSession: (taskName: string) => Promise<string>;
  castVote: (value: CardValue) => Promise<void>;
  revealCards: () => Promise<void>;
  resetVoting: () => Promise<void>;
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

  setUserName: (name) => set({ userName: name }),

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
    const { sessionId, userName } = get();
    if (!sessionId || !userName) throw new Error('No active session or user');
    set({ currentUserVote: value });
    await db.castVote(sessionId, userName, value);
  },

  revealCards: async () => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('No active session');
    await db.revealVotes(sessionId);
    set({ isRevealed: true });
  },

  resetVoting: async () => {
    const { sessionId } = get();
    if (!sessionId) throw new Error('No active session');
    await db.resetSession(sessionId);
    set({ isRevealed: false, votes: [], currentUserVote: null });
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

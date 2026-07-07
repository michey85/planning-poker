import { act } from 'react';
import * as db from '@/lib/database';
import * as sessionStorage from '@/lib/sessionStorage';
import * as toast from '@/lib/toast';
import type { Round, Vote } from '@/types';
import {
  selectIsModerator,
  selectModerator,
  useVotingStore,
} from '../useVotingStore';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/database');
jest.mock('@/lib/sessionStorage');
jest.mock('@/lib/toast');

const mockDb = db as jest.Mocked<typeof db>;
const mockStorage = sessionStorage as jest.Mocked<typeof sessionStorage>;
const mockToast = toast as jest.Mocked<typeof toast>;

function makeVote(overrides: Partial<Vote> = {}): Vote {
  return {
    id: 'v1',
    session_id: 's1',
    user_name: 'Alice',
    value: '5',
    voted_at: '2024-01-01T10:00:00Z',
    ...overrides,
  };
}

function makeRound(overrides: Partial<Round> = {}): Round {
  return {
    id: 'r1',
    session_id: 's1',
    round_number: 1,
    task_name: 'Task A',
    consensus_value: '5',
    created_at: '2024-01-01T10:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useVotingStore.setState({
    sessionId: null,
    taskName: null,
    isRevealed: false,
    sessionClosed: false,
    historyEnabled: true,
    userName: null,
    currentUserVote: null,
    votes: [],
    rounds: [],
  });
});

// --- Synchronous actions ---

describe('syncVotes', () => {
  it('replaces votes in state', () => {
    const votes = [makeVote()];
    act(() => useVotingStore.getState().syncVotes(votes));
    expect(useVotingStore.getState().votes).toEqual(votes);
  });
});

describe('addVote', () => {
  it('adds a new vote', () => {
    const vote = makeVote();
    act(() => useVotingStore.getState().addVote(vote));
    expect(useVotingStore.getState().votes).toHaveLength(1);
  });

  it('ignores duplicate vote by id', () => {
    const vote = makeVote();
    act(() => {
      useVotingStore.getState().addVote(vote);
      useVotingStore.getState().addVote(vote);
    });
    expect(useVotingStore.getState().votes).toHaveLength(1);
  });
});

describe('updateVote', () => {
  it('updates an existing vote', () => {
    const vote = makeVote({ value: '3' });
    useVotingStore.setState({ votes: [vote] });

    act(() => useVotingStore.getState().updateVote({ ...vote, value: '8' }));

    expect(useVotingStore.getState().votes[0].value).toBe('8');
  });

  it('updates currentUserVote when it is the current user', () => {
    const vote = makeVote({ user_name: 'Alice', value: '3' });
    useVotingStore.setState({ votes: [vote], userName: 'Alice' });

    act(() => useVotingStore.getState().updateVote({ ...vote, value: '8' }));

    expect(useVotingStore.getState().currentUserVote).toBe('8');
  });

  it('does not update currentUserVote for other users', () => {
    const vote = makeVote({ user_name: 'Bob', value: '3' });
    useVotingStore.setState({
      votes: [vote],
      userName: 'Alice',
      currentUserVote: '5',
    });

    act(() => useVotingStore.getState().updateVote({ ...vote, value: '8' }));

    expect(useVotingStore.getState().currentUserVote).toBe('5');
  });
});

describe('addRound', () => {
  it('adds a new round', () => {
    const round = makeRound();
    act(() => useVotingStore.getState().addRound(round));
    expect(useVotingStore.getState().rounds).toHaveLength(1);
  });

  it('ignores duplicate round by id', () => {
    const round = makeRound();
    act(() => {
      useVotingStore.getState().addRound(round);
      useVotingStore.getState().addRound(round);
    });
    expect(useVotingStore.getState().rounds).toHaveLength(1);
  });
});

describe('markSessionClosed', () => {
  it('sets sessionClosed to true', () => {
    act(() => useVotingStore.getState().markSessionClosed());
    expect(useVotingStore.getState().sessionClosed).toBe(true);
  });
});

describe('syncSession', () => {
  it('updates isRevealed and taskName', () => {
    act(() =>
      useVotingStore
        .getState()
        .syncSession({ is_revealed: true, task_name: 'New Task' }),
    );
    expect(useVotingStore.getState().isRevealed).toBe(true);
    expect(useVotingStore.getState().taskName).toBe('New Task');
  });

  it('clears currentUserVote when transitioning from revealed to unrevealed (new round)', () => {
    useVotingStore.setState({ isRevealed: true, currentUserVote: '5' });
    act(() =>
      useVotingStore
        .getState()
        .syncSession({ is_revealed: false, task_name: 'Task' }),
    );
    expect(useVotingStore.getState().currentUserVote).toBeNull();
  });

  it('preserves currentUserVote when revealed stays revealed', () => {
    useVotingStore.setState({ isRevealed: true, currentUserVote: '5' });
    act(() =>
      useVotingStore
        .getState()
        .syncSession({ is_revealed: true, task_name: 'Task' }),
    );
    expect(useVotingStore.getState().currentUserVote).toBe('5');
  });
});

// --- Async actions ---

describe('createSession', () => {
  it('creates a session and updates state', async () => {
    const session = {
      id: 's1',
      task_name: 'Sprint task',
      is_revealed: false,
      history_enabled: true,
      created_at: '',
    };
    mockDb.createSession.mockResolvedValue(session);

    await act(async () => {
      await useVotingStore.getState().createSession('Sprint task');
    });

    const state = useVotingStore.getState();
    expect(state.sessionId).toBe('s1');
    expect(state.taskName).toBe('Sprint task');
    expect(state.isRevealed).toBe(false);
    expect(state.votes).toEqual([]);
  });

  it('returns the new session id', async () => {
    mockDb.createSession.mockResolvedValue({
      id: 's42',
      task_name: 'T',
      is_revealed: false,
      history_enabled: true,
      created_at: '',
    });
    let id: string | undefined;
    await act(async () => {
      id = await useVotingStore.getState().createSession('T');
    });
    expect(id).toBe('s42');
  });
});

describe('joinSession', () => {
  const session = {
    id: 's1',
    task_name: 'Auth',
    is_revealed: false,
    history_enabled: true,
    created_at: '',
  };
  const votes = [makeVote({ user_name: 'Alice', value: '3' })];
  const rounds = [makeRound()];

  beforeEach(() => {
    mockDb.getSession.mockResolvedValue(session);
    mockDb.getVotes.mockResolvedValue(votes);
    mockDb.getRounds.mockResolvedValue(rounds);
  });

  it('loads session, votes and rounds into state', async () => {
    mockStorage.getStoredUserName.mockReturnValue(null);
    await act(async () => {
      await useVotingStore.getState().joinSession('s1');
    });
    const state = useVotingStore.getState();
    expect(state.sessionId).toBe('s1');
    expect(state.votes).toEqual(votes);
    expect(state.rounds).toEqual(rounds);
  });

  it('restores userName and currentUserVote from storage when name matches', async () => {
    mockStorage.getStoredUserName.mockReturnValue('alice');
    await act(async () => {
      await useVotingStore.getState().joinSession('s1');
    });
    expect(useVotingStore.getState().userName).toBe('Alice');
    expect(useVotingStore.getState().currentUserVote).toBe('3');
  });

  it('clears storage when stored name has no matching vote', async () => {
    mockStorage.getStoredUserName.mockReturnValue('Unknown');
    await act(async () => {
      await useVotingStore.getState().joinSession('s1');
    });
    expect(mockStorage.removeStoredUserName).toHaveBeenCalledWith('s1');
    expect(useVotingStore.getState().userName).toBeNull();
  });

  it('throws when session not found', async () => {
    mockDb.getSession.mockResolvedValue(null);
    await expect(
      act(async () => {
        await useVotingStore.getState().joinSession('bad');
      }),
    ).rejects.toThrow('Session not found');
  });
});

describe('setUserName', () => {
  it('sets userName in state', async () => {
    await act(async () => {
      await useVotingStore.getState().setUserName('Alice');
    });
    expect(useVotingStore.getState().userName).toBe('Alice');
  });

  it('does not call db or storage when no active session', async () => {
    await act(async () => {
      await useVotingStore.getState().setUserName('Alice');
    });
    expect(mockDb.castVote).not.toHaveBeenCalled();
    expect(mockStorage.setStoredUserName).not.toHaveBeenCalled();
  });

  it('stores name and casts null vote when session active', async () => {
    useVotingStore.setState({ sessionId: 's1' });
    const vote = makeVote({ value: null });
    mockDb.castVote.mockResolvedValue(vote);

    await act(async () => {
      await useVotingStore.getState().setUserName('Alice');
    });

    expect(mockStorage.setStoredUserName).toHaveBeenCalledWith('s1', 'Alice');
    expect(mockDb.castVote).toHaveBeenCalledWith('s1', 'Alice', null);
  });
});

describe('castVote', () => {
  beforeEach(() => {
    useVotingStore.setState({
      sessionId: 's1',
      userName: 'Alice',
      currentUserVote: null,
    });
  });

  it('optimistically sets currentUserVote', async () => {
    mockDb.castVote.mockResolvedValue(makeVote({ value: '5' }));
    await act(async () => {
      await useVotingStore.getState().castVote('5');
    });
    expect(useVotingStore.getState().currentUserVote).toBe('5');
  });

  it('rolls back vote and shows toast on db failure', async () => {
    useVotingStore.setState({ currentUserVote: '3' });
    mockDb.castVote.mockRejectedValue(new Error('db error'));

    await act(async () => {
      await useVotingStore.getState().castVote('8');
    });

    expect(useVotingStore.getState().currentUserVote).toBe('3');
    expect(mockToast.pushToast).toHaveBeenCalledWith(
      expect.any(String),
      'error',
    );
  });

  it('throws when no session', async () => {
    useVotingStore.setState({ sessionId: null });
    await expect(
      act(async () => {
        await useVotingStore.getState().castVote('5');
      }),
    ).rejects.toThrow();
  });
});

describe('revealCards', () => {
  it('reveals cards and sets isRevealed', async () => {
    useVotingStore.setState({ sessionId: 's1' });
    mockDb.revealVotes.mockResolvedValue(undefined);

    await act(async () => {
      await useVotingStore.getState().revealCards();
    });

    expect(useVotingStore.getState().isRevealed).toBe(true);
  });

  it('shows toast on failure', async () => {
    useVotingStore.setState({ sessionId: 's1' });
    mockDb.revealVotes.mockRejectedValue(new Error('fail'));

    await act(async () => {
      await useVotingStore.getState().revealCards();
    });

    expect(mockToast.pushToast).toHaveBeenCalledWith(
      expect.any(String),
      'error',
    );
    expect(useVotingStore.getState().isRevealed).toBe(false);
  });
});

describe('resetVoting', () => {
  beforeEach(() => {
    useVotingStore.setState({
      sessionId: 's1',
      taskName: 'Old Task',
      isRevealed: true,
      currentUserVote: '5',
      votes: [makeVote({ value: '5' })],
      rounds: [],
    });
    mockDb.saveRound.mockResolvedValue(makeRound());
    mockDb.resetSession.mockResolvedValue(undefined);
  });

  it('clears votes and resets isRevealed', async () => {
    await act(async () => {
      await useVotingStore.getState().resetVoting('5');
    });
    const state = useVotingStore.getState();
    expect(state.isRevealed).toBe(false);
    expect(state.currentUserVote).toBeNull();
    expect(state.votes[0].value).toBeNull();
  });

  it('updates taskName when provided', async () => {
    await act(async () => {
      await useVotingStore.getState().resetVoting('5', 'New Task');
    });
    expect(useVotingStore.getState().taskName).toBe('New Task');
  });

  it('preserves taskName when not provided', async () => {
    await act(async () => {
      await useVotingStore.getState().resetVoting('5');
    });
    expect(useVotingStore.getState().taskName).toBe('Old Task');
  });

  it('shows toast and returns early when saveRound fails', async () => {
    mockDb.saveRound.mockRejectedValue(new Error('fail'));
    await act(async () => {
      await useVotingStore.getState().resetVoting('5');
    });
    expect(mockToast.pushToast).toHaveBeenCalledWith(
      expect.any(String),
      'error',
    );
    expect(mockDb.resetSession).not.toHaveBeenCalled();
  });

  it('rolls back and shows toast when resetSession fails', async () => {
    mockDb.resetSession.mockRejectedValue(new Error('fail'));
    await act(async () => {
      await useVotingStore.getState().resetVoting('5');
    });
    expect(mockToast.pushToast).toHaveBeenCalledWith(
      expect.any(String),
      'error',
    );
    expect(useVotingStore.getState().isRevealed).toBe(true);
  });
});

describe('renameUser', () => {
  beforeEach(() => {
    useVotingStore.setState({ sessionId: 's1', userName: 'Alice' });
    mockDb.renameUser.mockResolvedValue(makeVote({ user_name: 'Bob' }));
  });

  it('updates userName and persists to storage', async () => {
    await act(async () => {
      await useVotingStore.getState().renameUser('Bob');
    });
    expect(useVotingStore.getState().userName).toBe('Bob');
    expect(mockStorage.setStoredUserName).toHaveBeenCalledWith('s1', 'Bob');
  });

  it('rolls back and throws on failure', async () => {
    mockDb.renameUser.mockRejectedValue(new Error('fail'));
    await expect(
      act(async () => {
        await useVotingStore.getState().renameUser('Bob');
      }),
    ).rejects.toThrow('Rename failed');
    expect(useVotingStore.getState().userName).toBe('Alice');
    expect(mockToast.pushToast).toHaveBeenCalledWith(
      expect.any(String),
      'error',
    );
  });
});

describe('closeSession', () => {
  beforeEach(() => {
    useVotingStore.setState({ sessionId: 's1', userName: 'Alice' });
    mockDb.deleteSession.mockResolvedValue(undefined);
  });

  it('resets state and removes stored name', async () => {
    await act(async () => {
      await useVotingStore.getState().closeSession();
    });
    expect(useVotingStore.getState().sessionId).toBeNull();
    expect(mockStorage.removeStoredUserName).toHaveBeenCalledWith('s1');
  });

  it('shows toast and throws on failure', async () => {
    mockDb.deleteSession.mockRejectedValue(new Error('fail'));
    await expect(
      act(async () => {
        await useVotingStore.getState().closeSession();
      }),
    ).rejects.toThrow('Close session failed');
    expect(mockToast.pushToast).toHaveBeenCalledWith(
      expect.any(String),
      'error',
    );
  });
});

// --- Selectors ---

describe('selectModerator', () => {
  it('returns null when no votes', () => {
    expect(selectModerator({ votes: [] } as never)).toBeNull();
  });

  it('returns the user with the earliest voted_at', () => {
    const state = {
      votes: [
        makeVote({ user_name: 'Bob', voted_at: '2024-01-01T10:01:00Z' }),
        makeVote({ user_name: 'Alice', voted_at: '2024-01-01T10:00:00Z' }),
      ],
    };
    expect(selectModerator(state as never)).toBe('Alice');
  });
});

describe('selectIsModerator', () => {
  it('returns false when userName is null', () => {
    const state = {
      userName: null,
      votes: [
        makeVote({ user_name: 'Alice', voted_at: '2024-01-01T10:00:00Z' }),
      ],
    };
    expect(selectIsModerator(state as never)).toBe(false);
  });

  it('returns true when current user is the first voter', () => {
    const state = {
      userName: 'Alice',
      votes: [
        makeVote({ user_name: 'Alice', voted_at: '2024-01-01T10:00:00Z' }),
      ],
    };
    expect(selectIsModerator(state as never)).toBe(true);
  });

  it('returns false when current user is not the first voter', () => {
    const state = {
      userName: 'Bob',
      votes: [
        makeVote({ user_name: 'Alice', voted_at: '2024-01-01T10:00:00Z' }),
        makeVote({
          id: 'v2',
          user_name: 'Bob',
          voted_at: '2024-01-01T10:01:00Z',
        }),
      ],
    };
    expect(selectIsModerator(state as never)).toBe(false);
  });
});

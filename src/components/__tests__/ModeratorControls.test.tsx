import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVotingStore } from '@/store/useVotingStore';
import ModeratorControls from '../ModeratorControls';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/store/useVotingStore', () => ({
  ...jest.requireActual('@/store/useVotingStore'),
  useVotingStore: jest.fn(),
}));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<
  typeof useVotingStore
>;

const mockRevealCards = jest.fn();
const mockResetVoting = jest.fn();
const mockCloseSession = jest.fn();

function makeVote(userName: string, value: string | null, votedAt: string) {
  return {
    id: 'v1',
    session_id: 's1',
    user_name: userName,
    value,
    voted_at: votedAt,
  };
}

function setupStore({
  isRevealed = false,
  taskName = 'Build auth',
  votes = [] as ReturnType<typeof makeVote>[],
  userName = 'Alice',
  historyEnabled = true,
}: {
  isRevealed?: boolean;
  taskName?: string;
  votes?: ReturnType<typeof makeVote>[];
  userName?: string;
  historyEnabled?: boolean;
} = {}) {
  const state = {
    isRevealed,
    taskName,
    votes,
    userName,
    historyEnabled,
    revealCards: mockRevealCards,
    resetVoting: mockResetVoting,
    closeSession: mockCloseSession,
  };
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector(state),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRevealCards.mockResolvedValue(undefined);
  mockResetVoting.mockResolvedValue(undefined);
  mockCloseSession.mockResolvedValue(undefined);
  window.confirm = jest.fn().mockReturnValue(true);
});

const moderatorVotes = [
  makeVote('Alice', '3', '2024-01-01T10:00:00Z'),
  makeVote('Bob', '5', '2024-01-01T10:01:00Z'),
];

describe('ModeratorControls — not revealed', () => {
  it('shows Reveal Cards button for moderator', () => {
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Reveal Cards' }),
    ).toBeInTheDocument();
  });

  it('shows waiting message for non-moderator', () => {
    setupStore({ votes: moderatorVotes, userName: 'Bob' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(
      screen.getByText('Waiting for moderator to reveal...'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reveal Cards' })).toBeNull();
  });

  it('calls revealCards when Reveal Cards is clicked', async () => {
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reveal Cards' }));
    expect(mockRevealCards).toHaveBeenCalledTimes(1);
  });

  it('shows Revealing... and disables button while async call is in flight', async () => {
    let resolve!: () => void;
    mockRevealCards.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reveal Cards' }));
    expect(screen.getByRole('button', { name: 'Revealing...' })).toBeDisabled();
    await act(async () => {
      resolve();
    });
  });

  it('adds animate-pulse when all participants have voted', () => {
    const allVoted = [
      makeVote('Alice', '3', '2024-01-01T10:00:00Z'),
      makeVote('Bob', '5', '2024-01-01T10:01:00Z'),
    ];
    setupStore({ votes: allVoted, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Reveal Cards' })).toHaveClass(
      'animate-pulse',
    );
  });

  it('does not add animate-pulse when some votes are pending', () => {
    const partial = [
      makeVote('Alice', '3', '2024-01-01T10:00:00Z'),
      makeVote('Bob', null, '2024-01-01T10:01:00Z'),
    ];
    setupStore({ votes: partial, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Reveal Cards' }),
    ).not.toHaveClass('animate-pulse');
  });
});

describe('ModeratorControls — revealed', () => {
  it('shows New Round button for moderator', () => {
    setupStore({ isRevealed: true, votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: 'New Round' }),
    ).toBeInTheDocument();
  });

  it('shows waiting message for non-moderator after reveal', () => {
    setupStore({ isRevealed: true, votes: moderatorVotes, userName: 'Bob' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(screen.getByText('Waiting for next round...')).toBeInTheDocument();
  });

  it('clicking New Round shows the round form pre-filled with current task name', async () => {
    setupStore({
      isRevealed: true,
      votes: moderatorVotes,
      userName: 'Alice',
      taskName: 'Build auth',
    });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Round' }));
    expect(screen.getByPlaceholderText('Task name for next round')).toHaveValue(
      'Build auth',
    );
  });

  it('pre-selects consensus value when all votes are unanimous', async () => {
    const unanimous = [
      makeVote('Alice', '5', '2024-01-01T10:00:00Z'),
      makeVote('Bob', '5', '2024-01-01T10:01:00Z'),
    ];
    setupStore({ isRevealed: true, votes: unanimous, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Round' }));
    const startBtn = screen.getByRole('button', { name: 'Start Round' });
    expect(startBtn).not.toBeDisabled();
  });

  it('does not pre-select consensus value when votes differ', async () => {
    setupStore({ isRevealed: true, votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Round' }));
    expect(screen.getByRole('button', { name: 'Start Round' })).toBeDisabled();
  });

  it('Start Round calls resetVoting with selected consensus and task name', async () => {
    setupStore({
      isRevealed: true,
      votes: moderatorVotes,
      userName: 'Alice',
      taskName: 'Build auth',
    });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Round' }));
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    await userEvent.clear(
      screen.getByPlaceholderText('Task name for next round'),
    );
    await userEvent.type(
      screen.getByPlaceholderText('Task name for next round'),
      'New task',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Start Round' }));
    await waitFor(() =>
      expect(mockResetVoting).toHaveBeenCalledWith('5', 'New task'),
    );
  });

  it('Start Round passes undefined for task name when unchanged', async () => {
    setupStore({
      isRevealed: true,
      votes: moderatorVotes,
      userName: 'Alice',
      taskName: 'Build auth',
    });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Round' }));
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start Round' }));
    await waitFor(() =>
      expect(mockResetVoting).toHaveBeenCalledWith('3', undefined),
    );
  });

  it('hides consensus buttons and allows starting without one when historyEnabled is false', async () => {
    setupStore({
      isRevealed: true,
      votes: moderatorVotes,
      userName: 'Alice',
      taskName: 'Build auth',
      historyEnabled: false,
    });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Round' }));
    expect(screen.queryByText('Consensus:')).not.toBeInTheDocument();
    const startBtn = screen.getByRole('button', { name: 'Start Round' });
    expect(startBtn).not.toBeDisabled();
    await userEvent.click(startBtn);
    await waitFor(() =>
      expect(mockResetVoting).toHaveBeenCalledWith(null, undefined),
    );
  });

  it('Cancel hides the round form', async () => {
    setupStore({ isRevealed: true, votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Round' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByPlaceholderText('Task name for next round'),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'New Round' }),
    ).toBeInTheDocument();
  });
});

describe('ModeratorControls — Close Session', () => {
  it('shows Close Session button only for moderator', () => {
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Close Session' }),
    ).toBeInTheDocument();
  });

  it('does not show Close Session button for non-moderator', () => {
    setupStore({ votes: moderatorVotes, userName: 'Bob' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Close Session' })).toBeNull();
  });

  it('calls closeSession and onSessionClosed after confirmation', async () => {
    const onSessionClosed = jest.fn();
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={onSessionClosed} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Close Session' }),
    );
    await waitFor(() => expect(mockCloseSession).toHaveBeenCalledTimes(1));
    expect(onSessionClosed).toHaveBeenCalledTimes(1);
  });

  it('does not call closeSession when user cancels confirmation', async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Close Session' }),
    );
    expect(mockCloseSession).not.toHaveBeenCalled();
  });

  it('shows Closing... and disables button while async call is in flight', async () => {
    let resolve!: () => void;
    mockCloseSession.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Close Session' }),
    );
    expect(screen.getByRole('button', { name: 'Closing...' })).toBeDisabled();
    await act(async () => {
      resolve();
    });
  });

  it('re-enables button if closeSession throws', async () => {
    mockCloseSession.mockRejectedValue(new Error('Network error'));
    setupStore({ votes: moderatorVotes, userName: 'Alice' });
    render(<ModeratorControls onSessionClosed={jest.fn()} />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Close Session' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Close Session' }),
      ).not.toBeDisabled(),
    );
  });
});

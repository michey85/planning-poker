import { render, screen, waitFor } from '@testing-library/react';
import { useVotingStore } from '@/store/useVotingStore';
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes';
import SessionRoom from '../SessionRoom';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));

jest.mock('@/hooks/useRealtimeVotes', () => ({
  useRealtimeVotes: jest.fn(),
}));

jest.mock('@/store/useVotingStore', () => ({
  ...jest.requireActual('@/store/useVotingStore'),
  useVotingStore: jest.fn(),
}));

// Mock all child components to isolate SessionRoom logic
jest.mock('../ConnectionAlert', () => () => (
  <div data-testid="connection-alert" />
));
jest.mock('../TaskHeader', () => () => <div data-testid="task-header" />);
jest.mock('../VotingCards', () => () => <div data-testid="voting-cards" />);
jest.mock(
  '../ModeratorControls',
  () =>
    ({ onSessionClosed }: { onSessionClosed: () => void }) => (
      <button data-testid="moderator-controls" onClick={onSessionClosed}>
        close
      </button>
    ),
);
jest.mock('../VotingResults', () => () => <div data-testid="voting-results" />);
jest.mock('../ParticipantsList', () => () => (
  <div data-testid="participants-list" />
));
jest.mock('../RoundHistory', () => () => <div data-testid="round-history" />);
jest.mock('../UsernamePrompt', () => () => (
  <div data-testid="username-prompt" />
));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<
  typeof useVotingStore
>;
const mockUseRealtimeVotes = useRealtimeVotes as jest.MockedFunction<
  typeof useRealtimeVotes
>;

const mockJoinSession = jest.fn();

function setupStore({
  userName = 'Alice',
  isRevealed = false,
  sessionId = 'session-1',
  sessionClosed = false,
  historyEnabled = true,
}: {
  userName?: string | null;
  isRevealed?: boolean;
  sessionId?: string | null;
  sessionClosed?: boolean;
  historyEnabled?: boolean;
} = {}) {
  const state = {
    userName,
    isRevealed,
    sessionId,
    sessionClosed,
    historyEnabled,
    joinSession: mockJoinSession,
  };
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector(state),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRealtimeVotes.mockReturnValue({ connectionStatus: 'connected' });
  mockJoinSession.mockResolvedValue(undefined);
  setupStore();
});

describe('SessionRoom — loading state', () => {
  it('shows loading indicator while joinSession is pending', () => {
    mockJoinSession.mockReturnValue(new Promise(() => {})); // never resolves
    render(<SessionRoom sessionId="session-1" />);
    expect(screen.getByText('Loading session...')).toBeInTheDocument();
  });

  it('hides loading indicator after joinSession resolves', async () => {
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() =>
      expect(screen.queryByText('Loading session...')).not.toBeInTheDocument(),
    );
  });
});

describe('SessionRoom — error state', () => {
  it('shows error message when session is not found', async () => {
    mockJoinSession.mockRejectedValue(new Error('not found'));
    render(<SessionRoom sessionId="bad-id" />);
    await waitFor(() =>
      expect(screen.getByText('Session not found.')).toBeInTheDocument(),
    );
  });

  it('does not render room UI on error', async () => {
    mockJoinSession.mockRejectedValue(new Error('not found'));
    render(<SessionRoom sessionId="bad-id" />);
    await waitFor(() => screen.getByText('Session not found.'));
    expect(screen.queryByTestId('voting-cards')).not.toBeInTheDocument();
  });
});

describe('SessionRoom — username prompt', () => {
  it('shows UsernamePrompt when userName is not set', async () => {
    setupStore({ userName: null });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() =>
      expect(screen.getByTestId('username-prompt')).toBeInTheDocument(),
    );
  });

  it('does not show room UI when userName is missing', async () => {
    setupStore({ userName: null });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() => screen.getByTestId('username-prompt'));
    expect(screen.queryByTestId('voting-cards')).not.toBeInTheDocument();
  });
});

describe('SessionRoom — closed session', () => {
  it('shows closed message when sessionClosed is true', async () => {
    setupStore({ sessionClosed: true });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() =>
      expect(
        screen.getByText('Session was closed by the moderator.'),
      ).toBeInTheDocument(),
    );
  });

  it('renders "Return to Home" link pointing to /', async () => {
    setupStore({ sessionClosed: true });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'Return to Home' });
      expect(link).toHaveAttribute('href', '/');
    });
  });

  it('does not render room UI when session is closed', async () => {
    setupStore({ sessionClosed: true });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() =>
      screen.getByText('Session was closed by the moderator.'),
    );
    expect(screen.queryByTestId('voting-cards')).not.toBeInTheDocument();
  });
});

describe('SessionRoom — main room', () => {
  it('renders core room components after loading', async () => {
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() => {
      expect(screen.getByTestId('connection-alert')).toBeInTheDocument();
      expect(screen.getByTestId('task-header')).toBeInTheDocument();
      expect(screen.getByTestId('voting-cards')).toBeInTheDocument();
      expect(screen.getByTestId('moderator-controls')).toBeInTheDocument();
      expect(screen.getByTestId('participants-list')).toBeInTheDocument();
      expect(screen.getByTestId('round-history')).toBeInTheDocument();
    });
  });

  it('does not render RoundHistory when historyEnabled is false', async () => {
    setupStore({ historyEnabled: false });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() => screen.getByTestId('voting-cards'));
    expect(screen.queryByTestId('round-history')).not.toBeInTheDocument();
  });

  it('renders guide link with correct session id', async () => {
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() => {
      const link = screen.getByRole('link', {
        name: /what do these values mean/i,
      });
      expect(link).toHaveAttribute('href', '/guide?session=session-1');
    });
  });

  it('does not render VotingResults when not revealed', async () => {
    setupStore({ isRevealed: false });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() => screen.getByTestId('voting-cards'));
    expect(screen.queryByTestId('voting-results')).not.toBeInTheDocument();
  });

  it('renders VotingResults when isRevealed is true', async () => {
    setupStore({ isRevealed: true });
    render(<SessionRoom sessionId="session-1" />);
    await waitFor(() =>
      expect(screen.getByTestId('voting-results')).toBeInTheDocument(),
    );
  });
});

describe('SessionRoom — router integration', () => {
  it('calls router.push("/") when onSessionClosed is triggered', async () => {
    const { getByTestId } = render(<SessionRoom sessionId="session-1" />);
    await waitFor(() => getByTestId('moderator-controls'));
    getByTestId('moderator-controls').click();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

describe('SessionRoom — realtime hook', () => {
  it('passes the store sessionId to useRealtimeVotes', async () => {
    setupStore({ sessionId: 'abc-123' });
    render(<SessionRoom sessionId="session-url-id" />);
    await waitFor(() =>
      expect(mockUseRealtimeVotes).toHaveBeenCalledWith('abc-123'),
    );
  });
});

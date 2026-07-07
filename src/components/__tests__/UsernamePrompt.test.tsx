import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVotingStore } from '@/store/useVotingStore';
import UsernamePrompt from '../UsernamePrompt';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/store/useVotingStore', () => ({
  ...jest.requireActual('@/store/useVotingStore'),
  useVotingStore: jest.fn(),
}));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<
  typeof useVotingStore
>;
const mockSetUserName = jest.fn();

function makeVote(userName: string) {
  return {
    id: 'v1',
    session_id: 's1',
    user_name: userName,
    value: '3',
    voted_at: '',
  };
}

function setupStore({ votes = [] as ReturnType<typeof makeVote>[] } = {}) {
  const state = { setUserName: mockSetUserName, votes };
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector(state),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockSetUserName.mockResolvedValue(undefined);
  setupStore();
});

describe('UsernamePrompt — rendering', () => {
  it('renders the form with heading and input', () => {
    render(<UsernamePrompt />);
    expect(
      screen.getByRole('heading', { name: 'Enter your name' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join' })).toBeInTheDocument();
  });
});

describe('UsernamePrompt — validation', () => {
  it('shows error when submitting empty name', async () => {
    render(<UsernamePrompt />);
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(mockSetUserName).not.toHaveBeenCalled();
  });

  it('shows error when submitting whitespace-only name', async () => {
    render(<UsernamePrompt />);
    await userEvent.type(screen.getByLabelText('Name'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
  });

  it('shows error when name is less than 2 characters', async () => {
    render(<UsernamePrompt />);
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(
      screen.getByText('Name must be at least 2 characters.'),
    ).toBeInTheDocument();
  });

  it('shows error when name is already taken (case-insensitive)', async () => {
    setupStore({ votes: [makeVote('Alice')] });
    render(<UsernamePrompt />);
    await userEvent.type(screen.getByLabelText('Name'), 'alice');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByText('This name is already taken.')).toBeInTheDocument();
  });

  it('clears error when user starts typing after an error', async () => {
    render(<UsernamePrompt />);
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Name'), 'A');
    expect(screen.queryByText('Name is required.')).toBeNull();
  });
});

describe('UsernamePrompt — submission', () => {
  it('calls setUserName with trimmed name on valid submit', async () => {
    render(<UsernamePrompt />);
    await userEvent.type(screen.getByLabelText('Name'), '  Bob  ');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    await waitFor(() => expect(mockSetUserName).toHaveBeenCalledWith('Bob'));
  });

  it('shows Joining... and disables button while submitting', async () => {
    let resolve!: () => void;
    mockSetUserName.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    render(<UsernamePrompt />);
    await userEvent.type(screen.getByLabelText('Name'), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByRole('button', { name: 'Joining...' })).toBeDisabled();
    await act(async () => {
      resolve();
    });
  });

  it('shows error and re-enables button if setUserName throws', async () => {
    mockSetUserName.mockRejectedValue(new Error('Network error'));
    render(<UsernamePrompt />);
    await userEvent.type(screen.getByLabelText('Name'), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    await waitFor(() =>
      expect(
        screen.getByText('Failed to join. Please try again.'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Join' })).not.toBeDisabled();
  });

  it('input is disabled while submitting', async () => {
    let resolve!: () => void;
    mockSetUserName.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    render(<UsernamePrompt />);
    await userEvent.type(screen.getByLabelText('Name'), 'Alice');
    await userEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect(screen.getByLabelText('Name')).toBeDisabled();
    await act(async () => {
      resolve();
    });
  });
});

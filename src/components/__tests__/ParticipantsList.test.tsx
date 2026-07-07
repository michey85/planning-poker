import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVotingStore } from '@/store/useVotingStore';
import ParticipantsList from '../ParticipantsList';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/store/useVotingStore', () => ({
  ...jest.requireActual('@/store/useVotingStore'),
  useVotingStore: jest.fn(),
}));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<
  typeof useVotingStore
>;
const mockRenameUser = jest.fn();

function makeVote(
  id: string,
  userName: string,
  value: string | null,
  votedAt: string,
) {
  return {
    id,
    session_id: 's1',
    user_name: userName,
    value,
    voted_at: votedAt,
  };
}

function setupStore({
  votes = [] as ReturnType<typeof makeVote>[],
  isRevealed = false,
  userName = 'Alice',
}: {
  votes?: ReturnType<typeof makeVote>[];
  isRevealed?: boolean;
  userName?: string;
} = {}) {
  const state = { votes, isRevealed, userName, renameUser: mockRenameUser };
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector(state),
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRenameUser.mockResolvedValue(undefined);
});

const twoVotes = [
  makeVote('v1', 'Alice', '3', '2024-01-01T10:00:00Z'),
  makeVote('v2', 'Bob', '5', '2024-01-01T10:01:00Z'),
];

describe('ParticipantsList — rendering', () => {
  it('shows "No participants yet" when votes is empty', () => {
    setupStore();
    render(<ParticipantsList />);
    expect(screen.getByText('No participants yet')).toBeInTheDocument();
  });

  it('renders participant names', () => {
    setupStore({ votes: twoVotes });
    render(<ParticipantsList />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it('shows "(you)" label for current user', () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    expect(screen.getByText(/Alice.*\(you\)/)).toBeInTheDocument();
  });

  it('shows "(mod)" label for first voter', () => {
    setupStore({ votes: twoVotes, userName: 'Bob' });
    render(<ParticipantsList />);
    const modLabel = screen.getByText('(mod)');
    expect(modLabel).toBeInTheDocument();
    // mod label is inside the same truncate span as Alice's name
    expect(modLabel.parentElement?.textContent).toContain('Alice');
  });

  it('shows Rename button only for current user', () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
  });

  it('shows the Participants heading', () => {
    setupStore();
    render(<ParticipantsList />);
    expect(screen.getByText('Participants')).toBeInTheDocument();
  });
});

describe('ParticipantsList — card flip', () => {
  it('does not apply card-flipped class when not revealed', () => {
    setupStore({ votes: twoVotes, isRevealed: false });
    render(<ParticipantsList />);
    const cards = document.querySelectorAll('.card-flip');
    cards.forEach((card) => expect(card).not.toHaveClass('card-flipped'));
  });

  it('applies card-flipped class to all cards when revealed', () => {
    setupStore({ votes: twoVotes, isRevealed: true });
    render(<ParticipantsList />);
    const cards = document.querySelectorAll('.card-flip');
    expect(cards.length).toBe(2);
    cards.forEach((card) => expect(card).toHaveClass('card-flipped'));
  });

  it('shows vote value on front when revealed', () => {
    setupStore({ votes: twoVotes, isRevealed: true });
    render(<ParticipantsList />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows ✓ on back for participants who voted', () => {
    setupStore({ votes: twoVotes, isRevealed: false });
    render(<ParticipantsList />);
    const checks = screen.getAllByText('✓');
    expect(checks.length).toBe(2);
  });

  it('shows ⏳ on back for participants who have not voted', () => {
    const withPending = [makeVote('v1', 'Alice', null, '2024-01-01T10:00:00Z')];
    setupStore({ votes: withPending, isRevealed: false });
    render(<ParticipantsList />);
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });
});

describe('ParticipantsList — rename flow', () => {
  it('clicking Rename shows the text input pre-filled with current name', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(screen.getByRole('textbox')).toHaveValue('Alice');
  });

  it('shows Confirm and Cancel buttons after clicking Rename', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(
      screen.getByRole('button', { name: 'Confirm rename' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancel rename' }),
    ).toBeInTheDocument();
  });

  it('Cancel rename hides the input and restores the name display', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Cancel rename' }),
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
  });

  it('Escape key cancels rename', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('confirming with the same name cancels without calling renameUser', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm rename' }),
    );
    expect(mockRenameUser).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('shows error when name is shorter than 2 characters', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'A');
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm rename' }),
    );
    expect(
      screen.getByText('Name must be at least 2 characters'),
    ).toBeInTheDocument();
    expect(mockRenameUser).not.toHaveBeenCalled();
  });

  it('shows error when name is already in use by another participant', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Bob');
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm rename' }),
    );
    expect(screen.getByText('Name already in use')).toBeInTheDocument();
    expect(mockRenameUser).not.toHaveBeenCalled();
  });

  it('calls renameUser with trimmed name and hides input on success', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), '  Carol  ');
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm rename' }),
    );
    await waitFor(() => expect(mockRenameUser).toHaveBeenCalledWith('Carol'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('Enter key submits rename', async () => {
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Carol');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(mockRenameUser).toHaveBeenCalledWith('Carol'));
  });

  it('shows "Failed to rename" error when renameUser throws', async () => {
    mockRenameUser.mockRejectedValue(new Error('Network error'));
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Carol');
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm rename' }),
    );
    await waitFor(() =>
      expect(screen.getByText('Failed to rename')).toBeInTheDocument(),
    );
  });
});

describe('ParticipantsList — rename loading state', () => {
  it('disables input and buttons while rename is in flight', async () => {
    let resolve!: () => void;
    mockRenameUser.mockReturnValue(new Promise<void>((r) => (resolve = r)));
    setupStore({ votes: twoVotes, userName: 'Alice' });
    render(<ParticipantsList />);
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'Carol');
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirm rename' }),
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Confirm rename' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Cancel rename' }),
    ).toBeDisabled();
    await act(async () => {
      resolve();
    });
  });
});

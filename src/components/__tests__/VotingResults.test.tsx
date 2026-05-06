import { render, screen } from '@testing-library/react';
import { useVotingStore } from '@/store/useVotingStore';
import VotingResults from '../VotingResults';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/store/useVotingStore', () => ({
  ...jest.requireActual('@/store/useVotingStore'),
  useVotingStore: jest.fn(),
}));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<typeof useVotingStore>;

function makeVote(id: string, userName: string, value: string | null) {
  return { id, session_id: 's1', user_name: userName, value, voted_at: '' };
}

function setupStore(votes: ReturnType<typeof makeVote>[]) {
  const state = { votes };
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) => selector(state));
}

beforeEach(() => {
  jest.clearAllMocks();
  setupStore([]);
});

describe('VotingResults — empty state', () => {
  it('shows — for average and median when there are no votes', () => {
    render(<VotingResults />);
    const dashes = screen.getAllByText('—');
    expect(dashes).toHaveLength(2);
  });

  it('shows no consensus badge when there are no votes', () => {
    render(<VotingResults />);
    expect(screen.queryByText('Consensus!')).toBeNull();
    expect(screen.queryByText('Close')).toBeNull();
    expect(screen.queryByText(/Divergent/)).toBeNull();
  });
});

function getStatValue(label: 'Average' | 'Median') {
  return screen.getByText(label).previousElementSibling?.textContent;
}

describe('VotingResults — average and median', () => {
  it('computes correct average for numeric votes', () => {
    setupStore([makeVote('1', 'Alice', '3'), makeVote('2', 'Bob', '5')]);
    render(<VotingResults />);
    expect(getStatValue('Average')).toBe('4.0');
  });

  it('computes correct median for odd number of votes', () => {
    setupStore([
      makeVote('1', 'Alice', '1'),
      makeVote('2', 'Bob', '3'),
      makeVote('3', 'Carol', '5'),
    ]);
    render(<VotingResults />);
    expect(getStatValue('Median')).toBe('3');
  });

  it('computes correct median for even number of votes', () => {
    setupStore([
      makeVote('1', 'Alice', '2'),
      makeVote('2', 'Bob', '8'),
    ]);
    render(<VotingResults />);
    expect(getStatValue('Median')).toBe('5.0');
  });

  it('excludes null votes from average and median', () => {
    setupStore([
      makeVote('1', 'Alice', '2'),
      makeVote('2', 'Bob', null),
    ]);
    render(<VotingResults />);
    expect(screen.getByText('2.0')).toBeInTheDocument();
  });

  it('excludes ? votes from average and median calculations', () => {
    setupStore([
      makeVote('1', 'Alice', '8'),
      makeVote('2', 'Bob', '?'),
    ]);
    render(<VotingResults />);
    expect(screen.getByText('8.0')).toBeInTheDocument();
  });
});

describe('VotingResults — consensus badge', () => {
  it('shows Consensus! when all votes are the same', () => {
    setupStore([makeVote('1', 'Alice', '5'), makeVote('2', 'Bob', '5')]);
    render(<VotingResults />);
    expect(screen.getByText('Consensus!')).toBeInTheDocument();
  });

  it('shows Consensus! when there is only one numeric vote', () => {
    setupStore([makeVote('1', 'Alice', '3')]);
    render(<VotingResults />);
    expect(screen.getByText('Consensus!')).toBeInTheDocument();
  });

  it('shows Close when Fibonacci index spread is ≤ 2', () => {
    // '1' (index 0) and '3' (index 2) → spread 2
    setupStore([makeVote('1', 'Alice', '1'), makeVote('2', 'Bob', '3')]);
    render(<VotingResults />);
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('shows Divergent with range when Fibonacci index spread > 2', () => {
    // '1' (index 0) and '5' (index 3) → spread 3
    setupStore([makeVote('1', 'Alice', '1'), makeVote('2', 'Bob', '5')]);
    render(<VotingResults />);
    expect(screen.getByText('Divergent (1–5)')).toBeInTheDocument();
  });

  it('shows no badge when all votes are ? (no numeric values)', () => {
    setupStore([makeVote('1', 'Alice', '?'), makeVote('2', 'Bob', '?')]);
    render(<VotingResults />);
    expect(screen.queryByText('Consensus!')).toBeNull();
    expect(screen.queryByText('Close')).toBeNull();
    expect(screen.queryByText(/Divergent/)).toBeNull();
  });
});

describe('VotingResults — vote cards', () => {
  it('renders a card for each vote showing the user name', () => {
    setupStore([
      makeVote('1', 'Alice', '5'),
      makeVote('2', 'Bob', '?'),
    ]);
    render(<VotingResults />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows — for null vote values in the card display', () => {
    setupStore([makeVote('1', 'Alice', null)]);
    render(<VotingResults />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('has aria-live="polite" for screen reader updates', () => {
    render(<VotingResults />);
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});

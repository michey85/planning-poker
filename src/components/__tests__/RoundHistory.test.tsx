import { render, screen } from '@testing-library/react';
import { useVotingStore } from '@/store/useVotingStore';
import RoundHistory from '../RoundHistory';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/store/useVotingStore', () => ({
  ...jest.requireActual('@/store/useVotingStore'),
  useVotingStore: jest.fn(),
}));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<
  typeof useVotingStore
>;

function makeRound(
  id: string,
  round_number: number,
  task_name: string,
  consensus_value: string,
) {
  return { id, session_id: 's1', round_number, task_name, consensus_value };
}

function setupStore(rounds: ReturnType<typeof makeRound>[]) {
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ rounds }),
  );
}

beforeEach(() => jest.clearAllMocks());

const twoRounds = [
  makeRound('r1', 1, 'Login page', '3'),
  makeRound('r2', 2, 'Signup flow', '5'),
];

describe('RoundHistory — rendering', () => {
  it('renders nothing when rounds is empty', () => {
    setupStore([]);
    const { container } = render(<RoundHistory />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the "Round History" heading when rounds exist', () => {
    setupStore(twoRounds);
    render(<RoundHistory />);
    expect(screen.getByText('Round History')).toBeInTheDocument();
  });

  it('renders a row for each round', () => {
    setupStore(twoRounds);
    render(<RoundHistory />);
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.getByText('Signup flow')).toBeInTheDocument();
  });

  it('displays round numbers', () => {
    setupStore(twoRounds);
    render(<RoundHistory />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays consensus values', () => {
    setupStore(twoRounds);
    render(<RoundHistory />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders column headers: #, Task, Consensus', () => {
    setupStore(twoRounds);
    render(<RoundHistory />);
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Consensus')).toBeInTheDocument();
  });
});

import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useVotingStore } from '@/store/useVotingStore';
import TaskHeader from '../TaskHeader';

jest.mock('@/utils/supabase/client', () => ({ createClient: jest.fn() }));
jest.mock('@/store/useVotingStore');
jest.mock('@/lib/toast', () => ({ pushToast: jest.fn() }));

const mockUseVotingStore = useVotingStore as jest.MockedFunction<
  typeof useVotingStore
>;

function setupStore({
  taskName = 'Test Task',
  sessionId = 'session-123',
  votes = [],
}: {
  taskName?: string;
  sessionId?: string;
  votes?: { value: string | null }[];
}) {
  mockUseVotingStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({ taskName, sessionId, votes }),
  );
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
});

describe('TaskHeader', () => {
  it('renders the task name', () => {
    setupStore({ taskName: 'Estimate auth feature' });
    render(<TaskHeader />);
    expect(
      screen.getByRole('heading', { name: 'Estimate auth feature' }),
    ).toBeInTheDocument();
  });

  it('shows voted count out of total', () => {
    setupStore({
      votes: [{ value: '3' }, { value: null }, { value: '5' }],
    });
    render(<TaskHeader />);
    expect(screen.getByText('2 of 3 voted')).toBeInTheDocument();
  });

  it('shows 0 of 0 when no votes', () => {
    setupStore({ votes: [] });
    render(<TaskHeader />);
    expect(screen.getByText('0 of 0 voted')).toBeInTheDocument();
  });

  it('does not render progress bar when there are no votes', () => {
    setupStore({ votes: [] });
    const { container } = render(<TaskHeader />);
    expect(container.querySelector('.bg-muted')).toBeNull();
  });

  it('renders progress bar when there are votes', () => {
    setupStore({ votes: [{ value: '5' }, { value: null }] });
    const { container } = render(<TaskHeader />);
    expect(container.querySelector('.bg-muted')).toBeInTheDocument();
  });

  it('copies session link and shows Copied! when button is clicked', async () => {
    setupStore({});
    render(<TaskHeader />);
    const button = screen.getByRole('button', { name: 'Copy session link' });

    await userEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      window.location.href,
    );
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('does not copy when sessionId is absent', async () => {
    setupStore({ sessionId: '' });
    render(<TaskHeader />);
    const button = screen.getByRole('button', { name: 'Copy session link' });

    await userEvent.click(button);

    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('resets button label back to Copy link after 2 seconds', async () => {
    jest.useFakeTimers();
    setupStore({});
    render(<TaskHeader />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Copy session link' }),
      );
    });
    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByText('Copy link')).toBeInTheDocument();

    jest.useRealTimers();
  });
});

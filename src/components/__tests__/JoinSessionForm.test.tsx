import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSession } from '@/lib/database';
import JoinSessionForm from '../JoinSessionForm';

const mockPush = jest.fn();
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/database', () => ({
  getSession: jest.fn(),
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('JoinSessionForm', () => {
  it('renders form elements', () => {
    render(<JoinSessionForm />);
    expect(screen.getByRole('heading', { name: 'Join Session' })).toBeInTheDocument();
    expect(screen.getByLabelText('Session ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Join Session' })).toBeInTheDocument();
  });

  it('shows error when submitted with empty session ID', async () => {
    render(<JoinSessionForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    expect(screen.getByText('Session ID is required.')).toBeInTheDocument();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('shows error when session ID is not a valid UUID', async () => {
    render(<JoinSessionForm />);
    await userEvent.type(screen.getByLabelText('Session ID'), 'not-a-uuid');
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    expect(
      screen.getByText('Please enter a valid session ID (UUID format).'),
    ).toBeInTheDocument();
    expect(mockGetSession).not.toHaveBeenCalled();
  });

  it('clears error when user starts typing', async () => {
    render(<JoinSessionForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    expect(screen.getByText('Session ID is required.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Session ID'), 'a');
    expect(screen.queryByText('Session ID is required.')).not.toBeInTheDocument();
  });

  it('shows loading state and disables input while submitting', async () => {
    mockGetSession.mockImplementation(() => new Promise(() => {}));
    render(<JoinSessionForm />);
    await userEvent.type(screen.getByLabelText('Session ID'), VALID_UUID);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    expect(screen.getByRole('button', { name: 'Checking...' })).toBeDisabled();
    expect(screen.getByLabelText('Session ID')).toBeDisabled();
  });

  it('redirects to session page when session is found', async () => {
    mockGetSession.mockResolvedValue({ id: VALID_UUID } as never);
    render(<JoinSessionForm />);
    await userEvent.type(screen.getByLabelText('Session ID'), VALID_UUID);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(`/session/${VALID_UUID}`));
  });

  it('trims whitespace before validation and call', async () => {
    mockGetSession.mockResolvedValue({ id: VALID_UUID } as never);
    render(<JoinSessionForm />);
    await userEvent.type(screen.getByLabelText('Session ID'), `  ${VALID_UUID}  `);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    await waitFor(() => expect(mockGetSession).toHaveBeenCalledWith(VALID_UUID));
  });

  it('shows error when session is not found', async () => {
    mockGetSession.mockResolvedValue(null as never);
    render(<JoinSessionForm />);
    await userEvent.type(screen.getByLabelText('Session ID'), VALID_UUID);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    await waitFor(() => expect(screen.getByText('Session not found.')).toBeInTheDocument());
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error on network failure', async () => {
    mockGetSession.mockRejectedValue(new Error('network error'));
    render(<JoinSessionForm />);
    await userEvent.type(screen.getByLabelText('Session ID'), VALID_UUID);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    await waitFor(() =>
      expect(
        screen.getByText('Failed to check session. Please try again.'),
      ).toBeInTheDocument(),
    );
  });

  it('re-enables button after any failure', async () => {
    mockGetSession.mockRejectedValue(new Error('network error'));
    render(<JoinSessionForm />);
    await userEvent.type(screen.getByLabelText('Session ID'), VALID_UUID);
    await userEvent.click(screen.getByRole('button', { name: 'Join Session' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Join Session' })).not.toBeDisabled(),
    );
  });
});

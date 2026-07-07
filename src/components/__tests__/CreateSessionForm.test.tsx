import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createSession } from '@/lib/database';
import CreateSessionForm from '../CreateSessionForm';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/lib/database', () => ({
  createSession: jest.fn(),
}));

const mockCreateSession = createSession as jest.MockedFunction<
  typeof createSession
>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CreateSessionForm', () => {
  it('renders form elements', () => {
    render(<CreateSessionForm />);
    expect(
      screen.getByRole('heading', { name: 'Create Session' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Task Name')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create Session' }),
    ).toBeInTheDocument();
  });

  it('shows error when submitted with empty task name', async () => {
    render(<CreateSessionForm />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    expect(screen.getByText('Task name is required.')).toBeInTheDocument();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('shows error when task name is shorter than 3 characters', async () => {
    render(<CreateSessionForm />);
    await userEvent.type(screen.getByLabelText('Task Name'), 'ab');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    expect(
      screen.getByText('Task name must be at least 3 characters.'),
    ).toBeInTheDocument();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  it('clears error when user starts typing', async () => {
    render(<CreateSessionForm />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    expect(screen.getByText('Task name is required.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Task Name'), 'a');
    expect(
      screen.queryByText('Task name is required.'),
    ).not.toBeInTheDocument();
  });

  it('shows loading state while submitting', async () => {
    mockCreateSession.mockImplementation(() => new Promise(() => {}));
    render(<CreateSessionForm />);
    await userEvent.type(screen.getByLabelText('Task Name'), 'Valid task');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled();
  });

  it('redirects to session page on success', async () => {
    mockCreateSession.mockResolvedValue({ id: 'abc-123' } as never);
    render(<CreateSessionForm />);
    await userEvent.type(screen.getByLabelText('Task Name'), 'Valid task');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith('/session/abc-123'),
    );
  });

  it('trims whitespace before validation and submission', async () => {
    mockCreateSession.mockResolvedValue({ id: 'xyz' } as never);
    render(<CreateSessionForm />);
    await userEvent.type(screen.getByLabelText('Task Name'), '  valid  ');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    await waitFor(() =>
      expect(mockCreateSession).toHaveBeenCalledWith('valid', true),
    );
  });

  it('shows error message on failed submission', async () => {
    mockCreateSession.mockRejectedValue(new Error('network error'));
    render(<CreateSessionForm />);
    await userEvent.type(screen.getByLabelText('Task Name'), 'Valid task');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    await waitFor(() =>
      expect(
        screen.getByText('Failed to create session. Please try again.'),
      ).toBeInTheDocument(),
    );
  });

  it('re-enables button after failed submission', async () => {
    mockCreateSession.mockRejectedValue(new Error('network error'));
    render(<CreateSessionForm />);
    await userEvent.type(screen.getByLabelText('Task Name'), 'Valid task');
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Session' }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Create Session' }),
      ).not.toBeDisabled(),
    );
  });
});

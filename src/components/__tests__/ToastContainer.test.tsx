import { act, render, screen } from '@testing-library/react';
import { subscribe } from '@/lib/toast';
import ToastContainer from '../ToastContainer';

jest.mock('@/lib/toast', () => ({
  subscribe: jest.fn(),
}));

const mockSubscribe = subscribe as jest.MockedFunction<typeof subscribe>;

let capturedCallback: ((toast: { id: number; message: string; type: 'success' | 'error' | 'info' }) => void) | null = null;
const unsubscribe = jest.fn();

beforeEach(() => {
  jest.useFakeTimers();
  capturedCallback = null;
  mockSubscribe.mockImplementation((cb) => {
    capturedCallback = cb;
    return unsubscribe;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

function pushToast(id: number, message: string, type: 'success' | 'error' | 'info' = 'info') {
  act(() => {
    capturedCallback!({ id, message, type });
  });
}

describe('ToastContainer', () => {
  it('renders nothing when there are no toasts', () => {
    render(<ToastContainer />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.querySelector('.fixed')).toBeNull();
  });

  it('calls subscribe on mount and unsubscribes on unmount', () => {
    const { unmount } = render(<ToastContainer />);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('shows a toast message when subscribe callback fires', () => {
    render(<ToastContainer />);
    pushToast(1, 'Hello world');
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('applies success styles for success toast', () => {
    render(<ToastContainer />);
    pushToast(1, 'Success!', 'success');
    expect(screen.getByText('Success!')).toHaveClass('bg-green-600', 'text-white');
  });

  it('applies error styles for error toast', () => {
    render(<ToastContainer />);
    pushToast(1, 'Oops!', 'error');
    expect(screen.getByText('Oops!')).toHaveClass('bg-red-600', 'text-white');
  });

  it('shows multiple toasts simultaneously', () => {
    render(<ToastContainer />);
    pushToast(1, 'First');
    pushToast(2, 'Second');
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('removes a toast after 3300ms', () => {
    render(<ToastContainer />);
    pushToast(1, 'Bye soon');
    expect(screen.getByText('Bye soon')).toBeInTheDocument();
    act(() => jest.advanceTimersByTime(3300));
    expect(screen.queryByText('Bye soon')).toBeNull();
  });

  it('keeps other toasts when one expires', () => {
    render(<ToastContainer />);
    pushToast(1, 'Short-lived');
    act(() => jest.advanceTimersByTime(1000));
    pushToast(2, 'Still here');
    act(() => jest.advanceTimersByTime(2300));
    expect(screen.queryByText('Short-lived')).toBeNull();
    expect(screen.getByText('Still here')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomQrModal from '../RoomQrModal';

const URL = 'https://poker.example/session/abc-123';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = jest.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = jest.fn(function (
    this: HTMLDialogElement,
  ) {
    this.removeAttribute('open');
  });
});

beforeEach(() => jest.clearAllMocks());

describe('RoomQrModal', () => {
  it('shows caption and QR code when open', () => {
    render(<RoomQrModal url={URL} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Scan to vote')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR code' })).toBeInTheDocument();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('does not render the URL as text', () => {
    render(<RoomQrModal url={URL} onClose={jest.fn()} />);
    expect(screen.queryByText(URL)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    render(<RoomQrModal url={URL} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes the native dialog on unmount', () => {
    const { unmount } = render(<RoomQrModal url={URL} onClose={jest.fn()} />);
    unmount();
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('calls onClose on Escape (cancel event)', () => {
    const onClose = jest.fn();
    render(<RoomQrModal url={URL} onClose={onClose} />);
    fireEvent(screen.getByRole('dialog'), new Event('cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on backdrop click but not on content click', () => {
    const onClose = jest.fn();
    render(<RoomQrModal url={URL} onClose={onClose} />);
    fireEvent.click(screen.getByText('Scan to vote'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

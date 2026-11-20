import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoomQrModal from '../RoomQrModal';

const URL = 'https://poker.example/session/abc-123';

beforeAll(() => {
  // jsdom has no PointerEvent; without it fireEvent drops clientX/clientY
  if (!window.PointerEvent) {
    window.PointerEvent = class extends MouseEvent {} as typeof PointerEvent;
  }
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

  it('sets closedby="any" for native light dismiss', () => {
    render(<RoomQrModal url={URL} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('closedby', 'any');
  });

  it('calls onClose on native close event', () => {
    const onClose = jest.fn();
    render(<RoomQrModal url={URL} onClose={onClose} />);
    fireEvent(screen.getByRole('dialog'), new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('light-dismiss fallback (no closedby support)', () => {
    const press = (el: Element, x: number, y: number) => {
      fireEvent.pointerDown(el, { clientX: x, clientY: y });
      fireEvent.pointerUp(el, { clientX: x, clientY: y });
    };

    beforeEach(() => {
      jest
        .spyOn(HTMLDialogElement.prototype, 'getBoundingClientRect')
        .mockReturnValue({
          left: 100,
          right: 400,
          top: 100,
          bottom: 400,
        } as DOMRect);
    });

    afterEach(() => jest.restoreAllMocks());

    it('closes on press and release outside the dialog box', () => {
      const onClose = jest.fn();
      render(<RoomQrModal url={URL} onClose={onClose} />);
      press(screen.getByRole('dialog'), 10, 10);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not close on press inside the dialog box', () => {
      const onClose = jest.fn();
      render(<RoomQrModal url={URL} onClose={onClose} />);
      press(screen.getByRole('dialog'), 200, 200);
      press(screen.getByText('Scan to vote'), 200, 200);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not close when a drag starts inside and ends outside', () => {
      const onClose = jest.fn();
      render(<RoomQrModal url={URL} onClose={onClose} />);
      const dialog = screen.getByRole('dialog');
      fireEvent.pointerDown(dialog, { clientX: 200, clientY: 200 });
      fireEvent.pointerUp(dialog, { clientX: 10, clientY: 10 });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('is skipped when the browser supports closedby', () => {
      Object.defineProperty(HTMLDialogElement.prototype, 'closedBy', {
        configurable: true,
        value: 'any',
      });
      try {
        const onClose = jest.fn();
        render(<RoomQrModal url={URL} onClose={onClose} />);
        press(screen.getByRole('dialog'), 10, 10);
        expect(onClose).not.toHaveBeenCalled();
      } finally {
        delete (HTMLDialogElement.prototype as { closedBy?: string }).closedBy;
      }
    });
  });
});

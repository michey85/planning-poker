import { QRCodeSVG } from 'qrcode.react';
import { type MouseEvent, type SyntheticEvent, useEffect, useRef } from 'react';

type Props = {
  url: string;
  onClose: () => void;
};

export default function RoomQrModal({ url, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => dialog.close();
  }, []);

  const handleCancel = (e: SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled natively via onCancel
    <dialog
      ref={dialogRef}
      aria-label="Room QR code"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
      className="m-auto rounded-xl border border-border bg-background p-0 text-foreground backdrop:bg-black/60"
    >
      <div className="relative flex flex-col items-center gap-4 p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2 right-2 rounded p-1.5 text-foreground/60 transition-colors hover:text-foreground"
        >
          <svg
            className="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div
          role="img"
          aria-label="QR code"
          className="rounded-lg bg-white p-3"
        >
          <QRCodeSVG
            value={url}
            size={280}
            marginSize={2}
            bgColor="#ffffff"
            fgColor="#000000"
            className="h-auto w-[min(70vw,280px)] sm:w-[min(60vh,360px)]"
          />
        </div>
        <p className="text-lg font-semibold">Scan to vote</p>
      </div>
    </dialog>
  );
}

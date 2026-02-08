'use client';

interface ConnectionAlertProps {
  status: string;
}

export default function ConnectionAlert({ status }: ConnectionAlertProps) {
  if (status !== 'error') {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="animate-fade-in rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700"
    >
      Realtime connection lost. Updates may be delayed.
    </div>
  );
}

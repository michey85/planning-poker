'use client';

import { useEffect, useState } from 'react';
import { subscribe, type Toast } from '@/lib/toast';

const TYPE_STYLES: Record<Toast['type'], string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-foreground text-background',
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<(Toast & { exiting?: boolean })[]>([]);

  useEffect(() => {
    return subscribe((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === toast.id ? { ...t, exiting: true } : t)),
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, 300);
      }, 3000);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg ${TYPE_STYLES[toast.type]} ${toast.exiting ? 'animate-[toast-out_0.3s_ease-in_forwards]' : 'animate-[toast-in_0.3s_ease-out]'}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toast: Toast) => void;

let nextId = 0;
const listeners = new Set<Listener>();

export function pushToast(message: string, type: ToastType = 'info') {
  const toast: Toast = { id: ++nextId, message, type };
  for (const cb of listeners) cb(toast);
}

export function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

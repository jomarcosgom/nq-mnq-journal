import { useEffect, useState } from 'react';

let toasts = [];
let listeners = [];
let idCounter = 0;

function emit() {
  listeners.forEach((fn) => fn([...toasts]));
}

/** Muestra una notificación toast. Devuelve su id (útil para descartarla manualmente). */
export function showToast(message, opts = {}) {
  const id = ++idCounter;
  const toast = {
    id,
    message,
    type: opts.type || 'info', // info | error | success
    actionLabel: opts.actionLabel || null,
    onAction: opts.onAction || null,
    duration: opts.duration ?? 4000
  };
  toasts = [...toasts, toast];
  emit();
  if (toast.duration > 0) {
    setTimeout(() => dismissToast(id), toast.duration);
  }
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/** Hook interno que usa <ToastHost/> para suscribirse a los toasts activos. */
export function useToasts() {
  const [state, setState] = useState(toasts);
  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((fn) => fn !== setState);
    };
  }, []);
  return state;
}

import { useToasts, dismissToast } from '../utils/toast.js';

/** Contenedor global de notificaciones toast, montado una vez en App. */
export default function ToastHost() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div className={`toast toast-${t.type}`} key={t.id}>
          <span>{t.message}</span>
          {t.actionLabel && (
            <button
              type="button"
              className="toast-action"
              onClick={() => {
                t.onAction && t.onAction();
                dismissToast(t.id);
              }}
            >
              {t.actionLabel}
            </button>
          )}
          <button
            type="button"
            className="toast-close"
            aria-label="Cerrar notificación"
            onClick={() => dismissToast(t.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

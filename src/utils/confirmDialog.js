let listener = null;

export function _setConfirmListener(fn) {
  listener = fn;
}

/**
 * Sustituye a window.confirm(): muestra un modal con el estilo de la app
 * y resuelve una promesa con true/false según la elección del usuario.
 */
export function showConfirm({ title = 'Confirmar', message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(window.confirm(message));
      return;
    }
    listener({ title, message, confirmLabel, danger, resolve });
  });
}

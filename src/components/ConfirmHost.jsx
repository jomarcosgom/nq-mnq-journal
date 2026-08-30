import { useEffect, useState } from 'react';
import { _setConfirmListener } from '../utils/confirmDialog.js';

/** Modal de confirmación global, montado una vez en App. Sustituye a window.confirm(). */
export default function ConfirmHost() {
  const [request, setRequest] = useState(null);

  useEffect(() => {
    _setConfirmListener(setRequest);
    return () => _setConfirmListener(null);
  }, []);

  if (!request) return null;

  function resolve(value) {
    request.resolve(value);
    setRequest(null);
  }

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-modal">
        <h3 id="confirm-title">{request.title}</h3>
        <p>{request.message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={() => resolve(false)}>Cancelar</button>
          <button
            type="button"
            className={request.danger ? 'confirm-danger' : 'confirm-ok'}
            onClick={() => resolve(true)}
          >
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

import { getEntryTags } from '../../utils/tags.js';
import StarRating from './StarRating.jsx';

function formatDate(iso) {
  const d = new Date(iso);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function HistoryList({ entries, onDelete, onEdit }) {
  if (entries.length === 0) {
    return (
      <div className="history-empty">Aún no has guardado ninguna operación.</div>
    );
  }

  return (
    <div className="history-list">
      {entries.map((e) => {
        const outcome = e.outcome || 'pending';
        const outcomeLabel = outcome === 'won' ? 'Ganada' : outcome === 'lost' ? 'Perdida' : 'BE';

        let pnlNode = (
          <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
            Sin P&amp;L registrado
          </span>
        );
        if (e.realPnl !== null && e.realPnl !== undefined) {
          const cls = e.realPnl >= 0 ? 'pnl-pos' : 'pnl-neg';
          const sign = e.realPnl >= 0 ? '+$' : '-$';
          pnlNode = <span className={cls}>{sign}{Math.abs(e.realPnl).toFixed(2)}</span>;
        }

        const contractsText = `${e.contracts} ${e.contracts === 1 ? 'ctto' : 'cttos'}`;
        const tags = getEntryTags(e);

        return (
          <div className="history-item" key={e.firestoreId}>
            <div className="row1">
              {e.image && (
                <img className="thumb" src={e.image} alt="Captura" />
              )}
              <span className={`badge ${e.contract}`}>{e.contract}</span>
              <div className="info">
                <div className="line1">
                  {pnlNode}
                  <span style={{ color: 'var(--muted)' }}>
                    plan: ${e.riskDollars.toFixed(2)} / ${e.rewardDollars.toFixed(2)}
                  </span>
                </div>
                <div className="line2">
                  {formatDate(e.date)} · {e.slPoints.toFixed(2)} / {e.tpPoints.toFixed(2)} pts · {contractsText}
                </div>
                {e.rating > 0 && <StarRating value={e.rating} size="sm" />}
              </div>
              <span className={`outcome-tag ${outcome}`}>{outcomeLabel}</span>
              <button className="edit-item-btn" onClick={() => onEdit(e)} title="Editar" aria-label="Editar operación">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button className="del" onClick={() => onDelete(e.firestoreId)} title="Eliminar" aria-label="Eliminar operación">
                ×
              </button>
            </div>
            {tags.length > 0 && (
              <div className="row2">
                {tags.map((t) => <span className="setup-tag" key={t}>{t}</span>)}
              </div>
            )}
            {e.notes && <div className="notes-preview">{e.notes}</div>}
          </div>
        );
      })}
    </div>
  );
}

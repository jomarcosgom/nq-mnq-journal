import { useMemo, useState } from 'react';
import { getEntryTags } from '../../utils/tags.js';
import StarRating from './StarRating.jsx';

function formatDate(iso) {
  const d = new Date(iso);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

const COLUMNS = [
  { key: 'date', label: 'Fecha' },
  { key: 'contract', label: 'Contrato' },
  { key: 'realPnl', label: 'P&L' },
  { key: 'riskDollars', label: 'Riesgo' },
  { key: 'rewardDollars', label: 'Beneficio' },
  { key: 'rr', label: 'R:R' },
  { key: 'tags', label: 'Tags' },
  { key: 'outcome', label: 'Resultado' },
  { key: 'followedPlan', label: 'Plan' },
  { key: 'rating', label: 'Rating' }
];

function sortValue(entry, key) {
  const v = entry[key];
  switch (key) {
    case 'date':
      return new Date(v).getTime();
    case 'outcome':
      return v || 'pending';
    case 'followedPlan':
      return v || '';
    case 'tags':
      return getEntryTags(entry).join(',').toLowerCase();
    case 'rating':
      return v || 0;
    case 'realPnl':
    case 'rr':
      return v === null || v === undefined ? -Infinity : v;
    default:
      return v;
  }
}

export default function HistoryTable({ entries, onDelete, onEdit }) {
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const list = [...entries];
    list.sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [entries, sortKey, sortDir]);

  function handleHeaderClick(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.key} onClick={() => handleHeaderClick(col.key)}>
                {col.label}
                {sortKey === col.key && (
                  <span className="sort-arrow">{sortDir === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
            <th className="col-actions" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => {
            const outcome = e.outcome || 'pending';
            const outcomeLabel = outcome === 'won' ? 'Ganada' : outcome === 'lost' ? 'Perdida' : 'BE';
            const planLabel = e.followedPlan === 'yes' ? 'Sí' : e.followedPlan === 'no' ? 'No' : '—';
            const rrText = e.rr !== null && e.rr !== undefined && isFinite(e.rr) ? `1:${e.rr.toFixed(2)}` : '—';
            const hasPnl = e.realPnl !== null && e.realPnl !== undefined;
            const pnlClass = hasPnl ? (e.realPnl >= 0 ? 'pnl-pos' : 'pnl-neg') : '';
            const pnlText = hasPnl ? (e.realPnl >= 0 ? '+$' : '-$') + Math.abs(e.realPnl).toFixed(2) : '—';
            const tags = getEntryTags(e);

            return (
              <tr key={e.firestoreId}>
                <td className="mono">{formatDate(e.date)}</td>
                <td><span className={`badge ${e.contract}`}>{e.contract}</span></td>
                <td className={`mono ${pnlClass}`}>{pnlText}</td>
                <td className="mono" style={{ color: 'var(--risk)' }}>${e.riskDollars.toFixed(2)}</td>
                <td className="mono" style={{ color: 'var(--reward)' }}>${e.rewardDollars.toFixed(2)}</td>
                <td className="mono">{rrText}</td>
                <td className="setup-cell" title={tags.join(', ')}>
                  {tags.length > 0 ? tags.map((t) => <span className="tag-chip-sm" key={t}>{t}</span>) : '—'}
                </td>
                <td><span className={`outcome-tag ${outcome}`}>{outcomeLabel}</span></td>
                <td className="mono">{planLabel}</td>
                <td><StarRating value={e.rating || 0} /></td>
                <td className="col-actions">
                  <div className="table-actions">
                    <button className="edit-item-btn" onClick={() => onEdit(e)} title="Editar" aria-label="Editar operación">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="del" onClick={() => onDelete(e.firestoreId)} title="Eliminar" aria-label="Eliminar operación">×</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

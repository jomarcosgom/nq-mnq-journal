import { getEntryTags } from './tags.js';

const HEADERS = [
  'Fecha', 'Contrato', 'Contratos', 'SL (pts)', 'TP (pts)',
  'Riesgo ($)', 'Beneficio ($)', 'R:R', 'P&L real ($)',
  'Tags', 'Resultado', 'Siguió el plan', 'Rating', 'Notas'
];

function csvEscape(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function entryToRow(e) {
  return [
    e.date,
    e.contract,
    e.contracts,
    e.slPoints,
    e.tpPoints,
    e.riskDollars,
    e.rewardDollars,
    e.rr !== null && e.rr !== undefined ? e.rr.toFixed(2) : '',
    e.realPnl !== null && e.realPnl !== undefined ? e.realPnl : '',
    getEntryTags(e).join('; '),
    e.outcome || 'pending',
    e.followedPlan || '',
    e.rating || '',
    e.notes || ''
  ];
}

/** Convierte las operaciones del journal a texto CSV (separado por comas). */
export function entriesToCsv(entries) {
  const rows = [HEADERS, ...entries.map(entryToRow)];
  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

/** Genera y descarga un archivo CSV con el historial de operaciones. */
export function downloadEntriesCsv(entries, filename = 'journal.csv') {
  const csv = entriesToCsv(entries);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

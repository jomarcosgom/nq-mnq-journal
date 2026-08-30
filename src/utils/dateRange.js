export const RANGE_OPTIONS = [
  { value: 'all', label: 'Todo el historial' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'month', label: 'Este mes' },
  { value: 'prevMonth', label: 'Mes anterior' }
];

/** Filtra operaciones según un rango de fechas relativo a hoy. */
export function filterByDateRange(entries, range) {
  if (range === 'all') return entries;
  const now = new Date();

  if (range === '7d' || range === '30d') {
    const days = range === '7d' ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter((e) => new Date(e.date) >= cutoff);
  }

  if (range === 'month') {
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }

  if (range === 'prevMonth') {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
    });
  }

  return entries;
}

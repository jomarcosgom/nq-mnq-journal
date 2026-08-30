import { getEntryTags } from './tags.js';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function closedOnly(entries) {
  return entries.filter((e) => e.realPnl !== null && e.realPnl !== undefined);
}

function bucketStats(list) {
  const count = list.length;
  const netPnl = list.reduce((s, e) => s + e.realPnl, 0);
  const won = list.filter((e) => e.realPnl > 0).length;
  const winRate = count > 0 ? (won / count) * 100 : null;
  return { count, netPnl, winRate };
}

/** Desglose de P&L por día de la semana (dom-sáb). */
export function byDayOfWeek(entries) {
  const closed = closedOnly(entries);
  return DAY_LABELS.map((label, i) => {
    const list = closed.filter((e) => new Date(e.date).getDay() === i);
    return { label, ...bucketStats(list) };
  });
}

/** Desglose de P&L por hora del día (0-23), local. */
export function byHourOfDay(entries) {
  const closed = closedOnly(entries);
  return Array.from({ length: 24 }, (_, h) => {
    const list = closed.filter((e) => new Date(e.date).getHours() === h);
    return { label: `${String(h).padStart(2, '0')}h`, ...bucketStats(list) };
  });
}

/** Desglose de P&L por contrato (MNQ / NQ). */
export function byContract(entries) {
  const closed = closedOnly(entries);
  return ['MNQ', 'NQ'].map((contract) => {
    const list = closed.filter((e) => e.contract === contract);
    return { label: contract, ...bucketStats(list) };
  });
}

/**
 * Desglose de rendimiento por tag: para cada tag usado, cuenta,
 * P&L neto y win rate de las operaciones cerradas que lo incluyen.
 */
export function byTag(entries) {
  const closed = closedOnly(entries);
  const map = new Map();
  closed.forEach((e) => {
    getEntryTags(e).forEach((tag) => {
      if (!map.has(tag)) map.set(tag, []);
      map.get(tag).push(e);
    });
  });
  return Array.from(map.entries()).map(([tag, list]) => ({ tag, ...bucketStats(list) }));
}

export function topByNetPnl(tagStats, n = 5) {
  return tagStats.slice().sort((a, b) => b.netPnl - a.netPnl).slice(0, n);
}

export function bottomByNetPnl(tagStats, n = 5) {
  return tagStats.slice().sort((a, b) => a.netPnl - b.netPnl).slice(0, n);
}

export function topByCount(tagStats, n = 5) {
  return tagStats.slice().sort((a, b) => b.count - a.count).slice(0, n);
}

export function topByWinRate(tagStats, n = 5) {
  return tagStats
    .filter((t) => t.winRate !== null)
    .slice()
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, n);
}

const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Desglose de P&L por mes calendario, ordenado cronológicamente. */
export function byMonth(entries) {
  const closed = closedOnly(entries).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const map = new Map();
  closed.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, { key, label: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`, list: [] });
    map.get(key).list.push(e);
  });
  return Array.from(map.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ label, list }) => ({ label, ...bucketStats(list) }));
}

/**
 * Histograma de P&L por operación: agrupa ganancias y pérdidas en rangos
 * de tamaño fijo para ver la distribución de resultados.
 */
export function pnlDistribution(entries, bucketSize = 50) {
  const closed = closedOnly(entries);
  if (closed.length === 0) return [];

  const buckets = new Map();
  closed.forEach((e) => {
    const magnitude = Math.abs(e.realPnl);
    const bucketIndex = Math.floor(magnitude / bucketSize);
    const isWin = e.realPnl >= 0;
    const key = `${isWin ? 'W' : 'L'}${bucketIndex}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        isWin,
        bucketIndex,
        low: bucketIndex * bucketSize,
        high: (bucketIndex + 1) * bucketSize,
        count: 0
      });
    }
    buckets.get(key).count += 1;
  });

  return Array.from(buckets.values())
    .sort((a, b) => a.bucketIndex - b.bucketIndex)
    .map((b) => ({
      ...b,
      label: `${b.isWin ? '+' : '-'}$${b.low}-${b.high}`,
      signedCount: b.isWin ? b.count : -b.count
    }));
}

/** Rendimiento agrupado por rating de ejecución (1-5 estrellas, 0 = sin valorar). */
export function byRating(entries) {
  const closed = closedOnly(entries);
  const map = new Map();
  closed.forEach((e) => {
    const rating = e.rating || 0;
    if (!map.has(rating)) map.set(rating, []);
    map.get(rating).push(e);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rating, list]) => ({
      rating,
      label: rating === 0 ? 'Sin valorar' : '★'.repeat(rating),
      ...bucketStats(list)
    }));
}

/** Compara el rendimiento de las operaciones donde se siguió el plan vs no. */
export function byPlanFollowed(entries) {
  const closed = closedOnly(entries);
  return ['yes', 'no'].map((val) => {
    const list = closed.filter((e) => e.followedPlan === val);
    const stats = bucketStats(list);
    const expectancy = list.length > 0 ? stats.netPnl / list.length : null;
    return { label: val === 'yes' ? 'Siguió el plan' : 'Se desvió', ...stats, expectancy };
  });
}


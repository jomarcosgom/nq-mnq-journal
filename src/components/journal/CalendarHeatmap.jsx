import { useMemo, useState } from 'react';
import { getEntryTags } from '../../utils/tags.js';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DOW_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function dayKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupByDay(entries) {
  const map = {};
  entries.forEach((e) => {
    if (e.realPnl === null || e.realPnl === undefined) return;
    const key = dayKey(new Date(e.date));
    if (!map[key]) map[key] = { pnl: 0, count: 0, trades: [] };
    map[key].pnl += e.realPnl;
    map[key].count += 1;
    map[key].trades.push(e);
  });
  return map;
}

function formatTime(iso) {
  const d = new Date(iso);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function CalendarHeatmap({ entries }) {
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDay, setSelectedDay] = useState(null);

  function shiftMonth(delta) {
    setCalendarDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
    setSelectedDay(null);
  }

  const dayMap = useMemo(() => groupByDay(entries), [entries]);
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const todayKey = dayKey(new Date());

  const firstDay = new Date(year, month, 1);
  let startOffset = firstDay.getDay() - 1; // semana empieza en lunes
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let maxAbs = 0;
  let winDays = 0;
  let lossDays = 0;
  let bestDayPnl = null;
  let worstDayPnl = null;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const data = dayMap[key];
    if (!data) continue;
    maxAbs = Math.max(maxAbs, Math.abs(data.pnl));
    if (data.pnl > 0) winDays++;
    if (data.pnl < 0) lossDays++;
    if (bestDayPnl === null || data.pnl > bestDayPnl) bestDayPnl = data.pnl;
    if (worstDayPnl === null || data.pnl < worstDayPnl) worstDayPnl = data.pnl;
  }
  if (maxAbs === 0) maxAbs = 1;

  // Construye las semanas como filas de 7 celdas (día del mes o null para huecos).
  const totalCells = startOffset + daysInMonth;
  const totalRows = Math.ceil(totalCells / 7);
  const weeks = [];
  let dayCursor = 1 - startOffset;
  for (let w = 0; w < totalRows; w++) {
    const row = [];
    for (let i = 0; i < 7; i++, dayCursor++) {
      row.push(dayCursor >= 1 && dayCursor <= daysInMonth ? dayCursor : null);
    }
    weeks.push(row);
  }

  function renderCell(d, keySuffix) {
    if (d === null) return <div className="cal-cell empty" key={`empty-${keySuffix}`} />;

    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const data = dayMap[key];
    const isToday = key === todayKey;

    if (!data) {
      return (
        <div className={`cal-cell ${isToday ? 'cal-today' : ''}`} key={key}>
          <div className="cal-daynum">{d}</div>
        </div>
      );
    }

    const intensity = Math.min(1, Math.abs(data.pnl) / maxAbs);
    const alpha = 0.18 + intensity * 0.6;
    const isPos = data.pnl >= 0;
    const bg = isPos ? `rgba(61,214,140,${alpha.toFixed(2)})` : `rgba(229,72,77,${alpha.toFixed(2)})`;
    const sign = isPos ? '+' : '-';
    const opWord = data.count === 1 ? 'operación' : 'operaciones';
    const title = `${data.count} ${opWord} · P&L: ${sign}$${Math.abs(data.pnl).toFixed(2)}`;

    return (
      <div
        className={`cal-cell cal-clickable ${isPos ? 'cal-pos' : 'cal-neg'} ${isToday ? 'cal-today' : ''} ${selectedDay === key ? 'cal-selected' : ''}`}
        style={{ background: bg }}
        title={title}
        key={key}
        onClick={() => setSelectedDay((prev) => (prev === key ? null : key))}
      >
        <div className="cal-daynum">{d}</div>
        <div className="cal-pnl">{sign}{Math.abs(data.pnl).toFixed(0)}</div>
        <div className="cal-count">{data.count} op.</div>
      </div>
    );
  }

  const selectedData = selectedDay ? dayMap[selectedDay] : null;

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <span className="label">{MONTH_NAMES[month]} {year}</span>
        <div className="calendar-nav">
          <button onClick={() => shiftMonth(-1)} title="Mes anterior" aria-label="Mes anterior">‹</button>
          <button onClick={() => shiftMonth(1)} title="Mes siguiente" aria-label="Mes siguiente">›</button>
        </div>
      </div>

      <div className="calendar-summary">
        <span className="cal-summary-item pos">{winDays} días ganadores</span>
        <span className="cal-summary-item neg">{lossDays} días perdedores</span>
        {bestDayPnl !== null && <span className="cal-summary-item pos">Mejor día: +${bestDayPnl.toFixed(0)}</span>}
        {worstDayPnl !== null && worstDayPnl < 0 && <span className="cal-summary-item neg">Peor día: -${Math.abs(worstDayPnl).toFixed(0)}</span>}
      </div>

      <div className="calendar-grid">
        <div className="cal-week-row cal-week-head">
          {DOW_LABELS.map((label) => (
            <div className="cal-dow" key={label}>{label}</div>
          ))}
          <div className="cal-dow cal-dow-week">Semana</div>
        </div>

        {weeks.map((row, wi) => {
          const weekTotal = row.reduce((sum, d) => {
            if (d === null) return sum;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            return sum + (dayMap[key] ? dayMap[key].pnl : 0);
          }, 0);
          const hasData = row.some((d) => d !== null && dayMap[`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`]);

          return (
            <div className="cal-week-row" key={`week-${wi}`}>
              {row.map((d, di) => renderCell(d, `${wi}-${di}`))}
              <div className={`week-total-cell ${hasData ? (weekTotal >= 0 ? 'pos' : 'neg') : ''}`}>
                {hasData ? `${weekTotal >= 0 ? '+' : '-'}$${Math.abs(weekTotal).toFixed(0)}` : '—'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="calendar-legend">
        <span><span className="legend-dot pos" />Día ganador</span>
        <span><span className="legend-dot neg" />Día perdedor</span>
      </div>

      {selectedData && (
        <div className="day-detail-panel">
          <div className="day-detail-header">
            <span>{selectedDay} · {selectedData.count} operación(es) · {selectedData.pnl >= 0 ? '+' : '-'}${Math.abs(selectedData.pnl).toFixed(2)}</span>
            <button onClick={() => setSelectedDay(null)} aria-label="Cerrar detalle del día">×</button>
          </div>
          <div className="day-detail-list">
            {selectedData.trades
              .slice()
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((t) => (
                <div className="day-detail-row" key={t.firestoreId}>
                  <span className="mono">{formatTime(t.date)}</span>
                  <span className={`badge ${t.contract}`}>{t.contract}</span>
                  <span className={`mono ${t.realPnl >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>
                    {t.realPnl >= 0 ? '+$' : '-$'}{Math.abs(t.realPnl).toFixed(2)}
                  </span>
                  <span className="day-detail-tags">
                    {getEntryTags(t).map((tag) => <span className="tag-chip-sm" key={tag}>{tag}</span>)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

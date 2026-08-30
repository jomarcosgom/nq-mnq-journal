import { useEffect, useMemo, useState } from 'react';
import { fetchEconomicEvents, getWeekRange } from '../../utils/economicCalendar.js';

const API_KEY = import.meta.env.VITE_FMP_API_KEY;

const DOW_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function formatDayLabel(dateStr) {
  const d = new Date(dateStr);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${DOW_LABELS[(d.getDay() + 6) % 7]} ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function groupByDay(events) {
  const map = new Map();
  events.forEach((e) => {
    const key = e.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(e);
  });
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export default function EconomicCalendarWidget() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState(null);
  const [status, setStatus] = useState(API_KEY ? 'loading' : 'no-key');
  const [errorReason, setErrorReason] = useState(null);

  const { from, to } = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return getWeekRange(base);
  }, [weekOffset]);

  useEffect(() => {
    if (!API_KEY) return;
    let cancelled = false;
    setStatus('loading');

    fetchEconomicEvents({ from, to, country: 'US', apiKey: API_KEY })
      .then((data) => {
        if (cancelled) return;
        setEvents(data);
        setStatus('ready');
      })
      .catch((err) => {
        console.error(err);
        if (cancelled) return;
        setErrorReason(err.message === 'FMP_PAYMENT_REQUIRED' ? 'payment' : 'generic');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const days = useMemo(() => (events ? groupByDay(events) : []), [events]);

  return (
    <div className="econ-card">
      <div className="calendar-header">
        <span className="label">Calendario económico · {from} → {to}</span>
        <div className="calendar-nav">
          <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Semana anterior">‹</button>
          <button onClick={() => setWeekOffset(0)} aria-label="Semana actual" title="Semana actual">•</button>
          <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Semana siguiente">›</button>
        </div>
      </div>

      {status === 'no-key' && (
        <div className="econ-empty">
          Añade tu clave gratuita de Financial Modeling Prep en <code>.env.local</code> como
          <code> VITE_FMP_API_KEY</code> para activar este apartado. Regístrate gratis en{' '}
          <a href="https://site.financialmodelingprep.com/register" target="_blank" rel="noreferrer">
            financialmodelingprep.com
          </a>.
        </div>
      )}
      {status === 'loading' && <div className="econ-empty">Cargando eventos de la semana…</div>}
      {status === 'error' && errorReason === 'payment' && (
        <div className="econ-empty">
          Tu clave de Financial Modeling Prep no tiene acceso al calendario económico: ese endpoint concreto
          requiere un plan de pago (a partir de Starter, ~22$/mes). El resto de su API sí tiene plan gratuito,
          pero este dato no está incluido en él.
        </div>
      )}
      {status === 'error' && errorReason !== 'payment' && (
        <div className="econ-empty">No se pudo cargar el calendario económico. Revisa tu clave de API o vuelve a intentarlo más tarde.</div>
      )}
      {status === 'ready' && days.length === 0 && (
        <div className="econ-empty">Sin eventos relevantes para esta semana.</div>
      )}

      {status === 'ready' && days.length > 0 && (
        <div className="econ-days">
          {days.map(([day, dayEvents]) => (
            <div className="econ-day" key={day}>
              <div className="econ-day-label">{formatDayLabel(day)}</div>
              <div className="econ-day-events">
                {dayEvents.map((e, i) => (
                  <div className="econ-event" key={i}>
                    <span className="mono econ-event-time">{formatTime(e.date)}</span>
                    <span className={`econ-impact ${(e.impact || '').toLowerCase()}`}>{e.impact || '—'}</span>
                    <span className="econ-event-name">{e.event}</span>
                    <span className="econ-event-values">
                      {e.previous !== null && e.previous !== undefined && <span>Ant. {e.previous}</span>}
                      {e.estimate !== null && e.estimate !== undefined && <span>Est. {e.estimate}</span>}
                      {e.actual !== null && e.actual !== undefined && <span className="pos">Real {e.actual}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

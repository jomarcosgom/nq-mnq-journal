import { useEffect, useRef, useState } from 'react';

const SCRIPT_SRC = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';

const IMPORTANCE_OPTIONS = [
  { value: '0,1', label: 'Media y alta' },
  { value: '1', label: 'Solo alta' },
  { value: '-1,0,1', label: 'Todas' }
];

const COUNTRY_OPTIONS = [
  { value: 'us', label: 'Estados Unidos' },
  { value: 'us,eu', label: 'EE.UU. + Eurozona' },
  { value: 'us,eu,gb,jp,ca,cn', label: 'Principales economías' }
];

const STORAGE_KEY = 'nqmnq.econCalendarPrefs';

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Calendario económico embebido de TradingView: gratuito, sin clave de API y
 * sin problemas de CORS (los feeds JSON gratuitos tipo ForexFactory no envían
 * cabeceras CORS, así que no se pueden consumir desde el navegador).
 */
export default function EconomicCalendarWidget() {
  const containerRef = useRef(null);
  const prefs = useRef(loadPrefs()).current;
  const [importance, setImportance] = useState(prefs.importance || IMPORTANCE_OPTIONS[0].value);
  const [countries, setCountries] = useState(prefs.countries || COUNTRY_OPTIONS[0].value);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ importance, countries }));
  }, [importance, countries]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // El widget se configura con el JSON que lleva dentro su propio <script>,
    // así que hay que recrearlo entero cada vez que cambian los filtros.
    container.innerHTML = '';

    const mount = document.createElement('div');
    mount.className = 'tradingview-widget-container__widget';
    container.appendChild(mount);

    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      // Con fondo transparente el iframe se pinta en blanco: mejor dejar que
      // TradingView aplique su propio fondo oscuro.
      isTransparent: false,
      width: '100%',
      height: 500,
      locale: 'es',
      importanceFilter: importance,
      countryFilter: countries
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [importance, countries]);

  return (
    <div className="econ-card">
      <div className="calendar-header">
        <span className="label">Calendario económico</span>
        <div className="econ-filters">
          <select
            className="filter-select"
            value={countries}
            onChange={(e) => setCountries(e.target.value)}
            aria-label="Países"
          >
            {COUNTRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            className="filter-select"
            value={importance}
            onChange={(e) => setImportance(e.target.value)}
            aria-label="Importancia"
          >
            {IMPORTANCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tradingview-widget-container econ-tv-wrap" ref={containerRef} />
    </div>
  );
}

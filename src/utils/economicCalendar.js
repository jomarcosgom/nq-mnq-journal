const BASE_URL = 'https://financialmodelingprep.com/stable/economic-calendar';

/**
 * Descarga los eventos del calendario económico de FMP para un rango de
 * fechas (máx. 90 días) y, opcionalmente, un país (por defecto EE.UU.,
 * ya que es lo relevante para el Nasdaq-100 / NQ-MNQ).
 */
export async function fetchEconomicEvents({ from, to, country = 'US', apiKey }) {
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const params = new URLSearchParams({ from, to, apikey: apiKey });
  if (country) params.set('country', country);

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (res.status === 402) {
    throw new Error('FMP_PAYMENT_REQUIRED');
  }
  if (!res.ok) {
    throw new Error(`FMP_HTTP_${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error('FMP_UNEXPECTED_RESPONSE');
  }
  return data;
}

/** Lunes y domingo (ISO) de la semana que contiene `date`. */
export function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 domingo - 6 sábado
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const toIso = (x) => x.toISOString().slice(0, 10);
  return { from: toIso(monday), to: toIso(sunday), monday, sunday };
}

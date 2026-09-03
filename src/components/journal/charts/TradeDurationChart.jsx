import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Label,
  Legend
} from 'recharts';

/**
 * Analiza la duración de las operaciones (asumiendo que hay campos de entrada/salida)
 * Como no tenemos campos específicos de duración, usaremos un proxy basado en el índice
 * En una implementación real, se necesitarían timestamps de entrada y salida
 */
function buildTradeDurationData(entries) {
  const closed = entries
    .filter((e) => e.realPnl !== null && e.realPnl !== undefined)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Orden cronológico

  if (closed.length === 0) return [];

  // Simular duración basada en posición en secuencia (en una app real, usaríamos timestamps reales)
  // Para demo, asumimos que cada operación dura entre 1 y 10 períodos arbitrarios
  return closed.map((entry, index) => {
    // En una implementación real, esto sería: (exitTime - entryTime) / (1000 * 60) para minutos
    // Aquí usamos un valor simulado basado en la variación del P&L para demostrar el concepto
    const baseDuration = 1 + (index % 10); // Simula duración entre 1-10 unidades
    const volatilityFactor = Math.abs(entry.realPnl) > 0 ? Math.min(5, Math.abs(entry.realPnl) / 10) : 0;
    const duration = Math.max(1, baseDuration + volatilityFactor);

    return {
      trade: index + 1,
      duration: Number(duration.toFixed(1)),
      pnl: entry.realPnl,
      date: entry.date
    };
  });
}

function formatDuration(value) {
  return `${value}h`; // Asumiendo horas para la demo
}

function TradeDurationTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="duration-tooltip">
      <div className="duration-tooltip-trade">Operación #{point.trade}</div>
      <div className="duration-tooltip-value">
        {formatDuration(point.duration)}
      </div>
      <div className="duration-tooltip-pnl">
        P&L: ${point.pnl >= 0 ? '+' : ''}${point.pnl.toFixed(2)}
      </div>
    </div>
  );
}

export default function TradeDurationChart({ entries }) {
  const data = buildTradeDurationData(entries);

  if (data.length === 0) {
    return (
      <div className="equity-card">
        <div className="equity-header">
          <span className="lbl">Duración de Operaciones</span>
        </div>
        <div className="equity-empty">Aún no hay operaciones cerradas para analizar.</div>
      </div>
    );
  }

  const avgDuration = data.reduce((sum, d) => sum + d.duration, 0) / data.length;
  const quickTrades = data.filter(d => d.duration <= 2).length;
  const longTrades = data.filter(d => d.duration > 5).length;

  return (
    <div className="equity-card">
      <div className="equity-header">
        <span className="lbl">Duración de Operaciones</span>
        <span className="val">
          {data.length > 0 ? (
            <>
              <span className="pos">⌀{avgDuration.toFixed(1)}h</span>
              <span className="muted">·{quickTrades} rápidas ·{longTrades} largas</span>
            </>
          ) : '0h'}
        </span>
      </div>

      <div className="equity-svg-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="trade"
              tick={{ fontSize: 10, fill: '#7C8B99' }}
              interval={{
                preserveStart: true,
                preserveEnd: true
              }}
            />
            <YAxis
              tick={{
                fontSize: 12,
                fill: '#7C8B99'
              }}
            >
              <Label
                value="Duración (horas)"
                position="insideLeft"
                angle=-90
                offset={-10}
                style={{ fill: '#7C8B99', fontSize: 12 }}
              />
            </YAxis>
            <Tooltip
              content={<TradeDurationTooltip />}
              cursor={{ stroke: '#3A4A58', strokeDasharray: '3 3' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
            />
            <Bar
              dataKey="duration"
              barSize={0.6}
              fill={(props) => {
                // Color basado en P&L de la operación
                const pnl = data[props.dataIndex].pnl;
                if (pnl > 0) {
                  return 'url(#durationGradientPos)';
                } else if (pnl < 0) {
                  return 'url(#durationGradientNeg)';
                } else {
                  return 'url(#durationGradientNeutral)';
                }
              }}
            >
              <defs>
                <linearGradient id="durationGradientPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3DD68C" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3DD68C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="durationGradientNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5484D" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#E5484D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="durationGradientNeutral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4FD1C5" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#4FD1C5" stopOpacity={0} />
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
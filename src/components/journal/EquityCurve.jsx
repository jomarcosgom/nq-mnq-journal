import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';

/**
 * Convierte las operaciones cerradas (con P&L real) en puntos de la
 * curva de capital, ordenados cronológicamente con el saldo acumulado.
 */
function buildCurveData(entries) {
  const closed = entries
    .filter((e) => e.realPnl !== null && e.realPnl !== undefined)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let cum = 0;
  return closed.map((e, i) => {
    cum += e.realPnl;
    return {
      index: i + 1,
      date: e.date,
      pnl: Number(cum.toFixed(2))
    };
  });
}

function formatTooltipDate(iso) {
  const d = new Date(iso);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function EquityTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  const isPos = point.pnl >= 0;

  return (
    <div className="equity-tooltip">
      <div className="equity-tooltip-date">
        Operación #{point.index} · {formatTooltipDate(point.date)}
      </div>
      <div className={`equity-tooltip-value ${isPos ? 'pos' : 'neg'}`}>
        {isPos ? '+$' : '-$'}{Math.abs(point.pnl).toFixed(2)}
      </div>
    </div>
  );
}

export default function EquityCurve({ entries }) {
  const data = buildCurveData(entries);
  const finalVal = data.length > 0 ? data[data.length - 1].pnl : 0;
  const lineColor = finalVal >= 0 ? '#3DD68C' : '#E5484D';

  return (
    <div className="equity-card">
      <div className="equity-header">
        <span className="lbl">Curva de capital (P&amp;L acumulado)</span>
        <span className={`val ${data.length > 0 ? (finalVal >= 0 ? 'pos' : 'neg') : ''}`}>
          {data.length > 0 ? (finalVal >= 0 ? '+$' : '-$') + Math.abs(finalVal).toFixed(2) : '$0.00'}
        </span>
      </div>

      <div className="equity-svg-wrap">
        {data.length === 0 ? (
          <div className="equity-empty">Aún no hay operaciones cerradas para graficar.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#212C38" strokeDasharray="4 3" vertical={false} />
              <ReferenceLine y={0} stroke="#3A4A58" strokeDasharray="4 3" />

              <XAxis dataKey="index" hide />
              <YAxis hide domain={['dataMin', 'dataMax']} />

              <Tooltip
                content={<EquityTooltip />}
                cursor={{ stroke: '#3A4A58', strokeDasharray: '3 3' }}
              />

              <Area
                type="monotone"
                dataKey="pnl"
                stroke={lineColor}
                strokeWidth={2}
                fill="url(#equityFill)"
                dot={false}
                activeDot={{ r: 4, stroke: '#0B0F14', strokeWidth: 2, fill: lineColor }}
                animationDuration={450}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

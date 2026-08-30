import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { buildDrawdownSeries } from '../../utils/stats.js';

function formatTooltipDate(iso) {
  const d = new Date(iso);
  const pad2 = (n) => String(n).padStart(2, '0');
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function DrawdownTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;
  return (
    <div className="equity-tooltip">
      <div className="equity-tooltip-date">Operación #{point.index} · {formatTooltipDate(point.date)}</div>
      <div className="equity-tooltip-value neg">-${Math.abs(point.drawdown).toFixed(2)}</div>
    </div>
  );
}

export default function DrawdownChart({ entries }) {
  const data = buildDrawdownSeries(entries);
  const worst = data.length > 0 ? Math.min(...data.map((d) => d.drawdown)) : 0;

  return (
    <div className="equity-card">
      <div className="equity-header">
        <span className="lbl">Drawdown (caída desde el máximo histórico)</span>
        <span className={`val ${worst < 0 ? 'neg' : ''}`}>-${Math.abs(worst).toFixed(2)}</span>
      </div>

      <div className="equity-svg-wrap">
        {data.length === 0 ? (
          <div className="equity-empty">Aún no hay operaciones cerradas para graficar.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5484D" stopOpacity={0} />
                  <stop offset="100%" stopColor="#E5484D" stopOpacity={0.35} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#212C38" strokeDasharray="4 3" vertical={false} />
              <ReferenceLine y={0} stroke="#3A4A58" strokeDasharray="4 3" />

              <XAxis dataKey="index" hide />
              <YAxis hide domain={['dataMin', 0]} />

              <Tooltip content={<DrawdownTooltip />} cursor={{ stroke: '#3A4A58', strokeDasharray: '3 3' }} />

              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#E5484D"
                strokeWidth={2}
                fill="url(#drawdownFill)"
                dot={false}
                activeDot={{ r: 4, stroke: '#0B0F14', strokeWidth: 2, fill: '#E5484D' }}
                animationDuration={450}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

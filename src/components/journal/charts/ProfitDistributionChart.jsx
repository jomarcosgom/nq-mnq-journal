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
 * Crea un histograma de distribución de P&L por operación
 */
function buildProfitDistributionData(entries) {
  const closed = entries
    .filter((e) => e.realPnl !== null && e.realPnl !== undefined)
    .map(e => e.realPnl);

  if (closed.length === 0) return [];

  // Determinar rango y número de bins
  const minPnl = Math.min(...closed);
  const maxPnl = Math.max(...closed);
  const range = maxPnl - minPnl;
  const binCount = Math.min(20, Math.max(5, Math.floor(closed.length / 5))); // Adaptive bin count
  const binSize = range / binCount;

  // Inicializar bins
  const bins = Array(binCount).fill().map((_, index) => ({
    min: minPnl + index * binSize,
    max: minPnl + (index + 1) * binSize,
    count: 0
  }));

  // Contribuir a los bins
  closed.forEach(pnl => {
    if (pnl === maxPnl) {
      // Edge case: poner el valor máximo en el último bin
      bins[binCount - 1].count++;
    } else {
      const binIndex = Math.floor((pnl - minPnl) / binSize);
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].count++;
      }
    }
  });

  // Formatear para el gráfico
  return bins.map((bin, index) => ({
    bin: index,
    range: `${bin.min.toFixed(1)} to ${bin.max.toFixed(1)}`,
    count: bin.count,
    midpoint: (bin.min + bin.max) / 2
  }));
}

function formatTooltipValue(value) {
  return `$${value.toFixed(2)}`;
}

function ProfitDistributionTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="profit-dist-tooltip">
      <div className="profit-dist-tooltip-range">{point.range}</div>
      <div className="profit-dist-tooltip-count">
        {point.count} operación{point.count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function ProfitDistributionChart({ entries }) {
  const data = buildProfitDistributionData(entries);

  if (data.length === 0) {
    return (
      <div className="equity-card">
        <div className="equity-header">
          <span className="lbl">Distribución de P&L</span>
        </div>
        <div className="equity-empty">Aún no hay operaciones cerradas para graficar.</div>
      </div>
    );
  }

  const totalTrades = data.reduce((sum, d) => sum + d.count, 0);
  const winningTrades = data
    .filter(d => d.midpoint > 0)
    .reduce((sum, d) => sum + d.count, 0);
  const losingTrades = totalTrades - winningTrades;

  return (
    <div className="equity-card">
      <div className="equity-header">
        <span className="lbl">Distribución de P&L por Operación</span>
        <span className="val">
          {totalTrades > 0 ? (
            <>
              <span className="pos">↑{winningTrades} ganadoras</span>
              <span className="neg">↓{losingTrades} perdedoras</span>
            </>
          ) : '0 operaciones'}
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
              dataKey="range"
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
                value="Número de Operaciones"
                position="insideLeft"
                angle=-90
                offset={-10}
                style={{ fill: '#7C8B99', fontSize: 12 }}
              />
            </YAxis>
            <Tooltip
              content={<ProfitDistributionTooltip />}
              cursor={{ stroke: '#3A4A58', strokeDasharray: '3 3' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
            />
            <Bar
              dataKey="count"
              barSize={0.6}
              fill={(props) => {
                // Determinar color basado en si el bin es positivo, negativo o mixto
                const midpoint = data[props.dataIndex].midpoint;
                if (midpoint > 0) {
                  return 'url(#profitGradientPos)';
                } else if (midpoint < 0) {
                  return 'url(#profitGradientNeg)';
                } else {
                  return 'url(#profitGradientNeutral)';
                }
              }}
            >
              <defs>
                <linearGradient id="profitGradientPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3DD68C" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3DD68C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradientNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5484D" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#E5484D" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGradientNeutral" x1="0" y1="0" x2="0" y2="1">
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
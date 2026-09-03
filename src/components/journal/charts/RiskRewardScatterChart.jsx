import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Label,
  Legend
} from 'recharts';

/**
 * Prepara los datos para el gráfico de dispersión Riesgo vs Recompensa
 */
function buildRiskRewardData(entries) {
  const closed = entries
    .filter((e) => e.realPnl !== null && e.realPnl !== undefined)
    .slice();

  if (closed.length === 0) return [];

  return closed.map((entry, index) => {
    // Asumimos que riskDollars y rewardDollars ya están calculados en la entrada
    // Si no, los calcularíamos aquí basado en slPoints, tpPoints y contracts
    const risk = entry.riskDollars || 0;
    const reward = entry.rewardDollars || 0;

    return {
      trade: index + 1,
      risk: Number(risk.toFixed(2)),
      reward: Number(reward.toFixed(2)),
      ratio: reward > 0 && risk > 0 ? Number((reward / risk).toFixed(2)) : 0,
      pnl: entry.realPnl,
      date: entry.date,
      outcome: entry.outcome || 'pending'
    };
  });
}

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function RiskRewardTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rr-tooltip">
      <div className="rr-tooltip-trade">Operación #{point.trade}</div>
      <div className="rr-tooltip-risk">Riesgo: {formatCurrency(point.risk)}</div>
      <div className="rr-tooltip-reward">Recompensa: {formatCurrency(point.reward)}</div>
      <div className="rr-tooltip-ratio">R:R: {point.ratio.toFixed(2)}</div>
      <div className="rr-tooltip-pnl">
        P&L: {point.pnl >= 0 ? '+' : ''}${formatCurrency(Math.abs(point.pnl))}
      </div>
    </div>
  );
}

export default function RiskRewardScatterChart({ entries }) {
  const data = buildRiskRewardData(entries);

  if (data.length === 0) {
    return (
      <div className="equity-card">
        <div className="equity-header">
          <span className="lbl">Análisis Riesgo vs Recompensa</span>
        </div>
        <div className="equity-empty">Aún no hay operaciones cerradas para analizar.</div>
      </div>
    );
  }

  const avgRatio = data.reduce((sum, d) => sum + d.ratio, 0) / data.length;
  const profitableTrades = data.filter(d => d.pnl > 0).length;
  const losingTrades = data.length - profitableTrades;

  // Determinar rangos adecuados para ejes
  const maxRisk = Math.max(...data.map(d => d.risk)) || 1;
  const maxReward = Math.max(...data.map(d => d.reward)) || 1;

  return (
    <div className="equity-card">
      <div className="equity-header">
        <span className="lbl">Análisis Riesgo vs Recompensa</span>
        <span className="val">
          {data.length > 0 ? (
            <>
              <span className="pos">⌀{avgRatio.toFixed(2)} R:R</span>
              <span className="muted">·{profitableTrades} ganadoras ·{losingTrades} perdedoras</span>
            </>
          ) : '0 operaciones'}
        </span>
      </div>

      <div className="equity-svg-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, maxRisk * 1.1]}
              tick={{
                fontSize: 12,
                fill: '#7C8B99',
                formatter: (value) => formatCurrency(value)
              }}
            >
              <Label
                value="Riesgo ($)"
                position="bottom"
                offset={-10}
                angle={0}
                style={{ fill: '#7C8B99', fontSize: 12 }}
              />
            </XAxis>
            <YAxis
              type="number"
              domain={[0, maxReward * 1.1]}
              tick={{
                fontSize: 12,
                fill: '#7C8B99',
                formatter: (value) => formatCurrency(value)
              }}
            >
              <Label
                value="Recompensa ($)"
                position="insideLeft"
                angle=-90
                offset={-10}
                style={{ fill: '#7C8B99', fontSize: 12 }}
              />
            </YAxis>
            <Tooltip
              content={<RiskRewardTooltip />}
              cursor={{ stroke: '#3A4A58', strokeDasharray: '3 3' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => {
                // Personalizar leyenda basado en outcome
                return value;
              }}
            />
            <Scatter
              name="Operaciones"
              dataKey="risk"
              dataKeyY="reward"
              size={80}
              fill={(props) => {
                // Color basado en resultado de la operación
                const pnl = props.payload.pnl;
                if (pnl > 0) {
                  return '#3DD68C'; // Verde para ganadoras
                } else if (pnl < 0) {
                  return '#E5484D'; // Rojo para perdedoras
                } else {
                  return '#4FD1C5'; // Cian para BE
                }
              }}
              stroke={(props) => {
                const pnl = props.payload.pnl;
                if (pnl > 0) {
                  return '#3DD68C';
                } else if (pnl < 0) {
                  return '#E5484D';
                } else {
                  return '#4FD1C5';
                }
              }}
              strokeWidth={2}
            >
              {/* Agregar animación y efectos */}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
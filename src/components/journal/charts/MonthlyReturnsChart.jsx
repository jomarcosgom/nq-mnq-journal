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
import { format } from 'date-fns';

/**
 * Agrupa las operaciones por mes y calcula el P&L total para cada mes
 */
function buildMonthlyData(entries) {
  const closed = entries
    .filter((e) => e.realPnl !== null && e.realPnl !== undefined)
    .slice();

  // Agrupar por año-mes
  const monthlyMap = {};

  closed.forEach(entry => {
    const date = new Date(entry.date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap[yearMonth]) {
      monthlyMap[yearMonth] = { total: 0, count: 0, yearMonth };
    }

    monthlyMap[yearMonth].total += entry.realPnl;
    monthlyMap[yearMonth].count++;
  });

  // Convertir a array y ordenar cronológicamente
  const monthlyArray = Object.values(monthlyMap);
  monthlyArray.sort((a, b) => {
    const [yearA, monthA] = a.yearMonth.split('-').map(Number);
    const [yearB, monthB] = b.yearMonth.split('-').map(Number);
    return yearA - yearB || monthA - monthB;
  });

  // Formatear para el gráfico
  return monthlyArray.map((item, index) => {
    const [year, month] = item.yearMonth.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return {
      month: format(date, 'MMM yyyy'),
      value: Number(item.total.toFixed(2)),
      count: item.count,
      fullDate: item.yearMonth
    };
  });
}

function formatTooltipValue(value) {
  return `$${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

function MonthlyTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload;

  return (
    <div className="monthly-tooltip">
      <div className="monthly-tooltip-label">{point.month}</div>
      <div className={`monthly-tooltip-value ${point.value >= 0 ? 'pos' : 'neg'}`}>
        {formatTooltipValue(point.value)}
      </div>
      <div className="monthly-tooltip-detail">
        {point.count} operación{point.count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function MonthlyReturnsChart({ entries }) {
  const data = buildMonthlyData(entries);

  if (data.length === 0) {
    return (
      <div className="equity-card">
        <div className="equity-header">
          <span className="lbl">Retornos Mensuales</span>
        </div>
        <div className="equity-empty">Aún no hay operaciones cerradas para graficar.</div>
      </div>
    );
  }

  const positiveMonths = data.filter(d => d.value >= 0).length;
  const negativeMonths = data.length - positiveMonths;

  return (
    <div className="equity-card">
      <div className="equity-header">
        <span className="lbl">Retornos Mensuales</span>
        <span className="val">
          {data.length > 0 ? (
            <>
              <span className="pos">+{positiveMonths} meses</span>
              <span className="neg">-{negativeMonths} meses</span>
            </>
          ) : '0 meses'}
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
              dataKey="month"
              tick={{ fontSize: 12, fill: '#7C8B99' }}
            />
            <YAxis
              tick={{
                fontSize: 12,
                fill: '#7C8B99',
                formatter: (value) => `$${value >= 0 ? '+' : ''}${value.toFixed(0)}`
              }}
            />
            <Tooltip
              content={<MonthlyTooltip />}
              cursor={{ stroke: '#3A4A58', strokeDasharray: '3 3' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => `P&L: $${value >= 0 ? '+' : ''}${Math.abs(value).toFixed(0)}`}
            />
            <Bar
              dataKey="value"
              barSize={0.6}
              fill={(props) => {
                if (props.value >= 0) {
                  return 'url(#monthlyGradientPos)';
                }
                return 'url(#monthlyGradientNeg)';
              }}
            >
              <defs>
                <linearGradient id="monthlyGradientPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3DD68C" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3DD68C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="monthlyGradientNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E5484D" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#E5484D" stopOpacity={0} />
                </linearGradient>
              </defs>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
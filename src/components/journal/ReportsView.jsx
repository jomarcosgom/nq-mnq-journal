import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  byDayOfWeek,
  byHourOfDay,
  byContract,
  byTag,
  byMonth,
  pnlDistribution,
  byRating,
  byPlanFollowed,
  topByNetPnl,
  bottomByNetPnl,
  topByCount,
  topByWinRate
} from '../../utils/reports.js';
import { filterByDateRange } from '../../utils/dateRange.js';
import DateRangeSelector from './DateRangeSelector.jsx';

function fmtSigned(value) {
  return (value >= 0 ? '+$' : '-$') + Math.abs(value).toFixed(2);
}

function PnlBarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="equity-tooltip">
      <div className="equity-tooltip-date">{p.label} · {p.count} op.</div>
      <div className={`equity-tooltip-value ${p.netPnl >= 0 ? 'pos' : 'neg'}`}>{fmtSigned(p.netPnl)}</div>
    </div>
  );
}

function PnlBarChart({ data, height = 180 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#212C38" strokeDasharray="4 3" vertical={false} />
        <ReferenceLine y={0} stroke="#3A4A58" />
        <XAxis dataKey="label" tick={{ fill: '#7C8B99', fontSize: 10.5 }} axisLine={{ stroke: '#212C38' }} tickLine={false} />
        <YAxis hide />
        <Tooltip content={<PnlBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="netPnl" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.count === 0 ? '#2A3440' : d.netPnl >= 0 ? '#3DD68C' : '#E5484D'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DistBarTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="equity-tooltip">
      <div className="equity-tooltip-date">{p.label}</div>
      <div className={`equity-tooltip-value ${p.isWin ? 'pos' : 'neg'}`}>{p.count} operación(es)</div>
    </div>
  );
}

function DistributionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#212C38" strokeDasharray="4 3" vertical={false} />
        <ReferenceLine y={0} stroke="#3A4A58" />
        <XAxis dataKey="label" tick={{ fill: '#7C8B99', fontSize: 9.5 }} axisLine={{ stroke: '#212C38' }} tickLine={false} interval={0} angle={-35} textAnchor="end" height={50} />
        <YAxis hide />
        <Tooltip content={<DistBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="signedCount" radius={[3, 3, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.isWin ? '#3DD68C' : '#E5484D'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function PlanCompareCard({ group }) {
  return (
    <div className="compare-card">
      <div className="k">{group.label}</div>
      <div className="compare-row"><span className="compare-label">Operaciones</span><span>{group.count}</span></div>
      <div className="compare-row">
        <span className="compare-label">P&amp;L neto</span>
        <span className={group.netPnl >= 0 ? 'pos' : 'neg'}>{fmtSigned(group.netPnl)}</span>
      </div>
      <div className="compare-row">
        <span className="compare-label">Win rate</span>
        <span>{group.winRate !== null ? `${group.winRate.toFixed(0)}%` : '—'}</span>
      </div>
      <div className="compare-row">
        <span className="compare-label">Expectativa / op.</span>
        <span className={group.expectancy >= 0 ? 'pos' : 'neg'}>
          {group.expectancy !== null ? fmtSigned(group.expectancy) : '—'}
        </span>
      </div>
    </div>
  );
}

function TagRankList({ title, rows, valueKey, formatValue, emptyText }) {
  return (
    <div className="tag-rank-card">
      <div className="tag-rank-title">{title}</div>
      {rows.length === 0 ? (
        <div className="tag-rank-empty">{emptyText}</div>
      ) : (
        <div className="tag-rank-list">
          {rows.map((r) => (
            <div className="tag-rank-row" key={r.tag}>
              <span className="tag-chip-sm">{r.tag}</span>
              {valueKey !== 'count' && <span className="tag-rank-count">{r.count} op.</span>}
              <span className={`tag-rank-value ${valueKey === 'netPnl' ? (r[valueKey] >= 0 ? 'pos' : 'neg') : ''}`}>
                {formatValue(r[valueKey])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsView({ entries }) {
  const [range, setRange] = useState('all');
  const rangedEntries = filterByDateRange(entries, range);

  const dayData = byDayOfWeek(rangedEntries);
  const hourData = byHourOfDay(rangedEntries).filter((h) => h.count > 0);
  const contractData = byContract(rangedEntries);
  const tagStats = byTag(rangedEntries);
  const monthData = byMonth(rangedEntries);
  const distData = pnlDistribution(rangedEntries);
  const ratingData = byRating(rangedEntries);
  const planData = byPlanFollowed(rangedEntries);

  const hasClosedTrades = rangedEntries.some((e) => e.realPnl !== null && e.realPnl !== undefined);

  return (
    <>
      <div className="dashboard-header-row">
        <h2 className="section-title dashboard-title">Reportes</h2>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>
      <p className="helper-text">Desglose de tu rendimiento por día, hora, contrato y tags para encontrar dónde está tu ventaja.</p>

      {!hasClosedTrades ? (
        <div className="history-empty">Aún no hay operaciones cerradas para analizar.</div>
      ) : (
        <>
          <div className="ticket">
            <div className="body-inner">
              <div className="equity-header"><span className="lbl">P&amp;L mensual</span></div>
              <PnlBarChart data={monthData} />
            </div>
          </div>

          <div className="reports-grid" style={{ marginTop: '14px' }}>
            <div className="ticket">
              <div className="body-inner">
                <div className="equity-header"><span className="lbl">P&amp;L por día de la semana</span></div>
                <PnlBarChart data={dayData} />
              </div>
            </div>
            <div className="ticket">
              <div className="body-inner">
                <div className="equity-header"><span className="lbl">P&amp;L por contrato</span></div>
                <PnlBarChart data={contractData} />
              </div>
            </div>
          </div>

          <div className="reports-grid" style={{ marginTop: '14px' }}>
            <div className="ticket">
              <div className="body-inner">
                <div className="equity-header"><span className="lbl">Distribución de resultados</span></div>
                <DistributionChart data={distData} />
              </div>
            </div>
            <div className="ticket">
              <div className="body-inner">
                <div className="equity-header"><span className="lbl">Rendimiento por rating</span></div>
                <PnlBarChart data={ratingData} />
              </div>
            </div>
          </div>

          <div className="ticket" style={{ marginTop: '14px' }}>
            <div className="body-inner">
              <div className="equity-header"><span className="lbl">P&amp;L por hora del día</span></div>
              {hourData.length === 0 ? (
                <div className="equity-empty">Sin datos suficientes.</div>
              ) : (
                <PnlBarChart data={hourData} height={200} />
              )}
            </div>
          </div>

          <div className="ticket" style={{ marginTop: '14px' }}>
            <div className="body-inner">
              <div className="equity-header"><span className="lbl">Disciplina vs resultados</span></div>
              <div className="compare-grid">
                {planData.map((g) => <PlanCompareCard group={g} key={g.label} />)}
              </div>
            </div>
          </div>

          <div className="tag-rank-grid">
            <TagRankList
              title="Mejores tags (P&L)"
              rows={topByNetPnl(tagStats)}
              valueKey="netPnl"
              formatValue={fmtSigned}
              emptyText="Añade tags a tus operaciones para ver este informe."
            />
            <TagRankList
              title="Peores tags (P&L)"
              rows={bottomByNetPnl(tagStats).filter((r) => r.netPnl < 0)}
              valueKey="netPnl"
              formatValue={fmtSigned}
              emptyText="Sin tags con pérdidas todavía."
            />
            <TagRankList
              title="Tags más usados"
              rows={topByCount(tagStats)}
              valueKey="count"
              formatValue={(v) => `${v} op.`}
              emptyText="Añade tags a tus operaciones para ver este informe."
            />
            <TagRankList
              title="Mayor win rate por tag"
              rows={topByWinRate(tagStats)}
              valueKey="winRate"
              formatValue={(v) => `${v.toFixed(0)}%`}
              emptyText="Necesitas al menos una operación cerrada con tag."
            />
          </div>
        </>
      )}
    </>
  );
}

import { computeStats } from '../../utils/stats.js';

function fmtSigned(value) {
  return (value >= 0 ? '+$' : '-$') + Math.abs(value).toFixed(2);
}

function fmtRatio(value) {
  if (value === null || value === undefined) return '—';
  return value === Infinity ? '∞' : `${value.toFixed(2)}x`;
}

function scoreTier(score) {
  if (score === null) return 'na';
  if (score >= 70) return 'good';
  if (score >= 40) return 'mid';
  return 'low';
}

export default function StatsGrid({ entries }) {
  const stats = computeStats(entries);

  const pnlClass = stats.netPnl > 0 ? 'pos' : stats.netPnl < 0 ? 'neg' : '';
  const expClass = stats.expectancy > 0 ? 'pos' : stats.expectancy < 0 ? 'neg' : '';

  let profitFactorText = '—';
  if (stats.profitFactor !== null) {
    profitFactorText = stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2);
  }

  let streakText = '—';
  let streakClass = '';
  if (stats.streak > 0) {
    streakText = `${stats.streak} ${stats.streakType === 'won' ? 'ganada(s)' : 'perdida(s)'}`;
    streakClass = stats.streakType === 'won' ? 'pos' : 'neg';
  }

  const tier = scoreTier(stats.score);
  const scoreDeg = stats.score !== null ? (stats.score / 100) * 360 : 0;

  return (
    <>
      <div className="stats-hero">
        <div className="hero-card score-card">
          <div
            className={`score-ring tier-${tier}`}
            style={{ '--score-deg': `${scoreDeg}deg` }}
          >
            <div className="score-ring-inner">{stats.score !== null ? stats.score : '—'}</div>
          </div>
          <div className="score-label">
            <div className="k">Trading Score</div>
            <div className="sub">Win rate + profit factor + disciplina + consistencia</div>
          </div>
        </div>

        <div className="hero-card">
          <div className="k">P&amp;L neto</div>
          <div className={`v ${pnlClass}`}>{fmtSigned(stats.netPnl)}</div>
        </div>
        <div className="hero-card">
          <div className="k">Win rate</div>
          <div className="v">{stats.winRate !== null ? `${stats.winRate.toFixed(0)}%` : '—'}</div>
        </div>
        <div className="hero-card">
          <div className="k">Profit factor</div>
          <div className="v">{profitFactorText}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="k">Operaciones</div>
          <div className="v">{entries.length}</div>
        </div>
        <div className="stat-card">
          <div className="k">Expectativa / op.</div>
          <div className={`v ${expClass}`}>
            {stats.expectancy !== null ? fmtSigned(stats.expectancy) : '—'}
          </div>
        </div>
        <div className="stat-card">
          <div className="k">Racha actual</div>
          <div className={`v ${streakClass}`}>{streakText}</div>
        </div>
        <div className="stat-card">
          <div className="k">Drawdown máx.</div>
          <div className="v neg">{stats.maxDrawdown > 0 ? `-$${stats.maxDrawdown.toFixed(2)}` : '$0.00'}</div>
        </div>
        <div className="stat-card">
          <div className="k">Mejor operación</div>
          <div className="v pos">{stats.bestTrade !== null ? fmtSigned(stats.bestTrade) : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="k">Peor operación</div>
          <div className="v neg">{stats.worstTrade !== null ? fmtSigned(stats.worstTrade) : '—'}</div>
        </div>
        <div className="stat-card">
          <div className="k">Ratio ganancia/pérdida</div>
          <div className="v">{fmtRatio(stats.avgWinLossRatio)}</div>
        </div>
        <div className="stat-card">
          <div className="k">Racha máx. ganadora</div>
          <div className="v pos">{stats.maxWinStreak}</div>
        </div>
        <div className="stat-card">
          <div className="k">Racha máx. perdedora</div>
          <div className="v neg">{stats.maxLossStreak}</div>
        </div>
        <div className="stat-card">
          <div className="k">Plan seguido</div>
          <div className="v">{stats.planRate !== null ? `${stats.planRate.toFixed(0)}%` : '—'}</div>
        </div>
      </div>
    </>
  );
}


/**
 * Calcula las métricas de rendimiento del journal a partir de las
 * operaciones guardadas. Solo se tienen en cuenta las que tienen un
 * P&L real registrado (las que están en BE/pendientes se excluyen).
 */
export function computeStats(entries) {
  const closed = entries.filter((e) => e.realPnl !== null && e.realPnl !== undefined);
  const won = closed.filter((e) => e.realPnl > 0);
  const lost = closed.filter((e) => e.realPnl < 0);

  const netPnl = closed.reduce((s, e) => s + e.realPnl, 0);
  const winRate = closed.length > 0 ? (won.length / closed.length) * 100 : null;

  const avgWin = won.length > 0 ? won.reduce((s, e) => s + e.realPnl, 0) / won.length : 0;
  const avgLoss = lost.length > 0 ? Math.abs(lost.reduce((s, e) => s + e.realPnl, 0) / lost.length) : 0;

  const expectancy = closed.length > 0
    ? (won.length / closed.length) * avgWin - (lost.length / closed.length) * avgLoss
    : null;

  const grossProfit = won.reduce((s, e) => s + e.realPnl, 0);
  const grossLoss = Math.abs(lost.reduce((s, e) => s + e.realPnl, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : null);

  // Racha actual: recorre de la más reciente a la más antigua contando
  // operaciones consecutivas con el mismo resultado (ganada/perdida).
  const closedDesc = closed.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  let streakType = null;
  for (const e of closedDesc) {
    const type = e.realPnl > 0 ? 'won' : 'lost';
    if (streakType === null) {
      streakType = type;
      streak = 1;
    } else if (type === streakType) {
      streak++;
    } else {
      break;
    }
  }

  // Orden cronológico ascendente, usado para drawdown y rachas máximas.
  const closedAsc = closed.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let curWin = 0;
  let curLoss = 0;
  for (const e of closedAsc) {
    if (e.realPnl > 0) {
      curWin++;
      curLoss = 0;
    } else {
      curLoss++;
      curWin = 0;
    }
    maxWinStreak = Math.max(maxWinStreak, curWin);
    maxLossStreak = Math.max(maxLossStreak, curLoss);
  }

  // Drawdown máximo: mayor caída desde un pico de la curva de capital acumulada.
  let cum = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const e of closedAsc) {
    cum += e.realPnl;
    peak = Math.max(peak, cum);
    maxDrawdown = Math.max(maxDrawdown, peak - cum);
  }

  const bestTrade = closed.length > 0 ? Math.max(...closed.map((e) => e.realPnl)) : null;
  const worstTrade = closed.length > 0 ? Math.min(...closed.map((e) => e.realPnl)) : null;

  const avgWinLossRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? Infinity : null);

  const withPlan = closed.filter((e) => e.followedPlan === 'yes' || e.followedPlan === 'no');
  const planRate = withPlan.length > 0
    ? (withPlan.filter((e) => e.followedPlan === 'yes').length / withPlan.length) * 100
    : null;

  const score = computeScore({ winRate, profitFactor, planRate, avgWinLossRatio });

  return {
    netPnl,
    winRate,
    expectancy,
    profitFactor,
    streak,
    streakType,
    closedCount: closed.length,
    maxWinStreak,
    maxLossStreak,
    maxDrawdown,
    bestTrade,
    worstTrade,
    avgWin,
    avgLoss,
    avgWinLossRatio,
    planRate,
    score
  };
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Puntuación compuesta 0-100 al estilo "Zella Score": combina win rate,
 * profit factor, disciplina (seguir el plan) y consistencia (ratio
 * ganancia media / pérdida media). Devuelve null si no hay datos suficientes.
 */
function computeScore({ winRate, profitFactor, planRate, avgWinLossRatio }) {
  if (winRate === null) return null;

  const winRateScore = clamp(winRate, 0, 100);

  const pfValue = profitFactor === Infinity ? 3 : (profitFactor || 0);
  const pfScore = clamp(pfValue / 3, 0, 1) * 100;

  const planScore = planRate === null ? winRateScore : clamp(planRate, 0, 100);

  const ratioValue = avgWinLossRatio === Infinity ? 3 : (avgWinLossRatio || 0);
  const consistencyScore = clamp(ratioValue / 3, 0, 1) * 100;

  const weighted = winRateScore * 0.35 + pfScore * 0.35 + planScore * 0.15 + consistencyScore * 0.15;
  return Math.round(clamp(weighted, 0, 100));
}

/**
 * Serie temporal de drawdown: para cada operación cerrada (en orden
 * cronológico), cuánto por debajo del máximo histórico de la curva de
 * capital se encuentra el saldo acumulado en ese punto (siempre <= 0).
 */
export function buildDrawdownSeries(entries) {
  const closed = entries
    .filter((e) => e.realPnl !== null && e.realPnl !== undefined)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let cum = 0;
  let peak = 0;
  return closed.map((e, i) => {
    cum += e.realPnl;
    peak = Math.max(peak, cum);
    return { index: i + 1, date: e.date, drawdown: Number((cum - peak).toFixed(2)) };
  });
}

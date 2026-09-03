/**
 * Motor de reglas de cuentas (fondeo / personales).
 *
 * Cada cuenta guarda un array `rules` totalmente personalizable. Una regla es
 * un objeto plano y todos sus parámetros (métrica, base de cálculo, unidad,
 * valor, umbral de aviso...) se eligen caso por caso desde la UI, por lo que dos
 * reglas de "drawdown" en la misma cuenta pueden calcularse de forma distinta.
 */

/** Direcciones: `limit` = no se puede superar; `goal` = hay que alcanzarlo. */
export const RULE_METRICS = {
  maxLoss: {
    label: 'Pérdida máxima / Drawdown',
    direction: 'limit',
    hasBasis: true,
    units: ['amount', 'percent'],
    describe: 'Cuánto puedes perder antes de romper la cuenta.'
  },
  dailyLoss: {
    label: 'Pérdida máxima diaria',
    direction: 'limit',
    hasBasis: false,
    units: ['amount', 'percent'],
    describe: 'Pérdida máxima acumulada dentro de un mismo día.'
  },
  profitTarget: {
    label: 'Objetivo de beneficio / Payout',
    direction: 'goal',
    hasBasis: false,
    units: ['amount', 'percent'],
    describe: 'Beneficio neto necesario para pasar la fase o pedir payout.'
  },
  minTradingDays: {
    label: 'Días mínimos de trading',
    direction: 'goal',
    hasBasis: false,
    units: ['days'],
    describe: 'Días distintos con al menos una operación cerrada.'
  },
  maxDailyTrades: {
    label: 'Máximo de operaciones por día',
    direction: 'limit',
    hasBasis: false,
    units: ['trades'],
    describe: 'Nº máximo de operaciones permitidas en un mismo día.'
  },
  maxContracts: {
    label: 'Máximo de contratos por operación',
    direction: 'limit',
    hasBasis: false,
    units: ['contracts'],
    describe: 'Tamaño máximo permitido en una sola operación.'
  },
  consistency: {
    label: 'Regla de consistencia',
    direction: 'limit',
    hasBasis: false,
    units: ['percent'],
    describe: 'Ningún día puede aportar más de X% del beneficio total.'
  }
};

/** Bases de cálculo disponibles para las reglas de pérdida máxima. */
export const RULE_BASES = {
  static: {
    label: 'Estático (desde el balance inicial)',
    describe: 'El límite es siempre balance inicial − importe. No se mueve nunca.'
  },
  trailingPeak: {
    label: 'Trailing sobre el máximo de equity',
    describe: 'El límite sube con cada nuevo máximo de la curva de capital.'
  },
  trailingEod: {
    label: 'Trailing sobre el cierre de cada día',
    describe: 'El límite sube solo con los máximos de balance al cierre del día.'
  },
  trailingLocked: {
    label: 'Trailing que se congela',
    describe: 'Trailing normal, pero deja de subir al llegar al punto de bloqueo.'
  }
};

export const UNIT_LABELS = {
  amount: '$',
  percent: '%',
  days: 'días',
  trades: 'ops',
  contracts: 'contratos'
};

let ruleSeq = 0;
export function createRuleId() {
  ruleSeq += 1;
  return `r${Date.now().toString(36)}${ruleSeq.toString(36)}`;
}

export function createRule(metric = 'maxLoss') {
  const def = RULE_METRICS[metric];
  return {
    id: createRuleId(),
    metric,
    name: def.label,
    enabled: true,
    unit: def.units[0],
    value: metric === 'minTradingDays' ? 10 : 0,
    basis: def.hasBasis ? 'static' : null,
    lockOffset: 0,
    warnAt: 80
  };
}

/** Clave de día en hora local, para agrupar operaciones por jornada. */
export function dayKey(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return 'invalid';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const hasPnl = (e) => e.realPnl !== null && e.realPnl !== undefined && !Number.isNaN(e.realPnl);

/**
 * Serie de capital de la cuenta: operaciones cerradas en orden cronológico
 * más el balance acumulado tras cada una.
 */
export function buildEquitySeries(entries, initialBalance) {
  const closed = entries.filter(hasPnl).slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  let equity = initialBalance;
  return closed.map((e) => {
    equity += e.realPnl;
    return { entry: e, pnl: e.realPnl, equity, day: dayKey(e.date) };
  });
}

/** P&L agregado por día, en orden cronológico. */
export function buildDailySeries(series) {
  const map = new Map();
  for (const point of series) {
    const cur = map.get(point.day) || { day: point.day, pnl: 0, trades: 0, equity: 0 };
    cur.pnl += point.pnl;
    cur.trades += 1;
    cur.equity = point.equity; // equity al cierre del día
    map.set(point.day, cur);
  }
  return [...map.values()];
}

/** Convierte el valor de una regla a dólares cuando aplica. */
export function ruleAmount(rule, initialBalance) {
  const value = Number(rule.value) || 0;
  if (rule.unit === 'percent') return (initialBalance * value) / 100;
  return value;
}

function evaluateMaxLoss(rule, account, series) {
  const initial = account.initialBalance;
  const limit = ruleAmount(rule, initial);
  const basis = rule.basis || 'static';
  const lockAt = initial + (Number(rule.lockOffset) || 0);

  let reference = initial; // máximo relevante según la base elegida
  let threshold = initial - limit;
  let breached = false;
  let breachedAt = null;

  const bump = (candidate) => {
    if (candidate <= reference) return;
    reference = candidate;
    const next = reference - limit;
    if (basis === 'trailingLocked') {
      // El umbral sube hasta el punto de bloqueo y ahí se queda congelado.
      threshold = Math.min(Math.max(threshold, next), lockAt);
    } else {
      threshold = Math.max(threshold, next);
    }
  };

  if (basis === 'trailingEod') {
    const daily = buildDailySeries(series);
    let idx = 0;
    for (const point of series) {
      if (point.equity <= threshold && !breached) {
        breached = true;
        breachedAt = point.entry.date;
      }
      // Tras cerrar el día, el umbral puede subir con el balance de cierre.
      const isLastOfDay = idx === series.length - 1 || series[idx + 1].day !== point.day;
      if (isLastOfDay) {
        const dayInfo = daily.find((d) => d.day === point.day);
        if (dayInfo) bump(dayInfo.equity);
      }
      idx += 1;
    }
  } else {
    for (const point of series) {
      if (basis !== 'static') bump(point.equity);
      if (point.equity <= threshold && !breached) {
        breached = true;
        breachedAt = point.entry.date;
      }
    }
  }

  const equity = series.length > 0 ? series[series.length - 1].equity : initial;
  const remaining = equity - threshold;

  return {
    current: equity,
    limit,
    threshold,
    remaining,
    progress: limit > 0 ? Math.min(100, Math.max(0, (1 - remaining / limit) * 100)) : 0,
    status: breached ? 'breached' : null,
    breachedAt,
    detail: `Límite actual: ${fmtMoney(threshold)} · Equity: ${fmtMoney(equity)}`
  };
}

function evaluateDailyLoss(rule, account, series) {
  const limit = ruleAmount(rule, account.initialBalance);
  const daily = buildDailySeries(series);
  const worst = daily.reduce((min, d) => Math.min(min, d.pnl), 0);
  const breached = limit > 0 && worst <= -limit;
  const today = daily.find((d) => d.day === dayKey(new Date().toISOString()));
  const todayPnl = today ? today.pnl : 0;
  const remaining = limit + Math.min(0, todayPnl);

  return {
    current: todayPnl,
    limit,
    remaining,
    progress: limit > 0 ? Math.min(100, Math.max(0, (-Math.min(0, todayPnl) / limit) * 100)) : 0,
    status: breached ? 'breached' : null,
    detail: `Hoy: ${fmtMoney(todayPnl)} · Peor día: ${fmtMoney(worst)}`
  };
}

function evaluateProfitTarget(rule, account, series) {
  const target = ruleAmount(rule, account.initialBalance);
  const equity = series.length > 0 ? series[series.length - 1].equity : account.initialBalance;
  const profit = equity - account.initialBalance;
  const reached = target > 0 && profit >= target;

  return {
    current: profit,
    limit: target,
    remaining: target - profit,
    progress: target > 0 ? Math.min(100, Math.max(0, (profit / target) * 100)) : 0,
    status: reached ? 'passed' : null,
    detail: `Beneficio neto: ${fmtMoney(profit)} de ${fmtMoney(target)}`
  };
}

function evaluateMinTradingDays(rule, account, series) {
  const target = Number(rule.value) || 0;
  const days = new Set(series.map((p) => p.day)).size;
  return {
    current: days,
    limit: target,
    remaining: target - days,
    progress: target > 0 ? Math.min(100, (days / target) * 100) : 0,
    status: days >= target && target > 0 ? 'passed' : null,
    detail: `${days} de ${target} días operados`
  };
}

function evaluateMaxDailyTrades(rule, account, series) {
  const limit = Number(rule.value) || 0;
  const daily = buildDailySeries(series);
  const worst = daily.reduce((max, d) => Math.max(max, d.trades), 0);
  const today = daily.find((d) => d.day === dayKey(new Date().toISOString()));
  const todayTrades = today ? today.trades : 0;
  return {
    current: todayTrades,
    limit,
    remaining: limit - todayTrades,
    progress: limit > 0 ? Math.min(100, (todayTrades / limit) * 100) : 0,
    status: limit > 0 && worst > limit ? 'breached' : null,
    detail: `Hoy: ${todayTrades} · Máximo en un día: ${worst}`
  };
}

function evaluateMaxContracts(rule, account, series, allEntries) {
  const limit = Number(rule.value) || 0;
  const worst = allEntries.reduce((max, e) => Math.max(max, Number(e.contracts) || 0), 0);
  return {
    current: worst,
    limit,
    remaining: limit - worst,
    progress: limit > 0 ? Math.min(100, (worst / limit) * 100) : 0,
    status: limit > 0 && worst > limit ? 'breached' : null,
    detail: `Mayor tamaño usado: ${worst} contratos`
  };
}

function evaluateConsistency(rule, account, series) {
  const limit = Number(rule.value) || 0;
  const daily = buildDailySeries(series);
  const totalProfit = daily.reduce((s, d) => s + Math.max(0, d.pnl), 0);
  const bestDay = daily.reduce((max, d) => Math.max(max, d.pnl), 0);
  const share = totalProfit > 0 ? (bestDay / totalProfit) * 100 : 0;
  return {
    current: share,
    limit,
    remaining: limit - share,
    progress: limit > 0 ? Math.min(100, (share / limit) * 100) : 0,
    status: limit > 0 && share > limit ? 'breached' : null,
    detail: `Mejor día = ${share.toFixed(1)}% del beneficio (máx. ${limit}%)`
  };
}

const EVALUATORS = {
  maxLoss: evaluateMaxLoss,
  dailyLoss: evaluateDailyLoss,
  profitTarget: evaluateProfitTarget,
  minTradingDays: evaluateMinTradingDays,
  maxDailyTrades: evaluateMaxDailyTrades,
  maxContracts: evaluateMaxContracts,
  consistency: evaluateConsistency
};

function fmtMoney(n) {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString('es-ES', { maximumFractionDigits: 2 })}`;
}

/**
 * Evalúa todas las reglas activas de una cuenta contra sus operaciones.
 * Devuelve un array de resultados listos para pintar.
 */
export function evaluateAccount(account, entries) {
  if (!account) return { results: [], equity: 0, netPnl: 0, series: [] };

  const initial = Number(account.initialBalance) || 0;
  const normalized = { ...account, initialBalance: initial };
  const series = buildEquitySeries(entries, initial);
  const equity = series.length > 0 ? series[series.length - 1].equity : initial;

  const results = (account.rules || [])
    .filter((r) => r.enabled !== false)
    .map((rule) => {
      const evaluator = EVALUATORS[rule.metric];
      if (!evaluator) return null;
      const raw = evaluator(rule, normalized, series, entries);
      const direction = RULE_METRICS[rule.metric].direction;
      const warnAt = Number(rule.warnAt) || 80;

      let status = raw.status;
      if (!status) {
        if (direction === 'goal') status = 'ok';
        else status = raw.progress >= warnAt ? 'warning' : 'ok';
      }

      return { rule, direction, ...raw, status };
    })
    .filter(Boolean);

  return { results, equity, netPnl: equity - initial, series };
}

/** Estado global de la cuenta a partir de sus reglas. */
export function accountHealth(results) {
  if (results.some((r) => r.status === 'breached')) return 'breached';
  if (results.some((r) => r.status === 'warning')) return 'warning';
  if (results.length > 0 && results.every((r) => r.status === 'passed')) return 'passed';
  return 'ok';
}

/* ---------- FASES, ESTADO Y PAYOUTS ---------- */

export const ACCOUNT_PHASES = {
  eval1: 'Evaluación · Fase 1',
  eval2: 'Evaluación · Fase 2',
  eval3: 'Evaluación · Fase 3',
  funded: 'Fondeada (live)'
};

export const ACCOUNT_STATUSES = {
  active: 'Activa',
  passed: 'Superada',
  failed: 'Rota',
  closed: 'Cerrada'
};

export const isEvalPhase = (phase) => typeof phase === 'string' && phase.startsWith('eval');

/** Siguiente fase según el nº de evaluaciones configurado en la cuenta. */
export function nextPhase(account) {
  const steps = Math.min(3, Math.max(1, Number(account.evalPhases) || 1));
  const order = ['eval1', 'eval2', 'eval3'].slice(0, steps).concat('funded');
  const idx = order.indexOf(account.phase || 'eval1');
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

/**
 * Operaciones que cuentan para la fase actual. Al superar o reiniciar una fase
 * se guarda `phaseStartedAt`, de modo que las reglas se evalúan desde cero.
 */
export function entriesForCurrentPhase(account, entries) {
  if (!account?.phaseStartedAt) return entries;
  const start = new Date(account.phaseStartedAt).getTime();
  if (Number.isNaN(start)) return entries;
  return entries.filter((e) => new Date(e.date).getTime() >= start);
}

const DAY_MS = 86400000;

/**
 * Números de la cuenta al margen de las reglas: balance tras retiros, cuánto
 * se puede sacar en el próximo payout y rentabilidad real sobre el coste.
 */
export function computeAccountFinancials(account, entries) {
  const initial = Number(account.initialBalance) || 0;
  const series = buildEquitySeries(entries, initial);
  const equity = series.length > 0 ? series[series.length - 1].equity : initial;
  const netPnl = equity - initial;

  const payouts = (account.payouts || [])
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPaidOut = payouts.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const balance = equity - totalPaidOut;

  const split = Number(account.profitSplit) > 0 ? Number(account.profitSplit) : 100;
  const buffer = Number(account.payoutBuffer) || 0;
  const grossAvailable = Math.max(0, balance - initial - buffer);
  const available = (grossAvailable * split) / 100;

  const payoutMin = Number(account.payoutMin) || 0;
  const minDays = Number(account.payoutMinDays) || 0;
  const lastPayout = payouts[0] || null;
  const refDate = lastPayout?.date || account.phaseStartedAt || account.startDate || account.createdAt;
  const daysSince = refDate ? Math.floor((Date.now() - new Date(refDate).getTime()) / DAY_MS) : null;
  const daysLeft = minDays > 0 && daysSince !== null ? Math.max(0, minDays - daysSince) : 0;

  const cost = Number(account.cost) || 0;
  const roi = cost > 0 ? ((totalPaidOut - cost) / cost) * 100 : null;

  const eligible = available > 0 && available >= payoutMin && daysLeft === 0;

  return {
    initial,
    equity,
    netPnl,
    balance,
    payouts,
    lastPayout,
    totalPaidOut,
    grossAvailable,
    available,
    split,
    buffer,
    payoutMin,
    minDays,
    daysSince,
    daysLeft,
    cost,
    roi,
    eligible
  };
}

export { fmtMoney };


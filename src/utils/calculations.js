/**
 * Financial and trading calculations for enhanced calculator functionality
 */

/**
 * Calculate position size based on risk amount and stop loss
 * @param {number} riskAmount - Dollar amount willing to risk
 * @param {number} stopLossPoints - Stop loss in points
 * @param {number} pointValue - Dollar value per point
 * @returns {number} Number of contracts (can be fractional)
 */
export function calculatePositionSize(riskAmount, stopLossPoints, pointValue) {
  if (stopLossPoints <= 0 || pointValue <= 0) return 0;
  return riskAmount / (stopLossPoints * pointValue);
}

/**
 * Calculate required stop loss for a given risk amount and position size
 * @param {number} riskAmount - Dollar amount willing to risk
 * @param {number} contracts - Number of contracts
 * @param {number} pointValue - Dollar value per point
 * @returns {number} Stop loss in points
 */
export function calculateStopLoss(riskAmount, contracts, pointValue) {
  if (contracts <= 0 || pointValue <= 0) return 0;
  return riskAmount / (contracts * pointValue);
}

/**
 * Calculate required take profit for a target profit amount
 * @param {number} targetProfit - Desired profit in dollars
 * @param {number} contracts - Number of contracts
 * @param {number} pointValue - Dollar value per point
 * @returns {number} Take profit in points
 */
export function calculateTakeProfit(targetProfit, contracts, pointValue) {
  if (contracts <= 0 || pointValue <= 0) return 0;
  return targetProfit / (contracts * pointValue);
}

/**
 * Calculate Kelly Criterion optimal position size
 * @param {number} winRate - Probability of winning (0-1)
 * @param {number} avgWin - Average winning trade in dollars
 * @param {number} avgLoss - Average losing trade in dollars (positive number)
 * @returns {number} Kelly percentage (0-1)
 */
export function calculateKellyCriterion(winRate, avgWin, avgLoss) {
  if (avgLoss <= 0) return 0;

  const winProb = winRate;
  const lossProb = 1 - winRate;
  const winLossRatio = avgWin / avgLoss;

  // Kelly formula: f* = (bp - q) / b
  // where b = winLossRatio, p = winProb, q = lossProb
  const kelly = (winLossRatio * winProb - lossProb) / winLossRatio;

  // Return 0 if negative (don't bet), cap at reasonable maximum
  return Math.max(0, Math.min(kelly, 0.5)); // Cap at 50% for safety
}

/**
 * Calculate Martingale position sizing sequence
 * @param {number} baseAmount - Base position size
 * @param {number} multiplier - Multiplier for each loss (typically 2)
 * @param {number} maxSteps - Maximum number of steps in sequence
 * @returns {Array} Array of position sizes for each step
 */
export function calculateMartingaleSequence(baseAmount, multiplier = 2, maxSteps = 5) {
  const sequence = [];
  let current = baseAmount;

  for (let i = 0; i < maxSteps; i++) {
    sequence.push(current);
    current *= multiplier;
  }

  return sequence;
}

/**
 * Calculate Anti-Martingale position sizing sequence
 * @param {number} baseAmount - Base position size
 * @param {number} multiplier - Multiplier for each win (typically 2)
 * @param {number} maxSteps - Maximum number of steps in sequence
 * @returns {Array} Array of position sizes for each step
 */
export function calculateAntiMartingaleSequence(baseAmount, multiplier = 2, maxSteps = 5) {
  const sequence = [];
  let current = baseAmount;

  for (let i = 0; i < maxSteps; i++) {
    sequence.push(current);
    current *= multiplier;
  }

  return sequence;
}

/**
 * Monte Carlo simulation for equity curve projection
 * @param {Array} tradeResults - Array of historical trade P&L results
 * @param {number} numSimulations - Number of simulation runs
 * @param {number} numTrades - Number of trades to simulate per run
 * @param {number} initialCapital - Starting capital
 * @returns {Object} Simulation results with equity curves and statistics
 */
export function monteCarloSimulation(tradeResults, numSimulations = 1000, numTrades = 100, initialCapital = 0) {
  if (tradeResults.length === 0) {
    return { equityCurves: [], summary: {} };
  }

  const equityCurves = [];

  for (let sim = 0; sim < numSimulations; sim++) {
    const curve = [initialCapital];
    let capital = initialCapital;

    for (let trade = 0; trade < numTrades; trade++) {
      // Randomly select a trade result from historical data
      const randomIndex = Math.floor(Math.random() * tradeResults.length);
      const tradeResult = tradeResults[randomIndex];
      capital += tradeResult;
      curve.push(capital);
    }

    equityCurves.push(curve);
  }

  // Calculate summary statistics
  const finalValues = equityCurves.map(curve => curve[curve.length - 1]);
  const sortedFinalValues = [...finalValues].sort((a, b) => a - b);

  const summary = {
    mean: finalValues.reduce((sum, val) => sum + val, 0) / finalValues.length,
    median: sortedFinalValues[Math.floor(sortedFinalValues.length / 2)],
    percentile5: sortedFinalValues[Math.floor(sortedFinalValues.length * 0.05)],
    percentile95: sortedFinalValues[Math.floor(sortedFinalValues.length * 0.95)],
    maxDrawdown: calculateMaxDrawdownFromCurves(equityCurves),
    probabilityOfProfit: finalValues.filter(val => val > initialCapital).length / finalValues.length
  };

  return { equityCurves, summary };
}

/**
 * Calculate maximum drawdown from equity curves
 * @param {Array<Array<number>>} equityCurves - Array of equity curves
 * @returns {number} Average maximum drawdown
 */
function calculateMaxDrawdownFromCurves(equityCurves) {
  let totalDrawdown = 0;

  equityCurves.forEach(curve => {
    let peak = curve[0];
    let maxDrawdown = 0;

    for (let i = 1; i < curve.length; i++) {
      if (curve[i] > peak) {
        peak = curve[i];
      }
      const drawdown = (peak - curve[i]) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    totalDrawdown += maxDrawdown;
  });

  return totalDrawdown / equityCurves.length;
}

/**
 * Calculate risk of ruin
 * @param {number} winRate - Probability of winning (0-1)
 * @param {number} avgWin - Average winning trade
 * @param {number} avgLoss - Average losing trade (positive number)
 * @param {number} riskPerTrade - Fraction of capital risked per trade (0-1)
 * @returns {number} Probability of ruin (0-1)
 */
export function calculateRiskOfRuin(winRate, avgWin, avgLoss, riskPerTrade) {
  if (winRate <= 0 || winRate >= 1 || avgLoss <= 0 || riskPerTrade <= 0) return 1;

  const winProb = winRate;
  const lossProb = 1 - winRate;

  // Simplified risk of ruin formula for fixed fractional betting
  const edge = (winProb * avgWin) - (lossProb * avgLoss);
  if (edge <= 0) return 1; // Negative edge means certain ruin eventually

  const riskOfRuin = Math.pow((lossProb / winProb), (edge / (avgLoss * riskPerTrade)));
  return Math.min(1, Math.max(0, riskOfRuin));
}

/**
 * Calculate expectancy (expected value per trade)
 * @param {number} winRate - Probability of winning (0-1)
 * @param {number} avgWin - Average winning trade
 * @param {number} avgLoss - Average losing trade (positive number)
 * @returns {number} Expectancy in dollars
 */
export function calculateExpectancy(winRate, avgWin, avgLoss) {
  const winProb = winRate;
  const lossProb = 1 - winRate;
  return (winProb * avgWin) - (lossProb * avgLoss);
}

/**
 * Calculate profit factor
 * @param {number} grossProfit - Total profit from winning trades
 * @param {number} grossLoss - Total loss from losing trades (positive number)
 * @returns {number} Profit factor
 */
export function calculateProfitFactor(grossProfit, grossLoss) {
  if (grossLoss <= 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

/**
 * Calculate win/loss ratio
 * @param {number} avgWin - Average winning trade
 * @param {number} avgLoss - Average losing trade (positive number)
 * @returns {number} Win/loss ratio
 */
export function calculateWinLossRatio(avgWin, avgLoss) {
  if (avgLoss <= 0) return avgWin > 0 ? Infinity : 0;
  return avgWin / avgLoss;
}
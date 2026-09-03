import { useState } from 'react';
import { SPECS, toPoints } from '../../constants.js';
import { calculateExpectancy, calculateProfitFactor, calculateWinLossRatio, calculateRiskOfRuin } from '../../utils/calculations.js';

export default function ScenarioAnalyzer({ contract }) {
  const spec = SPECS[contract];

  const [winRate, setWinRate] = useState(50); // percentage
  const [avgWin, setAvgWin] = useState(100); // dollars
  const [avgLoss, setAvgLoss] = useState(100); // dollars (positive)
  const [riskPerTrade, setRiskPerTrade] = useState(2); // percentage of capital

  const calculations = {
    expectancy: calculateExpectancy(winRate / 100, avgWin, avgLoss),
    profitFactor: calculateProfitFactor(avgWin * (winRate / 100), avgLoss * ((100 - winRate) / 100)),
    winLossRatio: calculateWinLossRatio(avgWin, avgLoss),
    riskOfRuin: calculateRiskOfRuin(winRate / 100, avgWin, avgLoss, riskPerTrade / 100)
  };

  return (
    <div className="ticket">
      <div className="ticket-header">
        <h3>Análisis de Escenarios</h3>
        <p className="ticket-subtitle">Evalúa la viabilidad estadística de tu estrategia</p>
      </div>

      <div className="body-inner">
        <div className="scenario-controls">
          <div className="field-group">
            <label>Tasa de Ganancia (%)</label>
            <input
              type="number"
              value={winRate}
              min="0"
              max="100"
              step="1"
              onChange={(e) => setWinRate(parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Ganancia Promedio ($)</label>
            <input
              type="number"
              value={avgWin}
              min="0"
              step="0.01"
              onChange={(e) => setAvgWin(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Pérdida Promedio ($)</label>
            <input
              type="number"
              value={avgLoss}
              min="0"
              step="0.01"
              onChange={(e) => setAvgLoss(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Riesgo por Operación (%)</label>
            <input
              type="number"
              value={riskPerTrade}
              min="0.1"
              max="100"
              step="0.1"
              onChange={(e) => setRiskPerTrade(parseFloat(e.target.value) || 0.1)}
            />
          </div>
        </div>

        <div className="scenario-results">
          <div className="result-card">
            <h4>Expectativa Matemática</h4>
            <div className="result-value">{calculations.expectancy >= 0 ? '+' : ''}${Math.abs(calculations.expectancy).toFixed(2)}</div>
            <div className="result-label">Beneficio esperado por operación</div>
          </div>

          <div className="result-card">
            <h4>Factor de Ganancia</h4>
            <div className="result-value">{calculations.profitFactor.toFixed(2)}</div>
            <div className="result-label">Ganancia bruta / Pérdida bruta</div>
          </div>

          <div className="result-card">
            <h4>Ratio Ganancia/Pérdida</h4>
            <div className="result-value">{calculations.winLossRatio.toFixed(2)}</div>
            <div className="result-label">Tamaño medio ganador / perdedor</div>
          </div>

          <div className="result-card">
            <h4>Riesgo de Ruina</h4>
            <div className="result-value">{calculations.riskOfRuin * 100}%</div>
            <div className="result-label">Probabilidad de perder todo el capital</div>
          </div>
        </div>

        <div className="scenario-insights">
          <h4>Insights</h4>
          <ul className="insights-list">
            {calculations.expectancy > 0 && (
              <li>✅ Tu estrategia tiene una expectativa positiva</li>
            )}
            {calculations.expectancy <= 0 && (
              <li>⚠️ Tu estrategia tiene expectativa cero o negativa</li>
            )}
            {calculations.profitFactor > 1.5 && (
              <li>✅ Excelente factor de ganancia (<span>1.5</span>)</li>
            )}
            {calculations.profitFactor > 1 && calculations.profitFactor <= 1.5 && (
              <li>⚠️ Factor de ganancia aceptable (1-1.5)</li>
            )}
            {calculations.profitFactor <= 1 && (
              <li>❌ Factor de ganancia insuficiente (<span>1</span>)</li>
            )}
            {calculations.riskOfRuin < 0.01 && (
              <li>✅ Bajo riesgo de ruina (menos de 1%)</li>
            )}
            {calculations.riskOfRuin >= 0.01 && calculations.riskOfRuin < 0.1 && (
              <li>⚠️ Riesgo de ruina moderado (1-10%)</li>
            )}
            {calculations.riskOfRuin >= 0.1 && (
              <li>❌ Alto riesgo de ruina (más de 10%)</li>
            )}
          </ul>
        </div>
      </div>

      <footer>
        <small>Calculado con: {winRate}% WR, ${avgWin} AW, ${avgLoss} AL, {riskPerTrade}% riesgo</small>
      </footer>
    </div>
  );
}
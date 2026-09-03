import { useState } from 'react';
import { SPECS, toPoints } from '../../constants.js';
import { calculateExpectancy, calculateProfitFactor } from '../../utils/calculations.js';

export default function RiskRewardOptimizer({ contract }) {
  const spec = SPECS[contract];

  const [winRate, setWinRate] = useState(50); // percentage
  const [avgWin, setAvgWin] = useState(100); // dollars
  const [avgLoss, setAvgLoss] = useState(100); // dollars (positive)
  const [capital, setCapital] = useState(10000); // dollars

  const calculations = {
    expectancy: calculateExpectancy(winRate / 100, avgWin, avgLoss),
    profitFactor: calculateProfitFactor(avgWin * (winRate / 100), avgLoss * ((100 - winRate) / 100)),
  };

  // Find optimal risk/reward ratio based on win rate
  const optimalRR = winRate > 0 ? (100 - winRate) / winRate : 0;

  return (
    <div className="ticket">
      <div className="ticket-header">
        <h3>Optimizador de Riesgo:Beneficio</h3>
        <p className="ticket-subtitle">Encuentra la mejor combinación SL/TP para tu tasa de ganancia</p>
      </div>

      <div className="body-inner">
        <div className="optimizer-controls">
          <div className="field-group">
            <label>Tasa de Ganancia Esperada (%)</label>
            <input
              type="number"
              value={winRate}
              min="1"
              max="99"
              step="1"
              onChange={(e) => setWinRate(parseInt(e.target.value) || 50)}
            />
            <small className="help-text">Para ser rentable, necesitas RR {((100 - winRate) / winRate).toFixed(2)}</small>
          </div>

          <div className="field-group">
            <label>Capital Disponible ($)</label>
            <input
              type="number"
              value={capital}
              min="0"
              step="100"
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Ganancia Promedio por Operación ($)</label>
            <input
              type="number"
              value={avgWin}
              min="0"
              step="0.01"
              onChange={(e) => setAvgWin(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Pérdida Promedio por Operación ($)</label>
            <input
              type="number"
              value={avgLoss}
              min="0"
              step="0.01"
              onChange={(e) => setAvgLoss(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="optimizer-recommendations">
          <h4>Recomendaciones Óptimas</h4>

          <div className="rec-card">
            <h5>Ratio Riesgo:Beneficio Óptimo</h5>
            <div className="rec-value">1 : {optimalRR.toFixed(2)}</div>
            <div className="rec-label">Para tasa de ganancia del {winRate}%</div>
          </div>

          <div className="rec-card">
            <h5>Stop Loss Sugerido</h5>
            <div className="rec-value">{Math.sqrt(capital * 0.02 / spec.pointValue).toFixed(2)} pts</div>
            <div className="rec-label">Basado en 2% de riesgo por operación</div>
          </div>

          <div className="rec-card">
            <h5>Take Profit Sugerido</h5>
            <div className="rec-value">{Math.sqrt(capital * 0.02 / spec.pointValue * optimalRR).toFixed(2)} pts</div>
            <div className="rec-label">Para lograr RR óptimo</div>
          </div>

          <div className="rec-card">
            <h5>Expectativa Matemática</h5>
            <div className="rec-value">
              {calculations.expectancy >= 0 ? '+' : ''}${Math.abs(calculations.expectancy).toFixed(2)}
            </div>
            <div className="rec-label">
              {calculations.expectancy > 0 ? 'Positiva' : 'Negativa o cero'}
            </div>
          </div>
        </div>

        <div className="optimizer-grid">
          <div className="grid-group">
            <h5>Métricas Actuales</h5>
            <div className="metric-item">
              <span>Factor de Ganancia:</span>
              <strong>{calculations.profitFactor.toFixed(2)}</strong>
            </div>
            <div className="metric-item">
              <span>Ratio G/P:</span>
              <strong>{(avgWin / avgLoss).toFixed(2)}</strong>
            </div>
            <div className="metric-item">
              <span>Edge por operación:</span>
              <strong>${calculations.expectancy.toFixed(2)}</strong>
            </div>
          </div>

          <div className="grid-group">
            <h5>Análisis de Sensibilidad</h5>
            <div className="metric-item">
              <span>Si RR mejora 20%:</span>
              <strong>${(calculations.expectancy * 1.2).toFixed(2)}</strong> edge
            </div>
            <div className="metric-item">
              <span>Si WR mejora 10%:</span>
              <strong>{((winRate + 10) / 100 * avgWin - (100 - winRate - 10) / 100 * avgLoss).toFixed(2)}</strong> edge
            </div>
          </div>
        </div>
      </div>

      <footer>
        <small>
          Asumiendo distribución normal de resultados. Estos son puntos de partida para experimentación.
        </small>
      </footer>
    </div>
  );
}
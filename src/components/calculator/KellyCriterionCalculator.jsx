import { useState } from 'react';
import { SPECS, toPoints } from '../../constants.js';
import { calculateKellyCriterion, calculateExpectancy } from '../../utils/calculations.js';

export default function KellyCriterionCalculator({ contract }) {
  const spec = SPECS[contract];

  const [winRate, setWinRate] = useState(60); // percentage
  const [avgWin, setAvgWin] = useState(150); // dollars
  const [avgLoss, setAvgLoss] = useState(100); // dollars (positive)
  const [capital, setCapital] = useState(10000); // dollars
  const [fraction, setFraction] = useState(0.5); // Kelly fraction to use (0-1)

  const kellyFraction = calculateKellyCriterion(winRate / 100, avgWin, avgLoss);
  const recommendedRisk = kellyFraction * fraction;
  const expectedValue = calculateExpectancy(winRate / 100, avgWin, avgLoss);
  const stakeSize = capital * recommendedRisk;
  // Handle division by zero when avgLoss is 0
  const contracts = avgLoss > 0 ? stakeSize / avgLoss : 0;
  const adjustedContracts = contracts > 0 ? contracts : 0;

  return (
    <div className="ticket">
      <div className="ticket-header">
        <h3>Calculadora de Criterio de Kelly</h3>
        <p className="ticket-subtitle">Optimiza el tamaño de posición basado en ventaja estadística</p>
      </div>

      <div className="body-inner">
        <div className="kelly-controls">
          <div className="field-group">
            <label>Tasa de Ganancia (%)</label>
            <input
              type="number"
              value={winRate}
              min="1"
              max="99"
              step="1"
              onChange={(e) => setWinRate(parseInt(e.target.value) || 60)}
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
            <label>Capital ($)</label>
            <input
              type="number"
              value={capital}
              min="0"
              step="100"
              onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="field-group">
            <label>Fracción de Kelly (0-1)</label>
            <input
              type="number"
              value={fraction}
              min="0"
              max="1"
              step="0.05"
              onChange={(e) => setFraction(parseFloat(e.target.value) || 0.5)}
            />
            <small className="help-text">
              1.0 = Kelly completo, 0.5 = Medio Kelly (recomendado para menor volatilidad)
            </small>
          </div>
        </div>

        <div className="kelly-results">
          <div className="result-card">
            <h4>Fracción Óptima de Kelly</h4>
            <div className="result-value">{kellyFraction.toFixed(3)}</div>
            <div className="result-label">
              {kellyFraction > 0 ? 'Kelly positivo' : 'Kelly negativo o cero (no operar)'}
            </div>
          </div>

          <div className="result-card">
            <h4>Fracción de Kelly Ajustada</h4>
            <div className="result-value">{recommendedRisk.toFixed(3)}</div>
            <div className="result-label">({fraction} × Kelly)</div>
          </div>

          <div className="result-card">
            <h4>Tamaño de Posición Sugerido</h4>
            <div className="result-value">${stakeSize.toFixed(2)}</div>
            <div className="result-label">Monto en dólares a arriesgar</div>
          </div>

          <div className="result-card">
            <h4>Contratos Sugeridos</h4>
            <div className="result-value">{adjustedContracts.toFixed(2)}</div>
            <div className="result-label">
              Basado en riesgo por contrato de ${avgLoss > 0 ? avgLoss.toFixed(2) : '0.00'}
            </div>
          </div>

          <div className="result-card">
            <h4>Expectativa Matemática</h4>
            <div className="result-value">
              {expectedValue >= 0 ? '+' : ''}${Math.abs(expectedValue).toFixed(2)}
            </div>
            <div className="result-label">Beneficio esperado por operación</div>
          </div>
        </div>

        <div className="kelly-insights">
          <h4>Insights y Recomendaciones</h4>
          <ul className="insights-list">
            {kellyFraction <= 0 && (
              <li>❌ Kelly negativo o cero: tu estrategia no tiene ventaja suficiente</li>
            )}
            {kellyFraction > 0 && kellyFraction < 0.1 && (
              <li>⚠️ Kelly muy bajo (<span>0.1</span>): ventaja mínima, considerar mejorar estrategia</li>
            )}
            {kellyFraction >= 0.1 && kellyFraction < 0.3 && (
              <li>✅ Kelly bajo-moderado (0.1-0.3): buena ventaja, usar fracción conservadora</li>
            )}
            {kellyFraction >= 0.3 && kellyFraction < 0.5 && (
              <li>✅ Kelly moderado (0.3-0.5): sólida ventaja, Kelly medio recomendado</li>
            )}
            {kellyFraction >= 0.5 && (
              <li>⚠️ Kelly alto (<span>0.5</span>): ventaja significativa, considerar reducción para manejar drawdown</li>
            )}
            {fraction < 0.5 && (
              <li>💡 Usando fracción conservadora de Kelly: menor volatilidad, menor riesgo de ruina</li>
            )}
            {fraction >= 0.5 && fraction < 0.8 && (
              <li>💡 Usando fracción moderada de Kelly: balance entre crecimiento y seguridad</li>
            )}
            {fraction >= 0.8 && (
              <li>⚠️ Usando fracción agresiva de Kelly: mayor crecimiento pero mayor riesgo de drawdown</li>
            )}
          </ul>
        </div>
      </div>

      <footer>
        <small>
          Kelly = (bp - q) / b donde b = razón de ganancia/pérdida, p = probabilidad de ganar, q = probabilidad de perder |
          Capital: ${capital.toFixed(2)} | Kelly puro: {kellyFraction.toFixed(3)} | Kelly ajustado: {recommendedRisk.toFixed(3)}
        </small>
      </footer>
    </div>
  );
}
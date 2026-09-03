import { useState } from 'react';
import { SPECS, toPoints } from '../../constants.js';
import { calculatePositionSize, calculateTakeProfit } from '../../utils/calculations.js';

export default function ProfitTargetCalculator({ contract }) {
  const spec = SPECS[contract];

  const [targetProfit, setTargetProfit] = useState(500); // dollars
  const [stopLoss, setStopLoss] = useState(20); // points
  const [contractsInput, setContractsInput] = useState(''); // empty for auto-calculate

  const slPoints = toPoints(parseFloat(stopLoss) || 0, 'points', contract);
  const contracts = contractsInput !== '' ? Math.max(1, parseFloat(contractsInput)) : 0;

  // Auto-calculate contracts if input is empty
  const calcContracts = contractsInput === ''
    ? calculatePositionSize(targetProfit, slPoints, spec.pointValue)
    : contracts;

  const actualRisk = calcContracts * slPoints * spec.pointValue;
  const requiredTP = calculateTakeProfit(targetProfit, calcContracts, spec.pointValue);
  const tpPoints = toPoints(requiredTP || 0, 'points', contract);

  return (
    <div className="ticket">
      <div className="ticket-header">
        <h3>Calculadora de Objetivo de Beneficio</h3>
        <p className="ticket-subtitle">Determina el tamaño de posición y TP necesario para alcanzar tu objetivo</p>
      </div>

      <div className="body-inner">
        <div className="input-group">
          <label>Objetivo de Beneficio ($)</label>
          <input
            type="number"
            value={targetProfit}
            min="0"
            step="0.01"
            onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="input-group">
          <label>Stop Loss (puntos)</label>
          <input
            type="number"
            value={stopLoss}
            min="0"
            step="0.25"
            onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="input-group">
          <label>Número de Contratos (dejar vacío para calcular automáticamente)</label>
          <input
            type="number"
            value={contractsInput === '' ? '' : contractsInput}
            min="0.01"
            step="0.01"
            onChange={(e) => setContractsInput(e.target.value)}
            placeholder="Auto-calculado basado en riesgo"
          />
        </div>

        {!contractsInput && (
          <div className="calculated-contracts">
            <strong>Contratos calculados:</strong> {calcContracts.toFixed(2)}
          </div>
        )}

        <div className="results-summary">
          <div className="result-item">
            <span>Riesgo en juego:</span>
            <strong>${actualRisk.toFixed(2)}</strong>
          </div>
          <div className="result-item">
            <span>TP requerido (puntos):</span>
            <strong>{tpPoints.toFixed(2)}</strong>
          </div>
          <div className="result-item">
            <span>TP requerido ($):</span>
            <strong>${(tpPoints * spec.pointValue * calcContracts).toFixed(2)}</strong>
          </div>
          <div className="result-item">
            <span>Ratio Riesgo:Beneficio:</span>
            <strong>1 : {(tpPoints / slPoints).toFixed(2)}</strong>
          </div>
        </div>

        <div className="visual-rail">
          <div className="rail-label">
            Riesgo: ${actualRisk.toFixed(2)} &nbsp;|&nbsp; Beneficio: ${(tpPoints * spec.pointValue * calcContracts).toFixed(2)}
          </div>
          <div className="rail">
            <div
              className="rail-seg risk-seg"
              style={{
                flexBasis: targetProfit > 0 ? `${(actualRisk / targetProfit) * 100}%` : '0%'
              }}
            />
            <div
              className="rail-seg reward-seg"
              style={{
                flexBasis: targetProfit > 0 ? `${(tpPoints * spec.pointValue * calcContracts / targetProfit) * 100}%` : '0%'
              }}
            />
          </div>
        </div>
      </div>

      <footer>
        <small>
          Basado en {contract} - Valor/punto: ${spec.pointValue} |
          Riesgo: {slPoints} pts (${slPoints * spec.pointValue}$/contrato) |
          TP: {tpPoints.toFixed(2)} pts (${(tpPoints * spec.pointValue).toFixed(2)}$/contrato)
        </small>
      </footer>
    </div>
  );
}
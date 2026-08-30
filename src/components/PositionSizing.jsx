import { useState } from 'react';
import { SPECS, toPoints } from '../constants.js';

export default function PositionSizing({ contract }) {
  const [maxRiskInput, setMaxRiskInput] = useState(100);
  const [posUnit, setPosUnit] = useState('points');
  const [posSl, setPosSl] = useState(20);

  const spec = SPECS[contract];
  const maxRisk = parseFloat(maxRiskInput) || 0;
  const posSlPoints = toPoints(parseFloat(posSl) || 0, posUnit, contract);

  const posSlLabel = posUnit === 'ticks' ? 'Stop Loss (ticks)' : 'Stop Loss (puntos)';
  const posSlStep = posUnit === 'ticks' ? 1 : 0.25;

  let contractsEl, subText, warning = null;

  if (posSlPoints <= 0 || maxRisk <= 0) {
    contractsEl = '0';
    subText = 'Introduce tus datos arriba';
  } else {
    const riskPerContract = posSlPoints * spec.pointValue;
    const exactContracts = maxRisk / riskPerContract;
    const recommended = Math.floor(exactContracts);

    if (recommended < 1) {
      contractsEl = '0';
      subText = `Riesgo por contrato: $${riskPerContract.toFixed(2)} — no te alcanza para 1`;
      warning = `Con este Stop Loss, hasta 1 solo contrato de ${contract} arriesga $${riskPerContract.toFixed(2)}, más de tu límite de $${maxRisk.toFixed(2)}. Reduce el Stop Loss o aumenta el riesgo máximo permitido.`;
    } else {
      const actualRisk = recommended * riskPerContract;
      contractsEl = String(recommended);
      subText = `Riesgo real: $${actualRisk.toFixed(2)} de $${maxRisk.toFixed(2)} máx · exacto: ${exactContracts.toFixed(2)} cttos`;
    }
  }

  return (
    <div className="ticket" style={{ marginTop: '20px' }}>
      <div className="body-inner">
        <h2 className="section-title">Tamaño de posición</h2>
        <p className="helper-text">
          Dime cuánto quieres arriesgar en dólares y tu Stop Loss, y te digo
          cuántos contratos de <b style={{ color: 'var(--text)' }}>{contract}</b> puedes usar.
        </p>

        <div className="field">
          <label>Riesgo máximo (en $)</label>
          <input
            type="number"
            value={maxRiskInput}
            min="0"
            step="1"
            onChange={(e) => setMaxRiskInput(e.target.value)}
          />
        </div>

        <div className="unit-toggle">
          <button
            className={posUnit === 'points' ? 'active' : ''}
            onClick={() => setPosUnit('points')}
          >
            PUNTOS
          </button>
          <button
            className={posUnit === 'ticks' ? 'active' : ''}
            onClick={() => setPosUnit('ticks')}
          >
            TICKS
          </button>
        </div>

        <div className="field">
          <label>{posSlLabel}</label>
          <input
            type="number"
            value={posSl}
            min="0"
            step={posSlStep}
            onChange={(e) => setPosSl(e.target.value)}
          />
        </div>

        <div className="outcome-grid">
          <div className="outcome-card neutral full">
            <div className="k"><span className="dot neutral" />Contratos recomendados</div>
            <div className="v">{contractsEl}</div>
            <div className="sub">{subText}</div>
          </div>
        </div>

        {warning && <div className="warning-box">{warning}</div>}
      </div>
    </div>
  );
}

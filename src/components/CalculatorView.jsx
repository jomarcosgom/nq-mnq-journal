import { useState } from 'react';
import { SPECS, toPoints } from '../constants.js';
import PositionSizing from './PositionSizing.jsx';
import ScenarioAnalyzer from './calculator/ScenarioAnalyzer.jsx';
import ProfitTargetCalculator from './calculator/ProfitTargetCalculator.jsx';
import RiskRewardOptimizer from './calculator/RiskRewardOptimizer.jsx';
import KellyCriterionCalculator from './calculator/KellyCriterionCalculator.jsx';

export default function CalculatorView() {
  const [contract, setContract] = useState('MNQ');
  const [unit, setUnit] = useState('points');
  const [sl, setSl] = useState(20);
  const [tp, setTp] = useState(40);
  const [contracts, setContracts] = useState(1);
  const [calculatorTab, setCalculatorTab] = useState('basic'); // basic, scenario, profitTarget, riskReward, kelly

  const spec = SPECS[contract];
  const contractsNum = Math.max(1, parseInt(contracts, 10) || 1);
  const slPoints = toPoints(parseFloat(sl) || 0, unit, contract);
  const tpPoints = toPoints(parseFloat(tp) || 0, unit, contract);

  const riskDollars = slPoints * spec.pointValue * contractsNum;
  const rewardDollars = tpPoints * spec.pointValue * contractsNum;
  const totalTicks = slPoints / spec.tickSize + tpPoints / spec.tickSize;
  const rrText = slPoints > 0 ? `R:R 1 : ${(tpPoints / slPoints).toFixed(2)}` : 'R:R —';

  const total = riskDollars + rewardDollars;
  const riskPct = total > 0 ? (riskDollars / total) * 100 : 50;
  const rewardPct = total > 0 ? (rewardDollars / total) * 100 : 50;

  const unitStep = unit === 'ticks' ? 1 : 0.25;
  const slLabel = unit === 'ticks' ? 'Stop Loss (ticks)' : 'Stop Loss (puntos)';
  const tpLabel = unit === 'ticks' ? 'Take Profit (ticks)' : 'Take Profit (puntos)';

  return (
    <>
      <div className="ticket">
        <div className="tabs">
          <button
            className={`tab ${contract === 'MNQ' ? 'active' : ''}`}
            data-contract="MNQ"
            onClick={() => setContract('MNQ')}
          >
            <span className="code">MNQ</span>
            <span className="desc">Micro E-mini</span>
          </button>
          <button
            className={`tab ${contract === 'NQ' ? 'active' : ''}`}
            data-contract="NQ"
            onClick={() => setContract('NQ')}
          >
            <span className="code">NQ</span>
            <span className="desc">E-mini</span>
          </button>
        </div>

        <div className="calculator-tabs">
          <button
            className={calculatorTab === 'basic' ? 'calc-tab active' : 'calc-tab'}
            onClick={() => setCalculatorTab('basic')}
          >
            Básico
          </button>
          <button
            className={calculatorTab === 'scenario' ? 'calc-tab active' : 'calc-tab'}
            onClick={() => setCalculatorTab('scenario')}
          >
            Escenarios
          </button>
          <button
            className={calculatorTab === 'profitTarget' ? 'calc-tab active' : 'calc-tab'}
            onClick={() => setCalculatorTab('profitTarget')}
          >
            Objetivo de Beneficio
          </button>
          <button
            className={calculatorTab === 'riskReward' ? 'calc-tab active' : 'calc-tab'}
            onClick={() => setCalculatorTab('riskReward')}
          >
            Optimizador R:R
          </button>
          <button
            className={calculatorTab === 'kelly' ? 'calc-tab active' : 'calc-tab'}
            onClick={() => setCalculatorTab('kelly')}
          >
            Kelly Criterion
          </button>
        </div>

        <div className="body-inner">
          {calculatorTab === 'basic' && (
            <>
              <div className="spec-row">
                <span>Valor / punto: <b>${spec.pointValue.toFixed(2)}</b></span>
                <span>Valor / tick (0.25): <b>${(spec.pointValue * spec.tickSize).toFixed(2)}</b></span>
              </div>

              <div className="unit-toggle">
                <button
                  className={unit === 'points' ? 'active' : ''}
                  onClick={() => setUnit('points')}
                >
                  PUNTOS
                </button>
                <button
                  className={unit === 'ticks' ? 'active' : ''}
                  onClick={() => setUnit('ticks')}
                >
                  TICKS
                </button>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>{slLabel}</label>
                  <input
                    type="number"
                    value={sl}
                    min="0"
                    step={unitStep}
                    onChange={(e) => setSl(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>{tpLabel}</label>
                  <input
                    type="number"
                    value={tp}
                    min="0"
                    step={unitStep}
                    onChange={(e) => setTp(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label>Número de contratos</label>
                <input
                  type="number"
                  value={contracts}
                  min="1"
                  step="1"
                  onChange={(e) => setContracts(e.target.value)}
                />
              </div>

              <div className="rail-wrap">
                <div className="rail-label-row">
                  <span className="lbl">Riesgo / Beneficio</span>
                  <span className="rr">{rrText}</span>
                </div>
                <div className="rail">
                  <div className="rail-seg risk-seg" style={{ flexBasis: `${riskPct}%` }} />
                  <div className="rail-seg reward-seg" style={{ flexBasis: `${rewardPct}%` }} />
                </div>
              </div>

              <div className="outcome-grid">
                <div className="outcome-card risk">
                  <div className="k"><span className="dot risk" />Riesgo (SL)</div>
                  <div className="v">${riskDollars.toFixed(2)}</div>
                  <div className="sub">
                    {slPoints.toFixed(2)} pts · {(slPoints / spec.tickSize).toFixed(0)} ticks
                  </div>
                </div>
                <div className="outcome-card reward">
                  <div className="k"><span className="dot reward" />Beneficio (TP)</div>
                  <div className="v">${rewardDollars.toFixed(2)}</div>
                  <div className="sub">
                    {tpPoints.toFixed(2)} pts · {(tpPoints / spec.tickSize).toFixed(0)} ticks
                  </div>
                </div>
              </div>

              <div className="total-row">
                <span>Ticks totales en juego: {totalTicks.toFixed(0)}</span>
                <span>{contractsNum} {contractsNum === 1 ? 'contrato' : 'contratos'}</span>
              </div>
            </>
          )}

          {calculatorTab === 'scenario' && (
            <ScenarioAnalyzer contract={contract} />
          )}

          {calculatorTab === 'profitTarget' && (
            <ProfitTargetCalculator contract={contract} />
          )}

          {calculatorTab === 'riskReward' && (
            <RiskRewardOptimizer contract={contract} />
          )}

          {calculatorTab === 'kelly' && (
            <KellyCriterionCalculator contract={contract} />
          )}
        </div>
      </div>

      <PositionSizing contract={contract} />

      <footer>
        NQ: $20/punto · $5/tick (0.25 pts) &nbsp;·&nbsp; MNQ: $2/punto · $0.50/tick (0.25 pts)<br />
        Cálculo informativo. No incluye comisiones ni slippage.
      </footer>
    </>
  );
}
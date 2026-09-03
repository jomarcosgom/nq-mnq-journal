import { useState } from 'react';
import {
  evaluateAccount,
  computeAccountFinancials,
  entriesForCurrentPhase,
  nextPhase,
  isEvalPhase,
  ACCOUNT_PHASES,
  ACCOUNT_STATUSES,
  RULE_METRICS,
  RULE_BASES,
  UNIT_LABELS,
  fmtMoney
} from '../../utils/accountRules.js';
import { showToast } from '../../utils/toast.js';
import { showConfirm } from '../../utils/confirmDialog.js';

const STATUS_LABEL = {
  ok: 'En regla',
  warning: 'Atención',
  breached: 'Incumplida',
  passed: 'Cumplido'
};

function formatValue(value, unit) {
  if (unit === 'amount') return fmtMoney(value);
  if (unit === 'percent') return `${Number(value).toFixed(1)}%`;
  return `${Math.round(value)} ${UNIT_LABELS[unit] || ''}`.trim();
}

function remainingLabel(result) {
  const { rule, direction, remaining } = result;
  if (direction === 'goal') {
    return remaining <= 0 ? 'Objetivo alcanzado' : `Faltan ${formatValue(remaining, rule.unit)}`;
  }
  if (result.status === 'breached') return 'Límite superado';
  return `Margen: ${formatValue(Math.max(0, remaining), rule.unit)}`;
}

const todayInputValue = () => new Date().toISOString().slice(0, 10);

function PayoutForm({ suggested, onCancel, onSubmit }) {
  const [amount, setAmount] = useState(suggested > 0 ? Math.round(suggested * 100) / 100 : '');
  const [date, setDate] = useState(todayInputValue());
  const [note, setNote] = useState('');

  function submit(e) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!(value > 0)) {
      showToast('Introduce un importe mayor que 0.', { type: 'error' });
      return;
    }
    onSubmit({ amount: value, date: new Date(date).toISOString(), note: note.trim() });
  }

  return (
    <form className="payout-form" onSubmit={submit}>
      <label className="rule-field">
        <span>Importe ($)</span>
        <input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <label className="rule-field">
        <span>Fecha</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="rule-field">
        <span>Nota</span>
        <input type="text" value={note} placeholder="Opcional" onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="payout-form-actions">
        <button type="button" className="account-cancel-btn" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="account-save-btn">Registrar payout</button>
      </div>
    </form>
  );
}

/**
 * Estado de la cuenta activa: fase, reglas, margen restante y payouts.
 */
export default function AccountRulesPanel({ account, entries, onUpdate }) {
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!account) return null;

  const phaseEntries = entriesForCurrentPhase(account, entries);
  const { results } = evaluateAccount(account, phaseEntries);
  const fin = computeAccountFinancials(account, phaseEntries);
  const phase = account.phase || 'funded';
  const status = account.status || 'active';
  const isFunded = account.type === 'funded';
  const inEval = isFunded && isEvalPhase(phase);

  async function patch(changes, successMessage) {
    if (!onUpdate) return;
    setBusy(true);
    try {
      await onUpdate(account.firestoreId, { ...account, ...changes });
      if (successMessage) showToast(successMessage, { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('No se pudo actualizar la cuenta.', { type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function logEvent(type, note) {
    return [...(account.history || []), { id: `h${Date.now()}`, date: new Date().toISOString(), type, note }];
  }

  async function handlePassPhase() {
    const next = nextPhase(account);
    const confirmed = await showConfirm({
      title: next ? 'Marcar fase superada' : 'Marcar cuenta superada',
      message: next
        ? `Pasarás a «${ACCOUNT_PHASES[next]}». El contador de reglas se reinicia y solo se evaluarán las operaciones a partir de hoy.`
        : 'La cuenta se marcará como superada.',
      confirmLabel: 'Confirmar'
    });
    if (!confirmed) return;

    await patch(
      next
        ? {
            phase: next,
            status: 'active',
            phaseStartedAt: new Date().toISOString(),
            history: logEvent('passed', `Fase superada → ${ACCOUNT_PHASES[next]}`)
          }
        : { status: 'passed', history: logEvent('passed', 'Cuenta superada') },
      next ? `Ahora en ${ACCOUNT_PHASES[next]}.` : 'Cuenta marcada como superada.'
    );
  }

  async function handleFail() {
    const confirmed = await showConfirm({
      title: 'Marcar cuenta como rota',
      message: 'Se marcará como rota. Podrás reiniciar la fase más adelante si compras un reset.',
      confirmLabel: 'Marcar rota',
      danger: true
    });
    if (!confirmed) return;
    await patch({ status: 'failed', history: logEvent('failed', 'Cuenta rota') }, 'Cuenta marcada como rota.');
  }

  async function handleReset() {
    const confirmed = await showConfirm({
      title: 'Reiniciar la fase',
      message: 'Las reglas volverán a contar desde hoy, ignorando las operaciones anteriores.',
      confirmLabel: 'Reiniciar'
    });
    if (!confirmed) return;
    await patch(
      { status: 'active', phaseStartedAt: new Date().toISOString(), history: logEvent('reset', 'Fase reiniciada') },
      'Fase reiniciada.'
    );
  }

  async function handleAddPayout(payout) {
    setShowPayoutForm(false);
    await patch(
      {
        payouts: [...(account.payouts || []), { id: `p${Date.now()}`, ...payout }],
        history: logEvent('payout', `Payout de ${fmtMoney(payout.amount)}`)
      },
      `Payout de ${fmtMoney(payout.amount)} registrado.`
    );
  }

  async function handleDeletePayout(id) {
    const confirmed = await showConfirm({
      title: 'Eliminar payout',
      message: '¿Eliminar este payout del historial?',
      confirmLabel: 'Eliminar',
      danger: true
    });
    if (!confirmed) return;
    await patch({ payouts: (account.payouts || []).filter((p) => p.id !== id) }, 'Payout eliminado.');
  }

  return (
    <section className="account-rules-panel">
      <div className="account-rules-panel-head">
        <div>
          <h3 className="account-rules-panel-title">
            <span
              className="account-dot"
              style={account.color ? { '--account-color': account.color } : undefined}
            />
            {account.name}
            {account.firm && <span className="account-firm">{account.firm}</span>}
          </h3>
          <div className="account-chips">
            {isFunded && <span className="account-chip">{ACCOUNT_PHASES[phase] || phase}</span>}
            <span className={`account-chip status-${status}`}>{ACCOUNT_STATUSES[status] || status}</span>
            <span className="account-chip muted">Balance inicial {fmtMoney(fin.initial)}</span>
            {account.phaseStartedAt && (
              <span className="account-chip muted">
                Fase desde {new Date(account.phaseStartedAt).toLocaleDateString('es-ES')}
              </span>
            )}
          </div>
        </div>

        <div className="account-equity-box">
          <span className="account-equity-label">Balance actual</span>
          <strong className="account-equity-value">{fmtMoney(fin.balance)}</strong>
          <span className={`account-equity-delta ${fin.netPnl >= 0 ? 'up' : 'down'}`}>
            {fin.netPnl >= 0 ? '+' : ''}{fmtMoney(fin.netPnl)} de trading
          </span>
        </div>
      </div>

      {isFunded && (
        <div className="account-actions-row">
          {inEval ? (
            <button className="account-action-btn primary" onClick={handlePassPhase} disabled={busy}>
              ✓ Evaluación superada
            </button>
          ) : (
            <button
              className="account-action-btn primary"
              onClick={() => setShowPayoutForm((v) => !v)}
              disabled={busy}
            >
              Registrar payout
            </button>
          )}
          <button className="account-action-btn" onClick={handleReset} disabled={busy}>Reiniciar fase</button>
          <button className="account-action-btn danger" onClick={handleFail} disabled={busy}>Marcar rota</button>
        </div>
      )}

      {showPayoutForm && (
        <PayoutForm
          suggested={fin.available}
          onCancel={() => setShowPayoutForm(false)}
          onSubmit={handleAddPayout}
        />
      )}

      {isFunded && !inEval && (
        <div className="payout-summary">
          <div className="payout-stat">
            <span className="payout-stat-label">Disponible para retirar</span>
            <strong className={fin.available > 0 ? 'pos' : ''}>{fmtMoney(fin.available)}</strong>
            <small>{fin.split}% de reparto{fin.buffer > 0 ? ` · colchón ${fmtMoney(fin.buffer)}` : ''}</small>
          </div>
          <div className="payout-stat">
            <span className="payout-stat-label">Total retirado</span>
            <strong>{fmtMoney(fin.totalPaidOut)}</strong>
            <small>{fin.payouts.length} payout{fin.payouts.length === 1 ? '' : 's'}</small>
          </div>
          <div className="payout-stat">
            <span className="payout-stat-label">Próximo payout</span>
            <strong className={fin.eligible ? 'pos' : ''}>
              {fin.eligible ? 'Disponible ya' : fin.daysLeft > 0 ? `En ${fin.daysLeft} días` : 'Aún no'}
            </strong>
            <small>
              {fin.payoutMin > 0 ? `Mínimo ${fmtMoney(fin.payoutMin)}` : 'Sin mínimo'}
              {fin.minDays > 0 ? ` · cada ${fin.minDays} días` : ''}
            </small>
          </div>
          <div className="payout-stat">
            <span className="payout-stat-label">Rentabilidad del reto</span>
            <strong className={fin.roi === null ? '' : fin.roi >= 0 ? 'pos' : 'neg'}>
              {fin.roi === null ? '—' : `${fin.roi.toFixed(0)}%`}
            </strong>
            <small>{fin.cost > 0 ? `Coste ${fmtMoney(fin.cost)}` : 'Sin coste registrado'}</small>
          </div>
        </div>
      )}

      {fin.payouts.length > 0 && (
        <ul className="payout-list">
          {fin.payouts.slice(0, 5).map((p) => (
            <li key={p.id} className="payout-list-item">
              <span className="payout-date">{new Date(p.date).toLocaleDateString('es-ES')}</span>
              <strong className="payout-amount">{fmtMoney(Number(p.amount) || 0)}</strong>
              <span className="payout-note">{p.note}</span>
              <button className="payout-del-btn" onClick={() => handleDeletePayout(p.id)} title="Eliminar">×</button>
            </li>
          ))}
        </ul>
      )}

      {!isFunded ? (
        <p className="account-empty-rules">
          Cuenta personal: sin reglas de fondeo. Cámbiala a tipo «fondeo» para configurar límites y payouts.
        </p>
      ) : results.length === 0 ? (
        <p className="account-empty-rules">
          Esta cuenta no tiene reglas activas. Añádelas desde «Gestionar cuentas».
        </p>
      ) : (
        <div className="account-rules-grid">
          {results.map((r) => (
            <div key={r.rule.id} className={`rule-card status-${r.status}`}>
              <div className="rule-card-head">
                <span className="rule-card-name">{r.rule.name}</span>
                <span className={`rule-card-status status-${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>

              <div className="rule-card-main">{remainingLabel(r)}</div>

              <div className="rule-card-bar">
                <div
                  className={`rule-card-bar-fill status-${r.status}`}
                  style={{ width: `${Math.min(100, Math.max(0, r.progress))}%` }}
                />
              </div>

              <div className="rule-card-detail">{r.detail}</div>
              <div className="rule-card-meta">
                {RULE_METRICS[r.rule.metric].label}
                {r.rule.basis && RULE_BASES[r.rule.basis] && ` · ${RULE_BASES[r.rule.basis].label}`}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

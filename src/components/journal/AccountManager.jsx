import { useEffect, useState } from 'react';
import {
  RULE_METRICS,
  RULE_BASES,
  UNIT_LABELS,
  ACCOUNT_PHASES,
  ACCOUNT_STATUSES,
  createRule,
  createRuleId
} from '../../utils/accountRules.js';
import { showToast } from '../../utils/toast.js';
import { showConfirm } from '../../utils/confirmDialog.js';

const COLORS = ['#4FD1C5', '#F0A868', '#8B7BF0', '#3DD68C', '#E5484D', '#5AA9E6', '#E8C547'];

const emptyAccount = () => ({
  name: '',
  type: 'funded',
  firm: '',
  initialBalance: 50000,
  color: COLORS[0],
  notes: '',
  phase: 'eval1',
  evalPhases: 1,
  status: 'active',
  phaseStartedAt: '',
  cost: 0,
  profitSplit: 90,
  payoutMin: 0,
  payoutMinDays: 0,
  payoutBuffer: 0,
  payouts: [],
  history: [],
  rules: []
});

/** Plantillas de arranque; después cada regla se puede editar por separado. */
const TEMPLATES = {
  apex: {
    label: 'Trailing congelado (estilo Apex)',
    build: (balance) => [
      { ...createRule('maxLoss'), name: 'Drawdown trailing', basis: 'trailingLocked', unit: 'amount', value: Math.round(balance * 0.05), lockOffset: 100 },
      { ...createRule('profitTarget'), name: 'Objetivo de payout', unit: 'amount', value: Math.round(balance * 0.06) },
      { ...createRule('minTradingDays'), name: 'Días mínimos', unit: 'days', value: 8 },
      { ...createRule('consistency'), name: 'Consistencia 30%', unit: 'percent', value: 30 }
    ]
  },
  topstep: {
    label: 'Trailing por cierre diario (estilo Topstep)',
    build: (balance) => [
      { ...createRule('maxLoss'), name: 'Drawdown trailing (cierre diario)', basis: 'trailingEod', unit: 'amount', value: Math.round(balance * 0.04) },
      { ...createRule('dailyLoss'), name: 'Pérdida diaria', unit: 'amount', value: Math.round(balance * 0.02) },
      { ...createRule('profitTarget'), name: 'Objetivo de fase', unit: 'amount', value: Math.round(balance * 0.06) }
    ]
  },
  static: {
    label: 'Drawdown estático (estilo FTMO)',
    build: (balance) => [
      { ...createRule('maxLoss'), name: 'Pérdida máxima total', basis: 'static', unit: 'percent', value: 10 },
      { ...createRule('dailyLoss'), name: 'Pérdida máxima diaria', unit: 'percent', value: 5 },
      { ...createRule('profitTarget'), name: 'Objetivo de beneficio', unit: 'percent', value: 10 }
    ]
  },
  empty: { label: 'Sin reglas (las añado yo)', build: () => [] }
};

function RuleRow({ rule, onChange, onRemove }) {
  const def = RULE_METRICS[rule.metric];

  function patch(changes) {
    onChange({ ...rule, ...changes });
  }

  function changeMetric(metric) {
    const nextDef = RULE_METRICS[metric];
    patch({
      metric,
      name: rule.name === def.label || !rule.name ? nextDef.label : rule.name,
      unit: nextDef.units.includes(rule.unit) ? rule.unit : nextDef.units[0],
      basis: nextDef.hasBasis ? rule.basis || 'static' : null
    });
  }

  return (
    <div className={`rule-row ${rule.enabled === false ? 'disabled' : ''}`}>
      <div className="rule-row-head">
        <input
          type="text"
          className="rule-name-input"
          value={rule.name}
          placeholder="Nombre de la regla"
          onChange={(e) => patch({ name: e.target.value })}
        />
        <label className="rule-toggle">
          <input
            type="checkbox"
            checked={rule.enabled !== false}
            onChange={(e) => patch({ enabled: e.target.checked })}
          />
          <span>Activa</span>
        </label>
        <button type="button" className="rule-remove-btn" onClick={onRemove} title="Eliminar regla">×</button>
      </div>

      <div className="rule-row-grid">
        <label className="rule-field">
          <span>Métrica</span>
          <select value={rule.metric} onChange={(e) => changeMetric(e.target.value)}>
            {Object.entries(RULE_METRICS).map(([key, m]) => (
              <option key={key} value={key}>{m.label}</option>
            ))}
          </select>
        </label>

        <label className="rule-field">
          <span>Valor</span>
          <div className="rule-value-group">
            <input
              type="number"
              step="any"
              value={rule.value}
              onChange={(e) => patch({ value: e.target.value })}
            />
            {def.units.length > 1 ? (
              <select value={rule.unit} onChange={(e) => patch({ unit: e.target.value })}>
                {def.units.map((u) => (
                  <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                ))}
              </select>
            ) : (
              <span className="rule-unit-static">{UNIT_LABELS[def.units[0]]}</span>
            )}
          </div>
        </label>

        {def.hasBasis && (
          <label className="rule-field rule-field-wide">
            <span>Cómo se calcula</span>
            <select value={rule.basis || 'static'} onChange={(e) => patch({ basis: e.target.value })}>
              {Object.entries(RULE_BASES).map(([key, b]) => (
                <option key={key} value={key}>{b.label}</option>
              ))}
            </select>
            <small>{RULE_BASES[rule.basis || 'static'].describe}</small>
          </label>
        )}

        {def.hasBasis && rule.basis === 'trailingLocked' && (
          <label className="rule-field">
            <span>Se congela en balance inicial +</span>
            <input
              type="number"
              step="any"
              value={rule.lockOffset}
              onChange={(e) => patch({ lockOffset: e.target.value })}
            />
          </label>
        )}

        {def.direction === 'limit' && (
          <label className="rule-field">
            <span>Avisar al consumir (%)</span>
            <input
              type="number"
              min="1"
              max="100"
              value={rule.warnAt}
              onChange={(e) => patch({ warnAt: e.target.value })}
            />
          </label>
        )}
      </div>

      <p className="rule-help">{def.describe}</p>
    </div>
  );
}

function AccountForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState(() => ({ ...emptyAccount(), ...initial }));

  useEffect(() => {
    setForm({ ...emptyAccount(), ...initial });
  }, [initial]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  function applyTemplate(key) {
    if (!key) return;
    const balance = Number(form.initialBalance) || 0;
    setForm((prev) => ({ ...prev, rules: TEMPLATES[key].build(balance) }));
  }

  function updateRule(index, next) {
    setForm((prev) => {
      const rules = prev.rules.slice();
      rules[index] = next;
      return { ...prev, rules };
    });
  }

  function removeRule(index) {
    setForm((prev) => ({ ...prev, rules: prev.rules.filter((_, i) => i !== index) }));
  }

  function addRule() {
    setForm((prev) => ({ ...prev, rules: [...prev.rules, createRule('maxLoss')] }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Ponle un nombre a la cuenta.', { type: 'error' });
      return;
    }
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      firm: form.firm.trim(),
      initialBalance: Number(form.initialBalance) || 0,
      color: form.color,
      notes: form.notes.trim(),
      phase: form.type === 'funded' ? form.phase : 'funded',
      evalPhases: Number(form.evalPhases) || 1,
      status: form.status,
      phaseStartedAt: form.phaseStartedAt || '',
      cost: Number(form.cost) || 0,
      profitSplit: Number(form.profitSplit) || 100,
      payoutMin: Number(form.payoutMin) || 0,
      payoutMinDays: Number(form.payoutMinDays) || 0,
      payoutBuffer: Number(form.payoutBuffer) || 0,
      payouts: form.payouts || [],
      history: form.history || [],
      rules: form.rules.map((r) => ({
        id: r.id || createRuleId(),
        metric: r.metric,
        name: (r.name || RULE_METRICS[r.metric].label).trim(),
        enabled: r.enabled !== false,
        unit: r.unit,
        value: Number(r.value) || 0,
        basis: RULE_METRICS[r.metric].hasBasis ? r.basis || 'static' : null,
        lockOffset: Number(r.lockOffset) || 0,
        warnAt: Number(r.warnAt) || 80
      }))
    });
  }

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <div className="account-form-grid">
        <label className="rule-field">
          <span>Nombre de la cuenta</span>
          <input
            type="text"
            value={form.name}
            placeholder="Ej. Apex 50K #1"
            onChange={(e) => setField('name', e.target.value)}
          />
        </label>

        <label className="rule-field">
          <span>Tipo</span>
          <select value={form.type} onChange={(e) => setField('type', e.target.value)}>
            <option value="funded">Cuenta de fondeo</option>
            <option value="personal">Cuenta personal</option>
          </select>
        </label>

        <label className="rule-field">
          <span>Balance inicial ($)</span>
          <input
            type="number"
            step="any"
            value={form.initialBalance}
            onChange={(e) => setField('initialBalance', e.target.value)}
          />
        </label>

        <label className="rule-field">
          <span>Bróker / firma</span>
          <input
            type="text"
            value={form.firm}
            placeholder="Ej. Apex, Topstep, Tradovate…"
            onChange={(e) => setField('firm', e.target.value)}
          />
        </label>
      </div>

      <div className="account-color-row">
        <span className="rule-field-label">Color</span>
        <div className="account-color-swatches">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`account-color-swatch ${form.color === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setField('color', c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {form.type === 'funded' && (
        <>
          <div className="account-section-head">
            <h4>Fase y estado</h4>
          </div>

          <div className="account-form-grid">
            <label className="rule-field">
              <span>Fase actual</span>
              <select value={form.phase} onChange={(e) => setField('phase', e.target.value)}>
                {Object.entries(ACCOUNT_PHASES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label className="rule-field">
              <span>Nº de evaluaciones del reto</span>
              <select value={form.evalPhases} onChange={(e) => setField('evalPhases', e.target.value)}>
                <option value={1}>1 fase</option>
                <option value={2}>2 fases</option>
                <option value={3}>3 fases</option>
              </select>
            </label>

            <label className="rule-field">
              <span>Estado</span>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
                {Object.entries(ACCOUNT_STATUSES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </label>

            <label className="rule-field">
              <span>Inicio de la fase actual</span>
              <input
                type="date"
                value={(form.phaseStartedAt || '').slice(0, 10)}
                onChange={(e) => setField('phaseStartedAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
              />
              <small>Solo se evalúan las operaciones posteriores a esta fecha.</small>
            </label>
          </div>

          <div className="account-section-head">
            <h4>Payouts y coste</h4>
          </div>

          <div className="account-form-grid">
            <label className="rule-field">
              <span>Coste del reto / mensualidad ($)</span>
              <input
                type="number"
                step="any"
                value={form.cost}
                onChange={(e) => setField('cost', e.target.value)}
              />
            </label>

            <label className="rule-field">
              <span>Tu reparto de beneficios (%)</span>
              <input
                type="number"
                step="any"
                value={form.profitSplit}
                onChange={(e) => setField('profitSplit', e.target.value)}
              />
            </label>

            <label className="rule-field">
              <span>Payout mínimo ($)</span>
              <input
                type="number"
                step="any"
                value={form.payoutMin}
                onChange={(e) => setField('payoutMin', e.target.value)}
              />
            </label>

            <label className="rule-field">
              <span>Días mínimos entre payouts</span>
              <input
                type="number"
                step="1"
                value={form.payoutMinDays}
                onChange={(e) => setField('payoutMinDays', e.target.value)}
              />
            </label>

            <label className="rule-field">
              <span>Colchón a mantener ($)</span>
              <input
                type="number"
                step="any"
                value={form.payoutBuffer}
                onChange={(e) => setField('payoutBuffer', e.target.value)}
              />
              <small>Beneficio que debe quedar sin retirar (safety net).</small>
            </label>
          </div>

          <div className="account-rules-head">
            <h4>Reglas de la cuenta</h4>
            <div className="account-rules-actions">
              <select
                className="rule-template-select"
                value=""
                onChange={(e) => applyTemplate(e.target.value)}
              >
                <option value="">Aplicar plantilla…</option>
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <option key={key} value={key}>{t.label}</option>
                ))}
              </select>
              <button type="button" className="rule-add-btn" onClick={addRule}>+ Añadir regla</button>
            </div>
          </div>

          {form.rules.length === 0 ? (
            <p className="account-empty-rules">
              Sin reglas todavía. Aplica una plantilla o añade las tuyas: cada regla se
              configura por separado, incluida la forma de calcular el drawdown.
            </p>
          ) : (
            form.rules.map((rule, i) => (
              <RuleRow
                key={rule.id}
                rule={rule}
                onChange={(next) => updateRule(i, next)}
                onRemove={() => removeRule(i)}
              />
            ))
          )}
        </>
      )}

      <label className="rule-field">
        <span>Notas</span>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setField('notes', e.target.value)}
          placeholder="Detalles del reto, fase, condiciones de payout…"
        />
      </label>

      <div className="account-form-actions">
        <button type="button" className="account-cancel-btn" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="account-save-btn" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cuenta'}
        </button>
      </div>
    </form>
  );
}

/**
 * Modal de gestión de cuentas: crear, editar, duplicar y eliminar cuentas
 * junto con sus reglas personalizadas.
 */
export default function AccountManager({
  accounts,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  entryCounts = {}
}) {
  const [editing, setEditing] = useState(null); // null | 'new' | account
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data) {
    setSaving(true);
    try {
      if (editing === 'new') {
        await onCreate(data);
        showToast('Cuenta creada.', { type: 'success' });
      } else {
        await onUpdate(editing.firestoreId, data);
        showToast('Cuenta actualizada.', { type: 'success' });
      }
      setEditing(null);
    } catch (err) {
      console.error(err);
      showToast('No se pudo guardar la cuenta.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(account) {
    const count = entryCounts[account.firestoreId] || 0;
    const confirmed = await showConfirm({
      title: `Eliminar "${account.name}"`,
      message: count > 0
        ? `Esta cuenta tiene ${count} operaciones. Se conservarán en el journal pero quedarán sin cuenta asignada.`
        : '¿Seguro que quieres eliminar esta cuenta?',
      confirmLabel: 'Eliminar',
      danger: true
    });
    if (!confirmed) return;
    try {
      await onDelete(account.firestoreId);
      showToast('Cuenta eliminada.', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('No se pudo eliminar la cuenta.', { type: 'error' });
    }
  }

  return (
    <div className="account-modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="account-modal-head">
          <h3>{editing ? (editing === 'new' ? 'Nueva cuenta' : `Editar ${editing.name}`) : 'Gestionar cuentas'}</h3>
          <button className="account-close-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className="account-modal-body">
          {editing ? (
            <AccountForm
              initial={editing === 'new' ? {} : editing}
              onSubmit={handleSubmit}
              onCancel={() => setEditing(null)}
              saving={saving}
            />
          ) : (
            <>
              <button className="account-new-btn" onClick={() => setEditing('new')}>+ Nueva cuenta</button>

              {accounts.length === 0 ? (
                <p className="account-empty-rules">
                  Todavía no tienes cuentas. Crea una para separar tus operaciones y
                  configurar reglas de fondeo.
                </p>
              ) : (
                <ul className="account-list">
                  {accounts.map((a) => (
                    <li key={a.firestoreId} className="account-list-item">
                      <span
                        className="account-dot"
                        style={a.color ? { '--account-color': a.color } : undefined}
                      />
                      <div className="account-list-info">
                        <strong>{a.name}</strong>
                        <small>
                          {a.type === 'funded'
                            ? `${ACCOUNT_PHASES[a.phase] || 'Fondeo'} · ${ACCOUNT_STATUSES[a.status] || 'Activa'}`
                            : 'Personal'}
                          {a.firm ? ` · ${a.firm}` : ''}
                          {` · $${Number(a.initialBalance || 0).toLocaleString('es-ES')}`}
                          {` · ${(a.rules || []).length} reglas`}
                          {` · ${entryCounts[a.firestoreId] || 0} ops`}
                          {(a.payouts || []).length > 0 ? ` · ${(a.payouts || []).length} payouts` : ''}
                        </small>
                      </div>
                      <button className="account-edit-btn" onClick={() => setEditing(a)}>Editar</button>
                      <button className="account-delete-btn" onClick={() => handleDelete(a)}>Eliminar</button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

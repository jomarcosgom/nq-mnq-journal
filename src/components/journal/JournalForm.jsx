import { useEffect, useRef, useState } from 'react';
import { SPECS } from '../../constants.js';
import { nowLocalInputValue, isoToLocalInputValue } from '../../utils/datetime.js';
import { compressImageFile } from '../../utils/image.js';
import { getEntryTags, collectAllTags } from '../../utils/tags.js';
import TagInput from './TagInput.jsx';
import StarRating from './StarRating.jsx';
import { showToast } from '../../utils/toast.js';

const emptyFormState = () => ({
  contract: 'MNQ',
  accountId: '',
  dateTime: nowLocalInputValue(),
  sl: 20,
  tp: 40,
  contracts: 1,
  realPnl: '',
  payout: '',
  tags: [],
  notes: '',
  outcome: 'pending', // pending (BE) | won | lost
  followedPlan: 'yes', // yes | no
  rating: 0,
  image: null
});

function formFromEntry(entry) {
  return {
    contract: entry.contract,
    accountId: entry.accountId || '',
    dateTime: isoToLocalInputValue(entry.date),
    sl: entry.slPoints,
    tp: entry.tpPoints,
    contracts: entry.contracts,
    realPnl: entry.realPnl !== null && entry.realPnl !== undefined ? entry.realPnl : '',
    payout: entry.payout !== null && entry.payout !== undefined ? entry.payout : '',
    tags: getEntryTags(entry),
    notes: entry.notes || '',
    outcome: entry.outcome || 'pending',
    followedPlan: entry.followedPlan || 'yes',
    rating: entry.rating || 0,
    image: entry.image || null
  };
}

export default function JournalForm({
  onSave,
  saving = false,
  editingEntry = null,
  onCancelEdit,
  allEntries = [],
  accounts = [],
  activeAccountId = 'all',
  onManageAccounts
}) {
  const defaultAccountId = activeAccountId && activeAccountId !== 'all' ? activeAccountId : '';
  const [form, setForm] = useState(() =>
    (editingEntry ? formFromEntry(editingEntry) : { ...emptyFormState(), accountId: defaultAccountId })
  );
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const tagSuggestions = collectAllTags(allEntries);

  // Cuando se pide editar una operación (o se cancela la edición),
  // recarga el formulario con esos datos (o lo vacía de nuevo).
  useEffect(() => {
    setForm(editingEntry ? formFromEntry(editingEntry) : { ...emptyFormState(), accountId: defaultAccountId });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [editingEntry, defaultAccountId]);

  const spec = SPECS[form.contract];
  const contractsNum = Math.max(1, parseFloat(form.contracts) || 1);
  const slPoints = parseFloat(form.sl) || 0;
  const tpPoints = parseFloat(form.tp) || 0;
  const riskDollars = slPoints * spec.pointValue * contractsNum;
  const rewardDollars = tpPoints * spec.pointValue * contractsNum;

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: null } : prev));
  }

  function validate() {
    const errs = {};
    if (!form.dateTime) errs.dateTime = 'Indica la fecha y hora de la operación.';
    if (!(slPoints > 0)) errs.sl = 'Debe ser mayor que 0.';
    if (!(tpPoints > 0)) errs.tp = 'Debe ser mayor que 0.';
    if (!(contractsNum >= 1)) errs.contracts = 'Mínimo 1 contrato.';
    if (form.realPnl !== '' && isNaN(parseFloat(form.realPnl))) errs.realPnl = 'Introduce un número válido.';
    return errs;
  }

  async function handleImagePick(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setField('image', dataUrl);
    } catch (err) {
      console.error(err);
      showToast('No se pudo procesar la imagen.', { type: 'error' });
    }
  }

  function removeImage() {
    setField('image', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast('Revisa los campos marcados en rojo.', { type: 'error' });
      return;
    }

    const realPnlNum = form.realPnl !== '' ? parseFloat(form.realPnl) : null;
    const payoutNum = form.payout !== '' ? parseFloat(form.payout) : null;
    const rr = slPoints > 0 ? tpPoints / slPoints : null;

    const entry = {
      date: new Date(form.dateTime).toISOString(),
      contract: form.contract,
      accountId: form.accountId || null,
      contracts: contractsNum,
      slPoints,
      tpPoints,
      riskDollars,
      rewardDollars,
      rr,
      realPnl: realPnlNum !== null && !isNaN(realPnlNum) ? realPnlNum : null,
      payout: payoutNum !== null && !isNaN(payoutNum) ? payoutNum : null,
      tags: form.tags,
      notes: form.notes.trim(),
      outcome: form.outcome,
      followedPlan: form.followedPlan,
      rating: form.rating,
      image: form.image
    };

    const ok = await onSave(entry);
    // Solo vaciamos el formulario si el guardado fue bien; si falló,
    // dejamos los datos tal cual para que no se pierda lo escrito.
    if (ok) {
      setForm({ ...emptyFormState(), accountId: form.accountId });
      setErrors({});
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <form className="ticket journal-card" onSubmit={handleSubmit}>
      <div className="body-inner">
        {editingEntry && (
          <div className="edit-banner">
            ✎ Editando una operación guardada — los cambios sobrescribirán la entrada original.
          </div>
        )}

        <div className="pill-group-row">
          <span id="contract-label" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)' }}>
            Contrato
          </span>
          <div className="pill-toggle" role="group" aria-labelledby="contract-label">
            <button
              type="button"
              className={form.contract === 'MNQ' ? 'active' : ''}
              data-contract="MNQ"
              aria-pressed={form.contract === 'MNQ'}
              onClick={() => setField('contract', 'MNQ')}
            >
              MNQ
            </button>
            <button
              type="button"
              className={form.contract === 'NQ' ? 'active' : ''}
              data-contract="NQ"
              aria-pressed={form.contract === 'NQ'}
              onClick={() => setField('contract', 'NQ')}
            >
              NQ
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="trade-account">Cuenta</label>
          <select
            id="trade-account"
            value={form.accountId}
            onChange={(e) => {
              if (e.target.value === '__manage__') {
                onManageAccounts?.();
                return;
              }
              setField('accountId', e.target.value);
            }}
          >
            <option value="">Sin cuenta asignada</option>
            {accounts.map((a) => (
              <option key={a.firestoreId} value={a.firestoreId}>{a.name}</option>
            ))}
            <option value="__manage__">＋ Gestionar cuentas…</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="trade-datetime">Fecha y hora de la operación</label>
          <input
            id="trade-datetime"
            type="datetime-local"
            className={errors.dateTime ? 'invalid' : ''}
            value={form.dateTime}
            onChange={(e) => setField('dateTime', e.target.value)}
            aria-invalid={!!errors.dateTime}
          />
          {errors.dateTime && <div className="field-error">{errors.dateTime}</div>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="trade-sl">Stop Loss (pts)</label>
            <input
              id="trade-sl"
              type="number"
              className={errors.sl ? 'invalid' : ''}
              value={form.sl}
              min="0"
              step="0.25"
              onChange={(e) => setField('sl', e.target.value)}
              aria-invalid={!!errors.sl}
            />
            {errors.sl && <div className="field-error">{errors.sl}</div>}
          </div>
          <div className="field">
            <label htmlFor="trade-tp">Take Profit (pts)</label>
            <input
              id="trade-tp"
              type="number"
              className={errors.tp ? 'invalid' : ''}
              value={form.tp}
              min="0"
              step="0.25"
              onChange={(e) => setField('tp', e.target.value)}
              aria-invalid={!!errors.tp}
            />
            {errors.tp && <div className="field-error">{errors.tp}</div>}
          </div>
          <div className="field">
            <label htmlFor="trade-contracts">Cttos</label>
            <input
              id="trade-contracts"
              type="number"
              className={errors.contracts ? 'invalid' : ''}
              value={form.contracts}
              min="1"
              step="1"
              onChange={(e) => setField('contracts', e.target.value)}
              aria-invalid={!!errors.contracts}
            />
            {errors.contracts && <div className="field-error">{errors.contracts}</div>}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="trade-risk">Riesgo planeado</label>
            <input id="trade-risk" type="text" value={`$${riskDollars.toFixed(2)}`} disabled />
          </div>
          <div className="field">
            <label htmlFor="trade-reward">Beneficio planeado</label>
            <input id="trade-reward" type="text" value={`$${rewardDollars.toFixed(2)}`} disabled />
          </div>
        </div>

        <div className="field">
          <label htmlFor="trade-realpnl">Resultado real (P&amp;L neto en $)</label>
          <input
            id="trade-realpnl"
            type="number"
            step="0.01"
            className={errors.realPnl ? 'invalid' : ''}
            placeholder="Ej. 65.50 o -40 (déjalo vacío si está en BE)"
            value={form.realPnl}
            onChange={(e) => setField('realPnl', e.target.value)}
            aria-invalid={!!errors.realPnl}
          />
          {errors.realPnl && <div className="field-error">{errors.realPnl}</div>}
        </div>

        <div className="field">
          <label htmlFor="trade-payout">Payout recibido ($)</label>
          <input
            id="trade-payout"
            type="number"
            step="0.01"
            placeholder="Ej. 500.00"
            value={form.payout}
            onChange={(e) => setField('payout', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="trade-tags">Tags (setup, error, emoción…)</label>
          <TagInput
            id="trade-tags"
            value={form.tags}
            onChange={(tags) => setField('tags', tags)}
            suggestions={tagSuggestions}
            placeholder="Ej. Ruptura de rango, FOMO, sobre-tamaño…"
          />
        </div>

        <div className="field">
          <span id="outcome-label" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>Resultado</span>
          <div className="btn3" role="group" aria-labelledby="outcome-label">
            <button
              type="button"
              className={`outcome-btn ${form.outcome === 'pending' ? 'active' : ''}`}
              data-val="pending"
              aria-pressed={form.outcome === 'pending'}
              onClick={() => setField('outcome', 'pending')}
            >
              BE
            </button>
            <button
              type="button"
              className={`outcome-btn ${form.outcome === 'won' ? 'active' : ''}`}
              data-val="won"
              aria-pressed={form.outcome === 'won'}
              onClick={() => setField('outcome', 'won')}
            >
              Ganada
            </button>
            <button
              type="button"
              className={`outcome-btn ${form.outcome === 'lost' ? 'active' : ''}`}
              data-val="lost"
              aria-pressed={form.outcome === 'lost'}
              onClick={() => setField('outcome', 'lost')}
            >
              Perdida
            </button>
          </div>
        </div>

        <div className="field">
          <span id="plan-label" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>¿Seguiste el plan al pie de la letra?</span>
          <div className="btn2" role="group" aria-labelledby="plan-label">
            <button
              type="button"
              className={`plan-btn ${form.followedPlan === 'yes' ? 'active' : ''}`}
              data-val="yes"
              aria-pressed={form.followedPlan === 'yes'}
              onClick={() => setField('followedPlan', 'yes')}
            >
              Sí, disciplina total
            </button>
            <button
              type="button"
              className={`plan-btn ${form.followedPlan === 'no' ? 'active' : ''}`}
              data-val="no"
              aria-pressed={form.followedPlan === 'no'}
              onClick={() => setField('followedPlan', 'no')}
            >
              No, me desvié
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="trade-notes">Notas de la operación</label>
          <textarea
            id="trade-notes"
            placeholder="¿Qué viste? ¿Por qué entraste? ¿Cómo te sentiste?"
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
          />
        </div>

        <div className="field">
          <label>Valoración de la ejecución</label>
          <StarRating value={form.rating} onChange={(r) => setField('rating', r)} size="lg" />
        </div>

        <div className="attach-row">
          <button
            type="button"
            className="attach-btn"
            style={{ display: form.image ? 'none' : 'flex' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Adjuntar captura
          </button>
          <div className={`attach-preview ${form.image ? 'show' : ''}`}>
            {form.image && <img src={form.image} alt="Captura" />}
            <button type="button" className="remove-img" aria-label="Quitar captura adjunta" onClick={removeImage}>×</button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImagePick}
          />
        </div>

        <button className="save-btn" type="submit" disabled={saving}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span>
            {saving ? 'Guardando…' : editingEntry ? 'Actualizar operación' : 'Guardar en el journal'}
          </span>
        </button>

        {editingEntry && (
          <button type="button" className="cancel-edit-btn" onClick={onCancelEdit}>
            Cancelar edición
          </button>
        )}
      </div>
    </form>
  );
}

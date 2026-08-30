import { useEffect, useState } from 'react';

const ITEMS_KEY = 'mnq-journal-checklist-items';
const STATE_KEY = 'mnq-journal-checklist-state';

const DEFAULT_ITEMS = [
  'Revisé el calendario económico de hoy',
  'Definí mi riesgo máximo del día',
  'No tengo operaciones de ayer sin revisar',
  'Estoy en buen estado mental (sin prisa, sin rabia)'
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function loadItems() {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ITEMS;
  } catch {
    return DEFAULT_ITEMS;
  }
}

function loadChecked() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // La checklist se reinicia cada día: si el estado guardado es de otro
    // día, se descarta y se empieza de cero.
    return parsed.date === todayKey() ? parsed.checked : {};
  } catch {
    return {};
  }
}

export default function PreTradingChecklist() {
  const [items, setItems] = useState(loadItems);
  const [checked, setChecked] = useState(loadChecked);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify({ date: todayKey(), checked }));
  }, [checked]);

  function toggle(i) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  function addItem() {
    const text = draft.trim();
    if (!text) return;
    setItems((prev) => [...prev, text]);
    setDraft('');
  }

  function removeItem(i) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setChecked((prev) => {
      const next = { ...prev };
      delete next[i];
      return next;
    });
  }

  const doneCount = items.filter((_, i) => checked[i]).length;

  return (
    <div className="ticket checklist-card">
      <div className="body-inner">
        <button
          type="button"
          className="checklist-header"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          <span className="lbl">Checklist pre-trading</span>
          <span className="checklist-progress">
            {doneCount}/{items.length}
            <span className={`checklist-caret ${collapsed ? 'collapsed' : ''}`}>▾</span>
          </span>
        </button>

        {!collapsed && (
          <>
            <div className="checklist-list">
              {items.map((text, i) => (
                <label className={`checklist-item ${checked[i] ? 'done' : ''}`} key={i}>
                  <input type="checkbox" checked={!!checked[i]} onChange={() => toggle(i)} />
                  <span>{text}</span>
                  {editing && (
                    <button type="button" className="checklist-remove" aria-label={`Quitar "${text}"`} onClick={() => removeItem(i)}>×</button>
                  )}
                </label>
              ))}
            </div>

            {editing && (
              <div className="checklist-add-row">
                <input
                  type="text"
                  placeholder="Nuevo punto de la checklist…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem())}
                />
                <button type="button" onClick={addItem}>Añadir</button>
              </div>
            )}

            <button type="button" className="checklist-edit-toggle" onClick={() => setEditing((e) => !e)}>
              {editing ? 'Listo' : 'Editar checklist'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

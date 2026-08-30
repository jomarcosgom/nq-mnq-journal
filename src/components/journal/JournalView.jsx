import { useEffect, useMemo, useRef, useState } from 'react';
import JournalForm from './JournalForm.jsx';
import StatsGrid from './StatsGrid.jsx';
import EquityCurve from './EquityCurve.jsx';
import CalendarHeatmap from './CalendarHeatmap.jsx';
import HistoryFilters, { DEFAULT_FILTERS } from './HistoryFilters.jsx';
import HistoryTable from './HistoryTable.jsx';
import HistoryList from './HistoryList.jsx';
import DateRangeSelector from './DateRangeSelector.jsx';
import PreTradingChecklist from './PreTradingChecklist.jsx';
import EconomicCalendarWidget from './EconomicCalendarWidget.jsx';
import DrawdownChart from './DrawdownChart.jsx';
import WinLossStreak from './WinLossStreak.jsx';
import DashboardSkeleton from './DashboardSkeleton.jsx';
import { getEntryTags, collectAllTags } from '../../utils/tags.js';
import { filterByDateRange } from '../../utils/dateRange.js';
import { downloadEntriesCsv, entriesToCsv } from '../../utils/csv.js';
import { showToast } from '../../utils/toast.js';
import { showConfirm } from '../../utils/confirmDialog.js';
import { exportToJson, importFromJson, exportToExcel, exportToPdf, createCsvTemplate } from '../../utils/exportImport.js';

const SYNC_LABELS = {
  connecting: 'Conectando con la nube…',
  online: 'Sincronizado en la nube',
  error: 'Error al sincronizar: revisa las reglas de Firestore'
};

const PAGE_SIZE = 20;
const UNDO_DELAY = 5000;

export default function JournalView({ entries, syncState, addEntry, updateEntry, deleteEntry, clearAll }) {
  const [tab, setTab] = useState('resumen');
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dashboardRange, setDashboardRange] = useState('all');
  const [editingEntry, setEditingEntry] = useState(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState(() => new Set());
  const deleteTimeouts = useRef(new Map());
  const searchInputRef = useRef(null);

  useEffect(() => {
    function isTypingTarget(target) {
      const tag = target.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    }

    function handleKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === 'n') {
        e.preventDefault();
        setEditingEntry(null);
        setTab('registrar');
      } else if (e.key === '/') {
        e.preventDefault();
        setTab('historial');
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const visibleEntries = useMemo(
    () => entries.filter((e) => !pendingDeleteIds.has(e.firestoreId)),
    [entries, pendingDeleteIds]
  );

  const dashboardEntries = useMemo(
    () => filterByDateRange(visibleEntries, dashboardRange),
    [visibleEntries, dashboardRange]
  );

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visibleEntries.filter((e) => {
      if (filters.contract !== 'all' && e.contract !== filters.contract) return false;
      if (filters.outcome !== 'all' && (e.outcome || 'pending') !== filters.outcome) return false;
      if (filters.plan !== 'all' && e.followedPlan !== filters.plan) return false;
      if (filters.tag !== 'all' && !getEntryTags(e).includes(filters.tag)) return false;
      if (term) {
        const haystack = `${getEntryTags(e).join(' ')} ${e.notes || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [visibleEntries, filters, search]);

  useEffect(() => {
    setPage(1);
  }, [filters, search, entries.length]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const pagedEntries = useMemo(
    () => filteredEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredEntries, page]
  );

  const allTags = useMemo(() => collectAllTags(visibleEntries), [visibleEntries]);

  async function handleSave(entry) {
    setSaving(true);
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.firestoreId, entry);
        setEditingEntry(null);
        setTab('historial');
        showToast('Operación actualizada.', { type: 'success' });
      } else {
        await addEntry(entry);
        showToast('Operación guardada en el journal.', { type: 'success' });
      }
      return true;
    } catch (err) {
      console.error(err);
      showToast('No se pudo guardar en la nube. Revisa tu conexión o la configuración de Firebase.', { type: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(entry) {
    setEditingEntry(entry);
    setTab('registrar');
  }

  function handleCancelEdit() {
    setEditingEntry(null);
    setTab('historial');
  }

  function handleDelete(firestoreId) {
    if (editingEntry && editingEntry.firestoreId === firestoreId) {
      setEditingEntry(null);
    }

    setPendingDeleteIds((prev) => new Set(prev).add(firestoreId));

    const timeoutId = setTimeout(async () => {
      deleteTimeouts.current.delete(firestoreId);
      try {
        await deleteEntry(firestoreId);
      } catch (err) {
        console.error(err);
        showToast('No se pudo eliminar la operación.', { type: 'error' });
      } finally {
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(firestoreId);
          return next;
        });
      }
    }, UNDO_DELAY);
    deleteTimeouts.current.set(firestoreId, timeoutId);

    showToast('Operación eliminada.', {
      type: 'info',
      duration: UNDO_DELAY,
      actionLabel: 'Deshacer',
      onAction: () => {
        clearTimeout(deleteTimeouts.current.get(firestoreId));
        deleteTimeouts.current.delete(firestoreId);
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(firestoreId);
          return next;
        });
      }
    });
  }

  async function handleClearAll() {
    const confirmed = await showConfirm({
      title: 'Borrar todo el historial',
      message: '¿Borrar todo el historial de la nube? Esta acción no se puede deshacer.',
      confirmLabel: 'Borrar todo',
      danger: true
    });
    if (!confirmed) return;
    try {
      await clearAll();
      setEditingEntry(null);
      showToast('Historial borrado.', { type: 'success' });
    } catch (err) {
      console.error(err);
      showToast('No se pudo borrar el historial.', { type: 'error' });
    }
  }

  return (
    <>
      <div className={`sync-status ${syncState}`} role="status" aria-live="polite">
        <span className="sync-dot" />
        <span>{SYNC_LABELS[syncState]}</span>
      </div>

      <div className="journal-tabs">
        <button className={tab === 'resumen' ? 'active' : ''} onClick={() => setTab('resumen')}>
          Resumen
        </button>
        <button className={tab === 'registrar' ? 'active' : ''} onClick={() => setTab('registrar')} title="Atajo: N">
          {editingEntry ? 'Editando operación' : 'Registrar operación'}
        </button>
        <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>
          Historial {visibleEntries.length > 0 && <span className="journal-tab-count">{visibleEntries.length}</span>}
        </button>
      </div>

      {tab === 'resumen' && (
        <>
          <PreTradingChecklist />
          <EconomicCalendarWidget />

          {syncState === 'connecting' && entries.length === 0 ? (
            <DashboardSkeleton />
          ) : (
            <>
              <div className="dashboard-header-row">
                <h2 className="section-title dashboard-title">Dashboard</h2>
                <DateRangeSelector value={dashboardRange} onChange={setDashboardRange} />
              </div>

              <StatsGrid entries={dashboardEntries} />

              <WinLossStreak entries={dashboardEntries} />
              <EquityCurve entries={dashboardEntries} />
              <DrawdownChart entries={dashboardEntries} />
              <CalendarHeatmap entries={dashboardEntries} />
            </>
          )}
        </>
      )}

      {tab === 'registrar' && (
        <JournalForm
          onSave={handleSave}
          saving={saving}
          editingEntry={editingEntry}
          onCancelEdit={handleCancelEdit}
          allEntries={visibleEntries}
        />
      )}

      {tab === 'historial' && (
        <>
          <div className="history-header">
            <span className="history-title">Historial</span>
            {visibleEntries.length > 0 && (
              <div className="history-header-actions">
                <div className="export-import-group">
                  <button className="clear-btn" onClick={() => downloadEntriesCsv(visibleEntries)}>Exportar CSV</button>
                  <button className="clear-btn" onClick={handleExportJson}>Exportar JSON</button>
                  <button className="clear-btn" onClick={handleExportExcel}>Exportar Excel</button>
                  <button className="clear-btn" onClick={handleExportPdf}>Exportar PDF</button>
                  <button className="clear-btn" onClick={handleImportClick}>Importar</button>
                </div>
                <button className="clear-btn" onClick={handleClearAll}>Borrar todo</button>
              </div>
            )}
          </div>

          <div className="filters-row">
            <input
              ref={searchInputRef}
              type="text"
              className="filter-select search-input"
              placeholder="Buscar por tag o notas… (atajo: /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <HistoryFilters filters={filters} onChange={setFilters} tags={allTags} />

          {visibleEntries.length === 0 ? (
            <div className="history-empty">
              Aún no has guardado ninguna operación. <button className="link-btn" onClick={() => setTab('registrar')}>Registra la primera</button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="history-empty">Ninguna operación coincide con los filtros.</div>
          ) : (
            <>
              <HistoryTable entries={pagedEntries} onDelete={handleDelete} onEdit={handleEdit} />
              <HistoryList entries={pagedEntries} onDelete={handleDelete} onEdit={handleEdit} />
              {totalPages > 1 && (
                <div className="pagination-row">
                  <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Anterior</button>
                  <span>Página {page} de {totalPages} · {filteredEntries.length} operaciones</span>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Siguiente ›</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      <footer>Historial sincronizado en la nube (Firebase).</footer>
    </>
  );
}

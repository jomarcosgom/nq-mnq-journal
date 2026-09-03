import HistoryFilters from './HistoryFilters.jsx';
import HistoryTable from './HistoryTable.jsx';
import HistoryList from './HistoryList.jsx';
import { downloadEntriesCsv } from '../../utils/csv.js';

export default function HistoryTab({
  visibleEntries,
  filteredEntries,
  pagedEntries,
  allTags,
  filters,
  setFilters,
  search,
  setSearch,
  page,
  setPage,
  totalPages,
  handleDelete,
  handleEdit,
  handleClearAll,
  handleExportJson,
  handleExportExcel,
  handleExportPdf,
  handleImportClick,
  searchInputRef,
  setTab,
}) {
  return (
    <>
      <div className="history-header">
        <span className="history-title">Historial</span>
        {visibleEntries.length > 0 && (
          <div className="history-header-actions">
            <div className="export-import-group">
              <button className="clear-btn" onClick={() => downloadEntriesCsv(visibleEntries)}>
                Exportar CSV
              </button>
              <button className="clear-btn" onClick={handleExportJson}>
                Exportar JSON
              </button>
              <button className="clear-btn" onClick={handleExportExcel}>
                Exportar Excel
              </button>
              <button className="clear-btn" onClick={handleExportPdf}>
                Exportar PDF
              </button>
              <button className="clear-btn" onClick={handleImportClick}>
                Importar
              </button>
            </div>
            <button className="clear-btn" onClick={handleClearAll}>
              Borrar todo
            </button>
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
          Aún no has guardado ninguna operación.{' '}
          <button className="link-btn" onClick={() => setTab('registrar')}>
            Registra la primera
          </button>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="history-empty">Ninguna operación coincide con los filtros.</div>
      ) : (
        <>
          <HistoryTable entries={pagedEntries} onDelete={handleDelete} onEdit={handleEdit} />
          <HistoryList entries={pagedEntries} onDelete={handleDelete} onEdit={handleEdit} />
          {totalPages > 1 && (
            <div className="pagination-row">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹ Anterior
              </button>
              <span>
                Página {page} de {totalPages} · {filteredEntries.length} operaciones
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Siguiente ›
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

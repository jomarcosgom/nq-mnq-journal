export const DEFAULT_FILTERS = { contract: 'all', outcome: 'all', plan: 'all', tag: 'all' };

export default function HistoryFilters({ filters, onChange, tags = [] }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="filters-row">
      <select
        className="filter-select"
        value={filters.contract}
        onChange={(e) => set('contract', e.target.value)}
      >
        <option value="all">Todos los contratos</option>
        <option value="MNQ">Solo MNQ</option>
        <option value="NQ">Solo NQ</option>
      </select>

      <select
        className="filter-select"
        value={filters.outcome}
        onChange={(e) => set('outcome', e.target.value)}
      >
        <option value="all">Todos los resultados</option>
        <option value="won">Ganadas</option>
        <option value="lost">Perdidas</option>
        <option value="pending">BE</option>
      </select>

      <select
        className="filter-select"
        value={filters.plan}
        onChange={(e) => set('plan', e.target.value)}
      >
        <option value="all">Plan: todos</option>
        <option value="yes">Seguí el plan</option>
        <option value="no">Me desvié</option>
      </select>

      <select
        className="filter-select"
        value={filters.tag}
        onChange={(e) => set('tag', e.target.value)}
      >
        <option value="all">Todos los tags</option>
        {tags.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}

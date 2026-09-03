import { useEffect, useState } from 'react';
import { getEntryTags } from '../../utils/tags.js';
import { getTagStatistics, categorizeTag, getTagColor, TAG_CATEGORIES } from '../../utils/tagUtils.js';

export default function TagStats({ entries = [] }) {
  const [tagStats, setTagStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (entries.length === 0) {
      setTagStats({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const stats = getTagStatistics(entries);
    setTagStats(stats);
    setLoading(false);
  }, [entries]);

  const filteredTags = selectedCategory === null
    ? Object.entries(tagStats)
    : Object.entries(tagStats).filter(([tag]) => {
        return categorizeTag(tag) === selectedCategory;
      });

  if (loading) {
    return (
      <div className="ticket">
        <div className="ticket-header">
          <h3>Estadísticas de Tags</h3>
          <p className="ticket-subtitle">Analizando rendimiento por tags...</p>
        </div>
        <div className="body-inner">
          <div className="helper-text">Cargando estadísticas...</div>
        </div>
      </div>
    );
  }

  if (Object.keys(tagStats).length === 0) {
    return (
      <div className="ticket">
        <div className="ticket-header">
          <h3>Estadísticas de Tags</h3>
          <p className="ticket-subtitle">No hay datos suficientes para mostrar estadísticas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket">
      <div className="ticket-header">
        <h3>Estadísticas de Tags</h3>
        <p className="ticket-subtitle">Rendimiento de tus estrategias y emociones</p>
      </div>

      <div className="body-inner">
        {/* Category filter */}
        <div className="field-row" style={{ marginBottom: '16px' }}>
          <div className="field">
            <label>Filtrar por categoría</label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
            >
              <option value="">Todas las categorías</option>
              <option value={TAG_CATEGORIES.SETUP}>Setup</option>
              <option value={TAG_CATEGORIES.EMOTION}>Emoción</option>
              <option value={TAG_CATEGORIES.MARKET}>Mercado</option>
              <option value={TAG_CATEGORIES.RISK}>Riesgo</option>
              <option value={TAG_CATEGORIES.EXECUTION}>Ejecución</option>
              <option value={TAG_CATEGORIES.OTHER}>Otro</option>
            </select>
          </div>
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          {filteredTags.map(([tag, stats]) => {
            const category = categorizeTag(tag);
            const color = getTagColor(tag);
            const isPositive = stats.avgPnl >= 0;

            return (
              <div key={tag} className="stat-card">
                <div className="k" style={{
                  color: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.8)`,
                  textTransform: 'uppercase',
                  fontSize: '9.5px'
                }}>
                  {tag}
                </div>
                <div className="v" style={{
                  color: isPositive ? 'var(--reward)' : 'var(--risk)',
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {stats.avgPnl.toFixed(2)}
                </div>
                <div className="helper-text" style={{
                  fontSize: '10px',
                  marginTop: '4px'
                }}>
                  {stats.count} ops • {stats.winRate.toFixed(0)}% WR
                </div>
              </div>
            );
          })}

          {/* Summary card */}
          <div className="stat-card" style={{
            gridColumn: filteredTags.length < 3 ? 'span 2' : 'auto'
          }}>
            <div className="k">Resumen</div>
            <div className="v" style={{
              fontWeight: '600',
              fontSize: '16px'
            }}>
              {filteredTags.reduce((sum, [, s]) => sum + s.count, 0)} ops
            </div>
            <div className="helper-text" style={{
              fontSize: '10px',
              marginTop: '4px'
            }}>
              Total de operaciones analizadas
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="field" style={{ marginTop: '20px' }}>
          <label>Insights</label>
          <div className="helper-text">
            {filteredTags.length > 0 && (
              <>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Mejor tag por rendimiento:</strong>
                  {filteredTags.reduce((best, current) =>
                    current[1].avgPnl > best[1].avgPnl ? current : best
                  )[0]} ({filteredTags.reduce((best, current) =>
                    current[1].avgPnl > best[1].avgPnl ? current : best
                  )[1].avgPnl.toFixed(2)}$ por operación)
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Tag más frecuente:</strong>
                  {filteredTags.reduce((most, current) =>
                    current[1].count > most[1].count ? current : most
                  )[0]} ({filteredTags.reduce((most, current) =>
                    current[1].count > most[1].count ? current : most
                  )[1].count} usos)
                </div>
                <div>
                  <strong>Tag con mejor tasa de éxito:</strong>
                  {filteredTags.reduce((best, current) =>
                    current[1].winRate > best[1].winRate ? current : best
                  )[0]} ({filteredTags.reduce((best, current) =>
                    current[1].winRate > best[1].winRate ? current : best
                  )[1].winRate.toFixed(0)}% WR)
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <footer>
        <small>
          {tagStats.length} tags únicos •
          {entries.length} entradas totales
        </small>
      </footer>
    </div>
  );
}
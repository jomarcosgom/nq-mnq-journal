import { useState, useEffect } from 'react';
import { collectAllTags } from '../../utils/tags.js';
import { categorizeTag, getTagColor, TAG_CATEGORIES, TAG_COLORS } from '../../utils/tagUtils.js';
import { showToast } from '../../utils/toast.js';

export default function TagManager({ allEntries = [], onTagsUpdate }) {
  const [tags, setTags] = useState(() => collectAllTags(allEntries));
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState(TAG_CATEGORIES.OTHER);
  const [editingTag, setEditingTag] = useState(null);
  const [editCategory, setEditCategory] = useState(TAG_CATEGORIES.OTHER);
  const [filterCategory, setFilterCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update tags when entries change
  useEffect(() => {
    setTags(collectAllTags(allEntries));
  }, [allEntries]);

  const filteredTags = tags.filter(tag => {
    // Category filter
    if (filterCategory && filterCategory !== null) {
      const tagCategory = categorizeTag(tag);
      if (tagCategory !== filterCategory) return false;
    }

    // Search filter
    if (searchQuery.trim() !== '') {
      return tag.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  }).sort((a, b) => a.localeCompare(b));

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) {
      showToast('Por favor ingresa un tag válido', { type: 'error' });
      return;
    }

    if (tags.includes(tag)) {
      showToast('Este tag ya existe', { type: 'error' });
      return;
    }

    setTags([...tags, tag]);
    setNewTag('');
    showToast(`Tag "${tag}" agregado`, { type: 'success' });
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
    showToast(`Tag "${tagToDelete}" eliminado`, { type: 'success' });

    // Notify parent to update entries that had this tag
    if (onTagsUpdate) {
      onTagsUpdate(tagToDelete, null); // null indicates deletion
    }
  };

  const handleSaveEdit = () => {
    if (!editingTag) return;

    const newTagValue = newTag.trim();
    if (!newTagValue) {
      showToast('Por favor ingresa un tag válido', { type: 'error' });
      return;
    }

    if (newTagValue !== editingTag && tags.includes(newTagValue)) {
      showToast('Este tag ya existe', { type: 'error' });
      return;
    }

    // Update the tag in the list
    const updatedTags = tags.map(tag =>
      tag === editingTag ? newTagValue : tag
    );
    setTags(updatedTags);

    // Notify parent to update entries
    if (onTagsUpdate) {
      onTagsUpdate(editingTag, newTagValue);
    }

    setEditingTag(null);
    setNewTag('');
    showToast(`Tag renombrado a "${newTagValue}"`, { type: 'success' });
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setNewTag('');
  };

  const startEditing = (tag) => {
    setEditingTag(tag);
    setNewTag(tag);
    setEditCategory(categorizeTag(tag));
  };

  return (
    <div className="ticket">
      <div className="ticket-header">
        <h3>Gestor de Tags</h3>
        <p className="ticket-subtitle">Organiza, busca y gestiona tus tags de trading</p>
      </div>

      <div className="body-inner">
        {/* Header controls */}
        <div className="field-row" style={{ marginBottom: '16px' }}>
          <div className="field" style={{ flex: 1, minWidth: '200px' }}>
            <label>Buscar tags</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tags..."
            />
          </div>

          <div className="field" style={{ flex: 1, minWidth: '150px' }}>
            <label>Filtrar por categoría</label>
            <select
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
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

        {/* Add new tag section */}
        <div className="field-row" style={{ marginBottom: '20px' }}>
          <div className="field" style={{ flex: 1, minWidth: '200px' }}>
            <label>Nuevo tag</label>
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Ej. Ruptura de rango, FOMO..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            />
          </div>

          <div className="field" style={{ flex: 1, minWidth: '150px' }}>
            <label>Categoría</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            >
              <option value={TAG_CATEGORIES.SETUP}>Setup</option>
              <option value={TAG_CATEGORIES.EMOTION}>Emoción</option>
              <option value={TAG_CATEGORIES.MARKET}>Mercado</option>
              <option value={TAG_CATEGORIES.RISK}>Riesgo</option>
              <option value={TAG_CATEGORIES.EXECUTION}>Ejecución</option>
              <option value={TAG_CATEGORIES.OTHER}>Otro</option>
            </select>
          </div>

          <div className="field" style={{ minWidth: '80px', display: 'flex', alignItems: 'end' }}>
            <button
              className="save-btn"
              onClick={handleAddTag}
              style={{ width: '100%', padding: '8px 12px', fontSize: '12px' }}
            >
              Añadir
            </button>
          </div>
        </div>

        {/* Tags list */}
        <div className="field">
          <label>Tags existentes ({filteredTags.length})</label>
          {filteredTags.length === 0 ? (
            <p className="helper-text">No hay tags que coincidan con los filtros</p>
          ) : (
            <div className="tag-rank-list">
              {filteredTags.map((tag, index) => {
                const category = categorizeTag(tag);
                const color = getTagColor(tag);
                const isEditing = editingTag === tag;

                return (
                  <div key={index} className="tag-rank-row" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                    borderBottom: isEditing ? '1px dashed var(--border)' : 'none'
                  }}>
                    {!isEditing ? (
                      <>
                        <div
                          className="tag-chip-sm"
                          style={{
                            background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.12)`,
                            color: color,
                            border: `1px solid ${color}20`
                          }}
                        >
                          {tag.substring(0, 1).toUpperCase()}{tag.length > 1 ? '.' : ''}
                        </div>
                        <span style={{ flex: 1, minWidth: '120px' }}>{tag}</span>
                        <span className="tag-rank-value" style={{
                          color: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.8)`,
                          fontSize: '11px'
                        }}>
                          [{category.charAt(0).toUpperCase() + category.slice(1)}]
                        </span>
                        <div className="tag-rank-count" style={{
                          textAlign: 'right',
                          minWidth: '40px'
                        }}>
                          {/* Count occurrences in entries (simplified) */}
                          {allEntries.filter(entry =>
                            Array.isArray(entry.tags) ? entry.tags.includes(tag) :
                              entry.setup === tag
                          ).length}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'center'
                        }}>
                          <button
                            onClick={() => startEditing(tag)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent)',
                              fontSize: '12px',
                              padding: '2px 4px'
                            }}
                            title="Editar tag"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              fontSize: '12px',
                              padding: '2px 4px'
                            }}
                            title="Eliminar tag"
                          >
                            ×
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="tag-chip-sm" style={{
                          background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.12)`,
                          color: color,
                          border: `1px solid ${color}20`
                        }}>
                          {tag.substring(0, 1).toUpperCase()}{tag.length > 1 ? '.' : ''}
                        </div>
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                          style={{
                            flex: 1,
                            minWidth: '120px',
                            fontSize: '13px',
                            padding: '4px 8px'
                          }}
                        />
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          style={{
                            minWidth: '100px',
                            fontSize: '12px',
                            padding: '4px 8px'
                          }}
                        >
                          <option value={TAG_CATEGORIES.SETUP}>Setup</option>
                          <option value={TAG_CATEGORIES.EMOTION}>Emoción</option>
                          <option value={TAG_CATEGORIES.MARKET}>Mercado</option>
                          <option value={TAG_CATEGORIES.RISK}>Riesgo</option>
                          <option value={TAG_CATEGORIES.EXECUTION}>Ejecución</option>
                          <option value={TAG_CATEGORIES.OTHER}>Otro</option>
                        </select>
                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          alignItems: 'center'
                        }}>
                          <button
                            className="save-btn"
                            onClick={handleSaveEdit}
                            style={{
                              width: 'auto',
                              padding: '6px 10px',
                              fontSize: '12px',
                              marginRight: '4px'
                            }}
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--muted)',
                              fontSize: '12px',
                              padding: '2px 4px',
                              textDecoration: 'underline'
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer>
        <small>
          Total de tags únicos: {tags.length} |
          Entradas procesadas: {allEntries.length}
        </small>
      </footer>
    </div>
  );
}
import { useState } from 'react';

/**
 * Input de tags tipo "chips": escribe y pulsa Enter o coma para crear
 * un tag, con sugerencias de los ya usados en el historial.
 */
export default function TagInput({ id, value, onChange, suggestions = [], placeholder }) {
  const [draft, setDraft] = useState('');

  function addTag(raw) {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => !value.includes(s) && (draft === '' || s.toLowerCase().includes(draft.toLowerCase()))
  );

  return (
    <div className="tag-input-wrap">
      <div className="tag-input-chips">
        {value.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
            <button type="button" aria-label={`Quitar tag ${tag}`} onClick={() => removeTag(tag)}>×</button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          className="tag-input-field"
          value={draft}
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
        />
      </div>
      {draft !== '' && filteredSuggestions.length > 0 && (
        <div className="tag-suggestions">
          {filteredSuggestions.slice(0, 6).map((s) => (
            <button type="button" key={s} onClick={() => addTag(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { collectAllTags } from '../../utils/tags.js';
import { categorizeTag, getTagColor, getSuggestedTags, mergeTags } from '../../utils/tagUtils.js';

export default function TagInput({
  id,
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Ej. Ruptura de rango, FOMO, sobre-tamaño…',
}) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const inputRef = useRef(null);

  // Combine existing suggestions with all tags from history
  useEffect(() => {
    const allTags = mergeTags(suggestions, collectAllTags([])); // Will be updated via prop
    setShowSuggestions(true);
    setFilteredSuggestions(allTags);
  }, [suggestions]);

  // Update filtered suggestions as user types
  useEffect(() => {
    if (!inputRef.current) return;

    const query = inputValue.toLowerCase().trim();
    if (query.length === 0) {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const allTags = mergeTags(suggestions, collectAllTags([])); // Will be updated via prop
    const matches = allTags.filter(tag =>
      tag.toLowerCase().includes(query)
    );

    setFilteredSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }, [inputValue, suggestions]);

  const handleAddTag = (tag) => {
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tag = inputValue.trim();
      if (tag) {
        handleAddTag(tag);
      }
    } else if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="tag-input-wrap">
      <div className="tag-input-chips" onClick={() => inputRef.current?.focus()}>
        {value.map((tag, index) => {
          const category = categorizeTag(tag);
          const color = getTagColor(tag);
          return (
            <span
              key={index}
              className="tag-chip"
              style={{
                background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.12)`,
                border: `1px solid ${color}20`
              }}
            >
              <span style={{ color, fontWeight: 500 }}>{tag}</span>
              <button
                aria-label={`Eliminar tag ${tag}`}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                style={{
                  padding: '0 4px',
                  marginLeft: '4px',
                  opacity: 0.6
                }}
              >
                ×
              </button>
            </span>
          );
        })}
        {value.length < 5 && (
          <input
            ref={inputRef}
            id={id}
            type="text"
            value={inputValue}
            placeholder={placeholder}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => setShowSuggestions(true)}
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={`${id}-suggestions`}
            style={{
              border: 'none',
              background: 'none',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              fontSize: '13.5px',
              minWidth: '90px'
            }}
          />
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="tag-suggestions"
          id={`${id}-suggestions`}
        >
          {filteredSuggestions.slice(0, 8).map((tag, index) => {
            const category = categorizeTag(tag);
            const color = getTagColor(tag);
            return (
              <button
                key={index}
                onClick={() => handleAddTag(tag)}
                style={{
                  background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`,
                  border: `1px solid ${color}20`,
                  color: color,
                  fontSize: '11.5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  margin: '2px'
                }}
              >
                {tag}
                <span style={{
                  fontSize: '9px',
                  marginLeft: '6px',
                  opacity: 0.7,
                  textTransform: 'uppercase'
                }}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
const STAR_VALUES = [1, 2, 3, 4, 5];

/** Selector de estrellas 1-5. Modo de solo lectura si no se pasa onChange. */
export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const readOnly = !onChange;

  return (
    <div className={`star-rating star-${size} ${readOnly ? 'readonly' : ''}`} role={readOnly ? 'img' : 'radiogroup'} aria-label={`Valoraci\u00f3n: ${value} de 5 estrellas`}>
      {STAR_VALUES.map((n) => (
        <button
          type="button"
          key={n}
          className={n <= value ? 'filled' : ''}
          disabled={readOnly}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
          title={`${n} estrella${n > 1 ? 's' : ''}`}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          aria-pressed={n <= value}
        >
          ★
        </button>
      ))}
    </div>
  );
}

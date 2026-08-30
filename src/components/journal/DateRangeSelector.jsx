import { RANGE_OPTIONS } from '../../utils/dateRange.js';

export default function DateRangeSelector({ value, onChange }) {
  return (
    <select
      className="filter-select date-range-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {RANGE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

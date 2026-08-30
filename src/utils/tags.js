/**
 * Devuelve los tags de una operación, con compatibilidad hacia atrás:
 * las operaciones antiguas solo tenían un campo `setup` de texto libre.
 */
export function getEntryTags(entry) {
  if (Array.isArray(entry.tags) && entry.tags.length > 0) return entry.tags;
  if (entry.setup) return [entry.setup];
  return [];
}

/** Lista ordenada y sin duplicados de todos los tags usados en el historial. */
export function collectAllTags(entries) {
  const set = new Set();
  entries.forEach((e) => getEntryTags(e).forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

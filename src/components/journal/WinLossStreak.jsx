/** Tira visual de las últimas operaciones cerradas (verde = ganada, rojo = perdida). */
export default function WinLossStreak({ entries, limit = 40 }) {
  const closed = entries
    .filter((e) => e.realPnl !== null && e.realPnl !== undefined)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-limit);

  if (closed.length === 0) {
    return (
      <div className="streak-card">
        <div className="equity-header"><span className="lbl">Racha de resultados</span></div>
        <div className="equity-empty">Aún no hay operaciones cerradas.</div>
      </div>
    );
  }

  const wins = closed.filter((e) => e.realPnl > 0).length;

  return (
    <div className="streak-card">
      <div className="equity-header">
        <span className="lbl">Racha de resultados (últimas {closed.length})</span>
        <span className="val">{wins}/{closed.length} ganadas</span>
      </div>
      <div className="streak-strip">
        {closed.map((e) => {
          const isWin = e.realPnl >= 0;
          const d = new Date(e.date);
          const title = `${d.toLocaleDateString()} · ${isWin ? '+' : '-'}$${Math.abs(e.realPnl).toFixed(2)}`;
          return (
            <span
              key={e.firestoreId}
              className={`streak-cell ${isWin ? 'win' : 'loss'}`}
              title={title}
            />
          );
        })}
      </div>
    </div>
  );
}

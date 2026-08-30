const FEATURE_CHIPS = [
  'Dashboard en vivo', 'Calendario interactivo', 'Reportes avanzados',
  'Calculadora de riesgo', 'Tags y disciplina', 'Checklist diario'
];

const FEATURES = [
  {
    title: 'Trading Score',
    desc: 'Una puntuación 0-100 que combina win rate, profit factor, disciplina y consistencia.'
  },
  {
    title: 'Calendario de P&L',
    desc: 'Vista mensual con totales por semana y el detalle de cada día con un clic.'
  },
  {
    title: 'Reportes por tag',
    desc: 'Descubre qué setups, horas y días realmente te dan ventaja.'
  },
  {
    title: 'Calculadora NQ/MNQ',
    desc: 'Riesgo, beneficio y ratio R:R al instante antes de entrar a mercado.'
  },
  {
    title: 'Checklist pre-trading',
    desc: 'Tu rutina diaria antes de operar, con reinicio automático cada día.'
  },
  {
    title: 'Historial completo',
    desc: 'Filtros, búsqueda, exportación a CSV y capturas adjuntas por operación.'
  }
];

export default function LandingPage({ onLogin, onSignup }) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <div className="sidebar-brand-mark">NQ</div>
          <span>NQ / MNQ Trading</span>
        </div>
        <div className="landing-nav-actions">
          <button className="landing-link-btn" onClick={onLogin}>Iniciar sesión</button>
          <button className="landing-cta-btn" onClick={onSignup}>Crear cuenta</button>
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-hero-copy">
          <div className="eyebrow">Nasdaq-100 futures · NQ / MNQ</div>
          <h1 className="landing-title">Tu journal de trading, a nivel profesional</h1>
          <p className="landing-subtitle">
            Calculadora de riesgo y journal completo para futuros NQ y MNQ: dashboard con
            Trading Score, calendario de P&amp;L, reportes por tag y calculadora de riesgo,
            todo en un mismo sitio y sincronizado en la nube.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-cta-btn large" onClick={onSignup}>Empezar gratis →</button>
            <button className="landing-link-btn large" onClick={onLogin}>Ya tengo cuenta</button>
          </div>
          <div className="landing-chips">
            {FEATURE_CHIPS.map((c) => <span className="landing-chip" key={c}>{c}</span>)}
          </div>
        </div>

        <div className="landing-preview" aria-hidden="true">
          <div className="landing-preview-card">
            <div className="score-card hero-card">
              <div className="score-ring tier-mid" style={{ '--score-deg': '216deg' }}>
                <div className="score-ring-inner">60</div>
              </div>
              <div className="score-label">
                <div className="k">Trading Score</div>
                <div className="sub">Win rate + profit factor + disciplina</div>
              </div>
            </div>
            <div className="landing-preview-stats">
              <div className="hero-card">
                <div className="k">P&amp;L neto</div>
                <div className="v pos">+$2516.50</div>
              </div>
              <div className="hero-card">
                <div className="k">Win rate</div>
                <div className="v">50%</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="landing-features">
        <h2 className="landing-section-title">Todo lo que necesitas para encontrar tu ventaja</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        NQ / MNQ Trading · Journal y calculadora personal · Datos sincronizados en la nube (Firebase)
      </footer>
    </div>
  );
}

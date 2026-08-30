import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, APP_LOGIN_EMAIL } from '../firebase.js';

export default function LockScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, APP_LOGIN_EMAIL, password);
    } catch (err) {
      console.error(err);
      setError('Contraseña incorrecta.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        <div className="lock-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2>Acceso protegido</h2>
        <p>Introduce la contraseña para ver y editar tu calculadora y journal.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Comprobando…' : 'Entrar'}
          </button>
        </form>

        {error && <div className="lock-error">{error}</div>}
      </div>
    </div>
  );
}

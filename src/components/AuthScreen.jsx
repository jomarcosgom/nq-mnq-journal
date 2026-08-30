import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase.js';
import { showToast } from '../utils/toast.js';

const ERROR_MESSAGES = {
  'auth/invalid-email': 'Ese correo no parece válido.',
  'auth/user-not-found': 'No existe ninguna cuenta con ese correo.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento y vuelve a intentarlo.'
};

function friendlyError(err) {
  return ERROR_MESSAGES[err.code] || 'Algo ha ido mal. Inténtalo de nuevo.';
}

export default function AuthScreen({ initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'reset') {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Te hemos enviado un enlace para restablecer tu contraseña.', { type: 'success' });
        switchMode('login');
      } catch (err) {
        console.error(err);
        setError(friendlyError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card">
        {onClose && (
          <button type="button" className="lock-close-btn" aria-label="Volver" onClick={onClose}>×</button>
        )}
        <div className="lock-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h2>{mode === 'login' ? 'Inicia sesión' : mode === 'signup' ? 'Crea tu cuenta' : 'Recupera tu contraseña'}</h2>
        <p>
          {mode === 'login'
            ? 'Accede a tu calculadora y tu journal personal.'
            : mode === 'signup'
              ? 'Tu journal quedará guardado solo para ti, en la nube.'
              : 'Te enviaremos un enlace a tu correo para elegir una nueva contraseña.'}
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={{ textAlign: 'left', letterSpacing: 'normal', textTransform: 'none' }}
          />
          {mode !== 'reset' && (
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          )}
          {mode === 'signup' && (
            <input
              type="password"
              placeholder="Repite la contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          )}

          <button type="submit" className="lock-submit-btn" disabled={loading}>
            {loading
              ? 'Un momento…'
              : mode === 'login'
                ? 'Entrar'
                : mode === 'signup'
                  ? 'Crear cuenta'
                  : 'Enviar enlace'}
          </button>
        </form>

        {error && <div className="lock-error">{error}</div>}

        {mode === 'login' && (
          <button type="button" className="auth-switch-btn" onClick={() => switchMode('reset')}>
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <button
          type="button"
          className="auth-switch-btn"
          onClick={() => switchMode(mode === 'signup' ? 'login' : mode === 'reset' ? 'login' : 'signup')}
        >
          {mode === 'login'
            ? '¿No tienes cuenta? Crea una'
            : mode === 'signup'
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '← Volver a iniciar sesión'}
        </button>
      </div>
    </div>
  );
}

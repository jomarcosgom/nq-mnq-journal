import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.js';
import CalculatorView from './components/CalculatorView.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import LandingPage from './components/LandingPage.jsx';
import Sidebar, { BottomNav } from './components/Sidebar.jsx';
import JournalView from './components/journal/JournalView.jsx';
import ReportsView from './components/journal/ReportsView.jsx';
import ToastHost from './components/ToastHost.jsx';
import ConfirmHost from './components/ConfirmHost.jsx';
import { useJournalEntries } from './hooks/useJournalEntries.js';

export default function App() {
  const [view, setView] = useState('calc');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'signup'
  const journal = useJournalEntries(user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authChecked) return null;

  if (!user) {
    return (
      <>
        <ToastHost />
        <LandingPage onLogin={() => setAuthMode('login')} onSignup={() => setAuthMode('signup')} />
        {authMode && <AuthScreen initialMode={authMode} onClose={() => setAuthMode(null)} />}
      </>
    );
  }

  return (
    <>
      <ToastHost />
      <ConfirmHost />

      <div className="app-shell">
        <Sidebar view={view} onChange={setView} user={user} />

        <main className="main-content">
          <div className="main-content-inner">
            <div className={`view ${view === 'calc' ? 'active' : ''}`}>
              <CalculatorView />
            </div>

            <div className={`view ${view === 'journal' ? 'active' : ''}`}>
              <JournalView {...journal} />
            </div>

            <div className={`view ${view === 'reports' ? 'active' : ''}`}>
              <ReportsView entries={journal.entries} />
            </div>
          </div>
        </main>

        <BottomNav view={view} onChange={setView} user={user} />
      </div>
    </>
  );
}

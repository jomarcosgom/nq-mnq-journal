import { useEffect, useMemo, useState } from 'react';
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
import AccountTabs from './components/AccountTabs.jsx';
import AccountManager from './components/journal/AccountManager.jsx';
import { useJournalEntries } from './hooks/useJournalEntries.js';
import { useAccounts, ALL_ACCOUNTS } from './hooks/useAccounts.js';

export default function App() {
  const [view, setView] = useState('calc');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'signup'
  const [managingAccounts, setManagingAccounts] = useState(false);
  const journal = useJournalEntries(user);
  const accountsApi = useAccounts(user);
  const { accounts, activeAccountId, activeAccount, setActiveAccountId } = accountsApi;

  const scopedEntries = useMemo(
    () => (activeAccountId === ALL_ACCOUNTS
      ? journal.entries
      : journal.entries.filter((e) => e.accountId === activeAccountId)),
    [journal.entries, activeAccountId]
  );

  const entryCounts = useMemo(() => {
    const counts = {};
    for (const e of journal.entries) {
      if (e.accountId) counts[e.accountId] = (counts[e.accountId] || 0) + 1;
    }
    return counts;
  }, [journal.entries]);

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
        <Sidebar
          view={view}
          onChange={setView}
          user={user}
          accounts={accounts}
          activeAccountId={activeAccountId}
          onSelectAccount={setActiveAccountId}
          onManageAccounts={() => setManagingAccounts(true)}
          entries={journal.entries}
        />

        <main className="main-content">
          <div className="main-content-inner">
            <AccountTabs
              variant="strip"
              accounts={accounts}
              activeAccountId={activeAccountId}
              onSelect={setActiveAccountId}
              onManage={() => setManagingAccounts(true)}
              entries={journal.entries}
            />

            <div className={`view ${view === 'calc' ? 'active' : ''}`}>
              <CalculatorView />
            </div>

            <div className={`view ${view === 'journal' ? 'active' : ''}`}>
              <JournalView
                {...journal}
                entries={scopedEntries}
                accounts={accounts}
                activeAccount={activeAccount}
                activeAccountId={activeAccountId}
                onManageAccounts={() => setManagingAccounts(true)}
                onUpdateAccount={accountsApi.updateAccount}
              />
            </div>

            <div className={`view ${view === 'reports' ? 'active' : ''}`}>
              <ReportsView entries={scopedEntries} />
            </div>
          </div>
        </main>

        <BottomNav view={view} onChange={setView} user={user} />
      </div>

      {managingAccounts && (
        <AccountManager
          accounts={accounts}
          entryCounts={entryCounts}
          onClose={() => setManagingAccounts(false)}
          onCreate={accountsApi.addAccount}
          onUpdate={accountsApi.updateAccount}
          onDelete={accountsApi.deleteAccount}
        />
      )}
    </>
  );
}

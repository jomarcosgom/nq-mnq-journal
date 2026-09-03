import { signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import AccountTabs from './AccountTabs.jsx';

const CalcIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" />
    <path d="M16 14h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" />
    <path d="M16 18h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" />
  </svg>
);

const JournalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const SignOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const ReportsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const NAV_ITEMS = [
  { id: 'calc', label: 'Calculadora', icon: <CalcIcon /> },
  { id: 'journal', label: 'Journal', icon: <JournalIcon /> },
  { id: 'reports', label: 'Reportes', icon: <ReportsIcon /> }
];

export default function Sidebar({
  view,
  onChange,
  user,
  accounts = [],
  activeAccountId,
  onSelectAccount,
  onManageAccounts,
  entries = []
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">NQ</div>
        <div>
          <div className="sidebar-brand-name">NQ / MNQ Trading</div>
          <div className="sidebar-brand-tag">Nasdaq-100 futures</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? 'active' : ''}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <AccountTabs
        variant="sidebar"
        accounts={accounts}
        activeAccountId={activeAccountId}
        onSelect={onSelectAccount}
        onManage={onManageAccounts}
        entries={entries}
      />

      {user && (
        <div className="sidebar-footer">
          <div className="sidebar-user-email" title={user.email}>{user.email}</div>
          <button className="sidebar-signout-btn" onClick={() => signOut(auth)}>
            <SignOutIcon />
            Cerrar sesión
          </button>
        </div>
      )}
    </aside>
  );
}

export function BottomNav({ view, onChange, user }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? 'active' : ''}
            onClick={() => onChange(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
        {user && (
          <button onClick={() => signOut(auth)}>
            <SignOutIcon />
            <span>Salir</span>
          </button>
        )}
      </div>
    </nav>
  );
}

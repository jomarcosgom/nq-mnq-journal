import { ALL_ACCOUNTS } from '../hooks/useAccounts.js';
import { evaluateAccount, accountHealth, entriesForCurrentPhase } from '../utils/accountRules.js';

const HEALTH_TITLE = {
  ok: 'Dentro de las reglas',
  warning: 'Cerca de romper alguna regla',
  breached: 'Regla incumplida',
  passed: 'Objetivos cumplidos'
};

function AccountDot({ account, entries }) {
  const scoped = entriesForCurrentPhase(
    account,
    entries.filter((e) => e.accountId === account.firestoreId)
  );
  const health = account.status === 'failed'
    ? 'breached'
    : account.type === 'funded'
      ? accountHealth(evaluateAccount(account, scoped).results)
      : 'ok';
  return (
    <span
      className={`account-dot health-${health}`}
      style={account.color ? { '--account-color': account.color } : undefined}
      title={HEALTH_TITLE[health]}
    />
  );
}

/**
 * Pestañas de cuentas. `variant="sidebar"` se usa en la barra lateral de
 * escritorio y `variant="strip"` como tira horizontal en móvil.
 */
export default function AccountTabs({
  accounts,
  activeAccountId,
  onSelect,
  onManage,
  entries = [],
  variant = 'sidebar'
}) {
  return (
    <div className={`account-tabs account-tabs-${variant}`}>
      <div className="account-tabs-head">
        <span className="account-tabs-title">Cuentas</span>
        <button className="account-manage-btn" onClick={onManage} title="Gestionar cuentas">
          Gestionar
        </button>
      </div>

      <div className="account-tabs-list">
        <button
          className={`account-tab ${activeAccountId === ALL_ACCOUNTS ? 'active' : ''}`}
          onClick={() => onSelect(ALL_ACCOUNTS)}
        >
          <span className="account-dot health-all" />
          <span className="account-tab-name">Todas las cuentas</span>
        </button>

        {accounts.map((account) => (
          <button
            key={account.firestoreId}
            className={`account-tab ${activeAccountId === account.firestoreId ? 'active' : ''}`}
            onClick={() => onSelect(account.firestoreId)}
            title={account.name}
          >
            <AccountDot account={account} entries={entries} />
            <span className="account-tab-name">{account.name}</span>
            {account.type === 'funded' && (
              <span className={`account-tab-badge ${account.status === 'failed' ? 'danger' : ''}`}>
                {account.status === 'failed'
                  ? 'Rota'
                  : (account.phase || 'funded').startsWith('eval')
                    ? 'Eval'
                    : 'Live'}
              </span>
            )}
          </button>
        ))}

        {accounts.length === 0 && (
          <button className="account-tab account-tab-empty" onClick={onManage}>
            + Crear tu primera cuenta
          </button>
        )}
      </div>
    </div>
  );
}

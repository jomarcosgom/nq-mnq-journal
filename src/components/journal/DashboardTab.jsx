import AccountRulesPanel from './AccountRulesPanel.jsx';
import PreTradingChecklist from './PreTradingChecklist.jsx';
import EconomicCalendarWidget from './EconomicCalendarWidget.jsx';
import DashboardSkeleton from './DashboardSkeleton.jsx';
import DateRangeSelector from './DateRangeSelector.jsx';
import StatsGrid from './StatsGrid.jsx';
import TagStats from './TagStats.jsx';
import TagManager from './TagManager.jsx';
import WinLossStreak from './WinLossStreak.jsx';
import EquityCurve from './EquityCurve.jsx';
import DrawdownChart from './DrawdownChart.jsx';
import CalendarHeatmap from './CalendarHeatmap.jsx';
import { showToast } from '../../utils/toast.js';

export default function DashboardTab({
  activeAccount,
  dashboardEntries,
  entries,
  syncState,
  dashboardRange,
  setDashboardRange,
  onUpdateAccount,
}) {
  return (
    <>
      {activeAccount && (
        <AccountRulesPanel account={activeAccount} entries={dashboardEntries} onUpdate={onUpdateAccount} />
      )}

      <PreTradingChecklist />
      <EconomicCalendarWidget />

      {syncState === 'connecting' && entries.length === 0 ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="dashboard-header-row">
            <h2 className="section-title dashboard-title">Dashboard</h2>
            <DateRangeSelector value={dashboardRange} onChange={setDashboardRange} />
          </div>

          <StatsGrid entries={dashboardEntries} />

          {/* Tag Statistics and Management */}
          {dashboardEntries.length > 0 && (
            <>
              <TagStats entries={dashboardEntries} />
              <TagManager
                allEntries={dashboardEntries}
                onTagsUpdate={(oldTag, newTag) => {
                  if (newTag === null) {
                    showToast(`Tag "${oldTag}" eliminado de todas las operaciones`, { type: 'info' });
                  } else if (oldTag !== newTag) {
                    showToast(`Tag "${oldTag}" renombrado a "${newTag}"`, { type: 'info' });
                  }
                }}
              />
            </>
          )}

          <WinLossStreak entries={dashboardEntries} />
          <EquityCurve entries={dashboardEntries} />
          <DrawdownChart entries={dashboardEntries} />
          <CalendarHeatmap entries={dashboardEntries} />
        </>
      )}
    </>
  );
}

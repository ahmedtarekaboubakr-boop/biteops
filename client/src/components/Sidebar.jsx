import { useLanguage } from '../context/LanguageContext'

const getTabIcon = (tabId) => {
  const icons = {
    staff: '👥',
    branches: '🏪',
    schedule: '📅',
    rating: '⭐',
    tutorials: '📚',
    requests: '📝',
    penalties: '⚠️',
    leaderboard: '🏆',
    announcements: '📢',
    activity: '📊',
    information: 'ℹ️',
    performance: '📈',
    attendance: '✅',
    dailyChecklist: '📋'
  }
  return icons[tabId] || '•'
}

export default function Sidebar({ activeTab, setActiveTab, tabs, user, onChangePassword, onLogout }) {
  const { t } = useLanguage()

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-[#6d1f35] flex flex-col shadow-xl z-50">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-[#5a1829]">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
          <img src="/logo.png" alt="JJ's Logo" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-6 py-3.5 text-left transition-all ${
              activeTab === tab.id
                ? 'bg-[#dc143c] text-white font-semibold shadow-lg'
                : 'text-gray-200 hover:bg-[#5a1829] hover:text-white'
            }`}
          >
            <span className="text-xl w-6 text-center">{getTabIcon(tab.id)}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* User actions */}
      <div className="border-t border-[#5a1829] p-4 space-y-2">
        <button
          type="button"
          onClick={onChangePassword}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-[#5a1829] hover:text-white rounded-lg transition-colors"
        >
          <span className="text-lg w-6 text-center">🔑</span>
          <span>{t('changePassword')}</span>
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-[#5a1829] hover:text-white rounded-lg transition-colors"
        >
          <span className="text-lg w-6 text-center">🚪</span>
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  )
}

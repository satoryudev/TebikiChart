'use client'

import { useOnboarding } from '@/hooks/useOnboarding'

const NAV_ITEMS = [
  { icon: '▤', label: 'ダッシュボード', active: true },
]

export default function DashboardSidebar() {
  const { resetOnboarding } = useOnboarding()

  return (
    <nav className="w-60 flex-shrink-0 bg-slate-900 flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗺️</span>
          <span className="text-lg font-bold text-white">GovGuide</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5 pl-8">行政手続きナビゲーター</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              item.active
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-slate-700/50 space-y-2">
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            G
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">管理者</p>
            <p className="text-xs text-slate-500 truncate">シナリオ作成担当</p>
          </div>
        </div>
        <button
          onClick={resetOnboarding}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors w-full text-left px-1"
        >
          オンボーディングをリセット
        </button>
      </div>
    </nav>
  )
}

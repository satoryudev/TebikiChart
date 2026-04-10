'use client'

import Link from 'next/link'
import { Scenario } from '@/types/scenario'
import { validateScenario } from '@/lib/scenarioValidation'

interface Props {
  scenario: Scenario
  onDelete: (id: string) => void
}

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  if (days < 30) return `${days}日前`
  return new Date(dateStr).toLocaleDateString('ja-JP')
}

export default function ScenarioTaskCard({ scenario, onDelete }: Props) {
  const issues = validateScenario(scenario.blocks)
  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:-translate-y-1 transition-all flex items-start gap-4">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{scenario.title}</h3>
          {errorCount > 0 && (
            <span className="flex-shrink-0 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 px-2 py-0.5 rounded-full">
              エラー {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex-shrink-0 text-xs font-medium bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-500 px-2 py-0.5 rounded-full">
              ⚠ {warningCount}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          ブロック数: {scenario.blocks.length}・更新: {getRelativeTime(scenario.updatedAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <Link
          href={`/editor/${scenario.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1 whitespace-nowrap"
        >
          編集する →
        </Link>
        <button
          onClick={() => onDelete(scenario.id)}
          className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors text-lg leading-none"
          title="削除"
        >
          ×
        </button>
      </div>
    </div>
  )
}

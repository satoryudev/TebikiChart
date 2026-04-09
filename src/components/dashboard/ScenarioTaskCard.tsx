'use client'

import Link from 'next/link'
import { Scenario } from '@/types/scenario'

interface Props {
  scenario: Scenario
  onDelete: (id: string) => void
}

export default function ScenarioTaskCard({ scenario, onDelete }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg hover:-translate-y-1 transition-all flex items-start gap-4">
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{scenario.title}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          ブロック数: {scenario.blocks.length}・更新: {new Date(scenario.updatedAt).toLocaleDateString('ja-JP')}
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

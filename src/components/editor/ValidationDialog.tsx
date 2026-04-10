'use client'

import { ValidationIssue } from '@/lib/scenarioValidation'

interface Props {
  issues: ValidationIssue[]
  onClose: () => void
  onJumpToBlock?: (blockId: string) => void
}

export default function ValidationDialog({ issues, onClose, onJumpToBlock }: Props) {
  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div id="validation-dialog" className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border-b border-red-100 dark:border-red-800">
          <span className="text-red-600 dark:text-red-400 text-base font-bold">✕</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">実行できません</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
              {errorCount > 0 && `エラー ${errorCount}件`}
              {errorCount > 0 && warningCount > 0 && ' / '}
              {warningCount > 0 && `警告 ${warningCount}件`}
            </p>
          </div>
        </div>

        {/* Issue list */}
        <ul id="validation-issues-list" className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
          {issues.map((issue, i) => (
            <li key={i}>
              <button
                onClick={() => {
                  if (issue.blockId && onJumpToBlock) {
                    onJumpToBlock(issue.blockId)
                    onClose()
                  }
                }}
                className={`w-full text-left px-4 py-2.5 text-xs flex items-start gap-2
                  ${issue.blockId ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`flex-shrink-0 mt-0.5 font-bold ${issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                  {issue.severity === 'error' ? '✕' : '⚠'}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{issue.message}</span>
                {issue.blockId && (
                  <span className="ml-auto flex-shrink-0 text-blue-500 dark:text-blue-400 text-[10px]">移動 →</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

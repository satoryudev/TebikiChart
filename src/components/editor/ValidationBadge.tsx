'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { validateScenario, ValidationIssue } from '@/lib/scenarioValidation'

export default function ValidationBadge() {
  const { scenario, setSelectedBlockId } = useEditorStore()
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLButtonElement>(null)
  const prevTotalRef = useRef<number | null>(null)

  const issues: ValidationIssue[] = scenario ? validateScenario(scenario.blocks) : []
  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length
  const totalCount = issues.length

  // 問題件数が変化したときにバッジを shake させる
  useEffect(() => {
    const prev = prevTotalRef.current
    prevTotalRef.current = totalCount
    // 初回レンダリングはスキップ
    if (prev === null) return
    if (totalCount === prev) return
    const el = badgeRef.current
    if (!el) return
    el.classList.remove('animate-shake')
    void el.offsetWidth // reflow で animation をリセット
    el.classList.add('animate-shake')
  }, [totalCount])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleIssueClick = (issue: ValidationIssue) => {
    if (issue.blockId) setSelectedBlockId(issue.blockId)
    setOpen(false)
  }

  const badgeLabel = totalCount === 0
    ? '✓ 問題なし'
    : errorCount > 0
      ? `✕ ${totalCount}件の問題`
      : `⚠ ${totalCount}件の警告`

  const badgeCls = totalCount === 0
    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
    : errorCount > 0
      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60'
      : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60'

  return (
    <div className="relative" ref={popoverRef}>
      <button
        id="validation-badge-btn"
        ref={badgeRef}
        onClick={() => setOpen((v) => !v)}
        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${badgeCls}`}
      >
        {badgeLabel}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400">
            シナリオチェック
          </div>
          {totalCount === 0 ? (
            <div className="px-3 py-4 text-sm text-emerald-600 dark:text-emerald-400 text-center">
              問題は見つかりませんでした
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {issues.map((issue, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleIssueClick(issue)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-start gap-2 transition-colors
                      ${issue.blockId ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' : 'cursor-default'}
                      border-b border-gray-100 dark:border-gray-700 last:border-b-0`}
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
          )}
        </div>
      )}
    </div>
  )
}

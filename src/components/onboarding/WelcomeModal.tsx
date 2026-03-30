'use client'

import { useEffect, useRef, useState } from 'react'

const TASK_PREVIEW = [
  { icon: '📂', text: '手続きカテゴリを選択する' },
  { icon: '📝', text: 'シナリオ名を設定する' },
  { icon: '🚀', text: 'ブロックを追加して公開する' },
]

interface Props {
  onStart: () => void
  onSkip: () => void
}

export default function WelcomeModal({ onStart, onSkip }: Props) {
  const [mounted, setMounted] = useState(false)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
    setMounted(true)
    ctaRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(onSkip) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onSkip])

  const handleClose = (action: () => void) => {
    setMounted(false)
    setTimeout(() => { previousFocusRef.current?.focus(); action() }, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(onSkip) }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Hero band */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-center">
          <div className="text-6xl mb-3">👋</div>
          <h1 id="welcome-title" className="text-xl font-bold text-white">
            GovGuide チームへようこそ
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            シナリオ作成担当者として登録されました
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {/* Role assignment pill */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 mb-6">
            <span className="text-emerald-600 text-lg font-bold">✓</span>
            <div>
              <p className="text-xs text-emerald-700 font-semibold">担当ロール</p>
              <p className="text-sm text-emerald-900 font-medium">行政手続きナビゲーター</p>
            </div>
          </div>

          {/* Task preview */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            はじめにやること
          </p>
          <ul className="space-y-2.5 mb-6">
            {TASK_PREVIEW.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                  {item.icon}
                </span>
                {item.text}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            ref={ctaRef}
            onClick={() => handleClose(onStart)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm
              transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            オンボーディングを開始 →
          </button>
          <button
            onClick={() => handleClose(onSkip)}
            className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            スキップして既存のシナリオを開く
          </button>
        </div>
      </div>
    </div>
  )
}

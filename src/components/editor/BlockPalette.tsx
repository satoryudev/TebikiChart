'use client'

import { useEffect, useRef } from 'react'
import { Block, BlockType } from '@/types/scenario'
import { useEditorStore } from '@/store/editorStore'

interface PaletteItem {
  type: BlockType
  label: string
  description: string
  color: string
  emoji: string
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'speech',
    label: '吹き出し',
    description: 'キャラクターのセリフ',
    color: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
    emoji: '💬',
  },
  {
    type: 'spotlight',
    label: 'スポットライト',
    description: 'ボタンの強調',
    color: 'border-amber-300 bg-amber-50 hover:bg-amber-100',
    emoji: '🔦',
  },
  {
    type: 'input-spotlight',
    label: '入力スポットライト',
    description: '入力フォームの強調',
    color: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100',
    emoji: '✏️',
  },
  {
    type: 'document-preview',
    label: '書類プレビュー',
    description: '必要書類の見本表示',
    color: 'border-teal-300 bg-teal-50 hover:bg-teal-100',
    emoji: '📄',
  },
  {
    type: 'validation',
    label: 'バリデーション',
    description: '入力エラーの強調',
    color: 'border-rose-300 bg-rose-50 hover:bg-rose-100',
    emoji: '✅',
  },
  {
    type: 'branch',
    label: '条件分岐',
    description: 'はい / いいえ',
    color: 'border-red-300 bg-red-50 hover:bg-red-100',
    emoji: '🔀',
  },
]

function createBlock(type: BlockType): Block {
  const id = `block-${Math.random().toString(36).slice(2, 7)}`
  const now = new Date().toISOString()
  switch (type) {
    case 'speech':
      return { id, type: 'speech', message: '新しいセリフ', characterMood: 'normal', nextId: null }
    case 'spotlight':
      return { id, type: 'spotlight', message: '説明文', targetSelector: '#target', targetLabel: '対象要素', nextId: null }
    case 'input-spotlight':
      return { id, type: 'input-spotlight', message: '入力してください', targetId: 'input-id', targetLabel: '入力欄', nextId: null }
    case 'document-preview':
      return { id, type: 'document-preview', message: '書類を確認してください', targetId: 'input-id', targetLabel: '入力欄', documentType: 'mynumber-card', nextId: null }
    case 'validation':
      return { id, type: 'validation', message: '正しく入力してください', targetSelector: '#input-id', targetLabel: '入力欄', validationPattern: '^.+$', errorMessage: '入力が正しくありません', nextId: null }
    case 'branch':
      return { id, type: 'branch', question: 'はいですか？', yesNextId: null, noNextId: null }
  }
}

export default function BlockPalette() {
  const addBlock = useEditorStore((s) => s.addBlock)
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handler = () => firstButtonRef.current?.focus()
    document.addEventListener('govguide:focus-palette', handler)
    return () => document.removeEventListener('govguide:focus-palette', handler)
  }, [])

  return (
    <aside id="block-palette" className="bg-white flex flex-col h-full">
      <div className="p-3 flex flex-col gap-2">
        {PALETTE_ITEMS.map((item, i) => (
          <button
            key={item.type}
            ref={i === 0 ? firstButtonRef : undefined}
            onClick={() => addBlock(createBlock(item.type))}
            className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-colors ${item.color}`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span>{item.emoji}</span>
              <span className="text-sm font-semibold text-gray-800">{item.label}</span>
            </div>
            <p className="text-xs text-gray-500 pl-6">{item.description}</p>
          </button>
        ))}
      </div>
    </aside>
  )
}

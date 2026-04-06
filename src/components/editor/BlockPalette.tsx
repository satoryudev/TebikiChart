'use client'

import { useEffect, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { BlockType } from '@/types/scenario'
import { useBranchView } from './BranchViewContext'

interface PaletteItem {
  type: BlockType
  label: string
  description: string
  color: string
  emoji: string
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'start',
    label: '開始ブロック',
    description: 'チュートリアルの開始点',
    color: 'border-green-300 bg-green-50 hover:bg-green-100',
    emoji: '▶',
  },
  {
    type: 'end',
    label: '終了ブロック',
    description: 'チュートリアルの終了点',
    color: 'border-gray-300 bg-gray-50 hover:bg-gray-100',
    emoji: '⏹',
  },
  {
    type: 'speech',
    label: '吹き出し',
    description: 'キャラクターのセリフ',
    color: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
    emoji: '💬',
  },
  {
    type: 'input-spotlight',
    label: 'スポットライト',
    description: '入力フォーム／ボタンの強調',
    color: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100',
    emoji: '✏️',
  },
  {
    type: 'branch',
    label: '条件分岐',
    description: 'はい / いいえ',
    color: 'border-red-300 bg-red-50 hover:bg-red-100',
    emoji: '🔀',
  },
]

interface DraggableItemProps {
  item: PaletteItem
  itemRef?: React.Ref<HTMLDivElement>
  disabled?: boolean
}

function DraggablePaletteItem({ item, itemRef, disabled }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: 'palette', blockType: item.type },
    disabled,
  })

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        if (typeof itemRef === 'function') itemRef(el)
        else if (itemRef) (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = el
      }}
      {...attributes}
      {...listeners}
      tabIndex={disabled ? -1 : 0}
      title={disabled ? '分岐の中には条件分岐を追加できません' : undefined}
      className={`w-full text-left p-3 rounded-lg border transition-colors select-none ${
        disabled
          ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
          : `${item.color} cursor-grab active:cursor-grabbing`
      } ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span>{item.emoji}</span>
        <span className="text-sm font-semibold text-gray-800">{item.label}</span>
      </div>
      <p className="text-xs text-gray-500 pl-6">{item.description}</p>
    </div>
  )
}

export default function BlockPalette() {
  const firstItemRef = useRef<HTMLDivElement>(null)
  const { currentBranchView } = useBranchView()
  const inBranchView = currentBranchView !== null

  useEffect(() => {
    const handler = () => firstItemRef.current?.focus()
    document.addEventListener('govguide:focus-palette', handler)
    return () => document.removeEventListener('govguide:focus-palette', handler)
  }, [])

  return (
    <aside id="block-palette" className="bg-white flex flex-col h-full">
      <div className="p-3 flex flex-col gap-2">
        {PALETTE_ITEMS.map((item, i) => (
          <DraggablePaletteItem
            key={item.type}
            item={item}
            itemRef={i === 0 ? firstItemRef : undefined}
            disabled={inBranchView && item.type === 'branch'}
          />
        ))}
      </div>
    </aside>
  )
}

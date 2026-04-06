'use client'

import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Block } from '@/types/scenario'
import { useEditorStore } from '@/store/editorStore'

export const TYPE_META: Record<Block['type'], { label: string; color: string; emoji: string }> = {
  start: { label: '開始ブロック', color: 'border-l-green-500 bg-green-50', emoji: '▶' },
  end: { label: '終了ブロック', color: 'border-l-gray-400 bg-gray-50', emoji: '⏹' },
  speech: { label: '吹き出し', color: 'border-l-blue-400 bg-blue-50', emoji: '💬' },
  spotlight: { label: 'スポットライト', color: 'border-l-amber-400 bg-amber-50', emoji: '🔦' },
  'input-spotlight': { label: '入力スポットライト', color: 'border-l-indigo-400 bg-indigo-50', emoji: '✏️' },
  branch: { label: '条件分岐', color: 'border-l-red-400 bg-red-50', emoji: '🔀' },
}

export function getBlockSummary(block: Block): string {
  switch (block.type) {
    case 'start': return 'チュートリアルの開始点'
    case 'end': return 'チュートリアルの終了点'
    case 'speech': return block.message.slice(0, 40) + (block.message.length > 40 ? '…' : '')
    case 'spotlight': return `${block.targetLabel} → ${block.message.slice(0, 30)}`
    case 'input-spotlight': return `${block.targetLabel} → ${block.message.slice(0, 30)}`
    case 'branch': return block.question.slice(0, 40)
  }
}

interface Props {
  block: Block
  index: number
  disableDrag?: boolean
  isFixed?: boolean
}

export default function BlockItem({ block, index, disableDrag = false, isFixed = false }: Props) {
  const meta = TYPE_META[block.type] ?? { label: block.type, color: 'border-l-gray-400 bg-gray-50', emoji: '?' }
  const { selectedBlockId, setSelectedBlockId, removeBlock, activeBlockId } = useEditorStore()
  const isSelected = selectedBlockId === block.id
  const isActive = activeBlockId === block.id
  // 固定ブロックは削除不可。それ以外は start 以外すべて削除可能
  const isDeletable = !isFixed && block.type !== 'start'

  // Issue #23: useEffectでの同期を廃止し、state更新と同時にrefを直接更新する
  const [pendingDelete, setPendingDelete] = useState(false)
  const pendingDeleteRef = useRef(false)

  // 選択解除時に pendingDelete をリセット
  useEffect(() => {
    if (!isSelected) {
      setPendingDelete(false)
      pendingDeleteRef.current = false
    }
  }, [isSelected])

  // Backspace キーで削除確認フロー
  useEffect(() => {
    if (!isSelected || !isDeletable) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // input / textarea にフォーカスがある場合は無視
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return

      if (e.key === 'Backspace') {
        e.preventDefault()
        if (pendingDeleteRef.current) {
          removeBlock(block.id)
          setPendingDelete(false)
          pendingDeleteRef.current = false
        } else {
          setPendingDelete(true)
          pendingDeleteRef.current = true
        }
      } else if (e.key === 'Escape') {
        setPendingDelete(false)
        pendingDeleteRef.current = false
      } else {
        setPendingDelete(false)
        pendingDeleteRef.current = false
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSelected, isDeletable, block.id, removeBlock])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id, disabled: disableDrag })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      {...attributes}
      {...(disableDrag ? {} : listeners)}
      onClick={() => { if (!isFixed && selectedBlockId !== null) setSelectedBlockId(block.id) }}
      onDoubleClick={(e) => { if (isFixed) return; e.stopPropagation(); setSelectedBlockId(block.id) }}
      className={`
        flex items-stretch gap-2 p-3 rounded-lg border-l-4 ${disableDrag ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} outline-none
        ${meta.color}
        ${isActive
          ? 'ring-2 ring-amber-400 ring-offset-1 animate-pulse shadow-[0_0_12px_3px_rgba(251,191,36,0.5)]'
          : pendingDelete
            ? 'ring-2 ring-red-500 ring-offset-1'
            : isSelected
              ? 'ring-2 ring-blue-500 ring-offset-1'
              : 'hover:brightness-95'}
        transition-all
      `}
    >
      {/* メインコンテンツ */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* 上段：ラベル ＋ ⋮ 設定ボタン */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs">{meta.emoji}</span>
          <span className="text-xs font-semibold text-gray-600">{meta.label}</span>
          <span className="text-xs text-gray-400 ml-auto mr-1">#{index + 1}</span>
          {!isFixed && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id) }}
              className="text-gray-400 hover:text-gray-700 transition-colors leading-none flex-shrink-0 px-0.5"
              title="ブロック設定を開く"
            >
              ⋮
            </button>
          )}
        </div>

        {/* サマリー */}
        <p className="text-xs text-gray-700 truncate">{getBlockSummary(block)}</p>

        {/* 下段：ブロックID ＋ 削除ボタン */}
        <div className="flex items-center mt-0.5">
          <p className="text-xs text-gray-400 font-mono truncate flex-1">{block.id}</p>
          {isDeletable && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }}
              className="text-gray-300 hover:text-red-500 transition-colors text-base leading-none flex-shrink-0 ml-1"
              title="削除"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

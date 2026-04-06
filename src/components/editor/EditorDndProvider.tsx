'use client'

import { createContext, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { BranchBlock, BlockType } from '@/types/scenario'
import { useEditorStore } from '@/store/editorStore'
import { getBranchChain } from '@/lib/branchChain'
import { createBlock, createBranchGroup } from '@/lib/blockFactory'
import { useBranchView } from './BranchViewContext'

/** パレットからのドラッグ中に "どのブロックの上にいるか" を Canvas に伝えるコンテキスト */
export const DragOverContext = createContext<string | null>(null)

const PALETTE_META: Record<BlockType, { label: string; emoji: string; color: string }> = {
  start:            { label: '開始ブロック',       emoji: '▶',  color: 'border-green-300 bg-green-50' },
  end:              { label: '終了ブロック',       emoji: '⏹',  color: 'border-gray-300 bg-gray-50' },
  speech:           { label: '吹き出し',           emoji: '💬', color: 'border-blue-300 bg-blue-50' },
  spotlight:        { label: 'スポットライト',     emoji: '🔦', color: 'border-amber-300 bg-amber-50' },
  'input-spotlight':{ label: '入力スポットライト', emoji: '✏️', color: 'border-indigo-300 bg-indigo-50' },
  branch:           { label: '条件分岐',           emoji: '🔀', color: 'border-red-300 bg-red-50' },
}

export default function EditorDndProvider({ children }: { children: React.ReactNode }) {
  const { scenario, addBlocksAt, setBranchChild, reorderBlocks, addBlocksToBranchChain, reorderBranchChain } = useEditorStore()
  const { currentBranchView: branchView } = useBranchView()
  const [activePaletteType, setActivePaletteType] = useState<BlockType | null>(null)
  const [overBlockId, setOverBlockId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = (e: DragStartEvent) => {
    if (e.active.data.current?.source === 'palette') {
      setActivePaletteType(e.active.data.current.blockType as BlockType)
    }
  }

  const handleDragOver = (e: DragOverEvent) => {
    if (e.active.data.current?.source === 'palette') {
      setOverBlockId((e.over?.id as string) ?? null)
    }
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActivePaletteType(null)
    setOverBlockId(null)

    if (!over) return

    // ── ブランチビュー内の操作 ──
    if (branchView) {
      const branch = scenario?.blocks.find((b) => b.id === branchView.branchId) as BranchBlock | undefined
      const startId = branch?.options.find((o) => o.id === branchView.side)?.nextId ?? null
      const chainBlocks = getBranchChain(scenario?.blocks ?? [], startId)

      if (active.data.current?.source === 'palette') {
        const blockType = active.data.current.blockType as BlockType
        // 分岐の中には分岐を追加不可
        if (blockType === 'branch') return
        const overId = over.id as string
        const insertIdx = (overId === 'branch-canvas-end' || overId === 'branch-canvas-container')
          ? chainBlocks.length
          : (() => {
              const i = chainBlocks.findIndex((b) => b.id === overId)
              return i === -1 ? chainBlocks.length : i
            })()
        addBlocksToBranchChain(branchView.branchId, branchView.side, [createBlock(blockType)], insertIdx)
      } else {
        // チェーン内の並び替え
        const oldIdx = chainBlocks.findIndex((b) => b.id === active.id)
        const newIdx = chainBlocks.findIndex((b) => b.id === over.id)
        if (active.id !== over.id && oldIdx !== -1 && newIdx !== -1) {
          reorderBranchChain(branchView.branchId, branchView.side, arrayMove(chainBlocks, oldIdx, newIdx))
        }
      }
      return
    }

    // ── メインキャンバスの操作 ──
    if (active.data.current?.source === 'palette') {
      const blockType = active.data.current.blockType as BlockType
      const overId = over.id as string

      // branch の yes / no スロットへのドロップ
      if (overId.startsWith('branch-yes-') || overId.startsWith('branch-no-')) {
        const side = overId.startsWith('branch-yes-') ? 'yes' : 'no'
        const branchId = overId.slice(`branch-${side}-`.length)
        setBranchChild(branchId, side, createBlock(blockType))
        return
      }

      // キャンバスへの通常ドロップ
      const newBlocks = blockType === 'branch'
        ? [...createBranchGroup()]
        : [createBlock(blockType)]
      const currentBlocks = scenario?.blocks ?? []
      const insertIdx = (overId === 'canvas-end' || overId === 'canvas-container')
        ? currentBlocks.length
        : (() => { const i = currentBlocks.findIndex((b) => b.id === overId); return i === -1 ? currentBlocks.length : i })()
      addBlocksAt(newBlocks, insertIdx)
    } else {
      // キャンバス内の並び替え
      const blocks = scenario?.blocks ?? []
      const oldIdx = blocks.findIndex((b) => b.id === active.id)
      const newIdx = blocks.findIndex((b) => b.id === over.id)
      if (active.id !== over.id && oldIdx !== -1 && newIdx !== -1) {
        reorderBlocks(arrayMove(blocks, oldIdx, newIdx))
      }
    }
  }

  const meta = activePaletteType ? PALETTE_META[activePaletteType] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <DragOverContext.Provider value={overBlockId}>
        {children}
      </DragOverContext.Provider>
      <DragOverlay dropAnimation={null}>
        {meta && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg text-sm font-medium pointer-events-none ${meta.color}`}>
            <span>{meta.emoji}</span>
            <span className="text-gray-800">{meta.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

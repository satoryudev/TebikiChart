'use client'

import { Fragment, useContext, useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Block, BranchBlock } from '@/types/scenario'
import { useEditorStore } from '@/store/editorStore'
import { getBranchChainIds } from '@/lib/branchChain'
import BlockItem from './BlockItem'
import BranchSplit from './BranchSplit'
import EmptyStatePrompt from '@/components/onboarding/EmptyStatePrompt'
import { DragOverContext } from './EditorDndProvider'

function BlockConnector({ fromBlock }: { fromBlock: Block }) {
  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
      <svg width="10" height="6" viewBox="0 0 10 6" className="fill-gray-300 dark:fill-gray-600">
        <path d="M5 6L0 0h10z" />
      </svg>
      <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />
    </div>
  )
}

function DropLine() {
  return (
    <div className="flex items-center mx-1 my-1.5 animate-pulse">
      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 shrink-0 shadow-sm z-10 -mr-1" />
      <div className="flex-1 h-1 bg-blue-500 rounded-r-full" />
    </div>
  )
}

function AppendDropZone() {
  const { setNodeRef } = useDroppable({ id: 'canvas-end' })
  const overBlockId = useContext(DragOverContext)
  const isOver = overBlockId === 'canvas-end'
  return (
    <div
      ref={setNodeRef}
      className={`mt-1 overflow-hidden transition-all duration-200 ${isOver ? 'h-16' : 'h-8'}`}
    >
      {isOver && (
        <div className="mx-1 h-14 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center gap-1.5 animate-pulse">
          <span className="text-blue-500 dark:text-blue-400 text-sm">＋</span>
          <span className="text-xs font-medium text-blue-500 dark:text-blue-400">ここに追加</span>
        </div>
      )}
    </div>
  )
}

export default function Canvas() {
  const { scenario } = useEditorStore()
  const { setNodeRef } = useDroppable({ id: 'canvas-container' })
  const overBlockId = useContext(DragOverContext)

  const branchChildIds = useMemo(() => {
    return getBranchChainIds(scenario?.blocks ?? [])
  }, [scenario?.blocks])

  if (!scenario) return null

  // チェーンブロックはメインリストから除外し、branch の下に BranchSplit で描画する
  const mainBlocks = scenario.blocks.filter((b) => !branchChildIds.has(b.id))

  return (
    <div id="editor-canvas" ref={setNodeRef} className="flex-1 min-w-0 overflow-y-auto p-4 bg-white dark:bg-gray-900">
      {scenario.blocks.length === 0 ? (
        <EmptyStatePrompt />
      ) : (
        <SortableContext items={mainBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {mainBlocks.map((block, i) => {
              const isFixed =
                (i === 0 && block.type === 'start') ||
                (i === mainBlocks.length - 1 && block.type === 'end')
              return (
              <Fragment key={block.id}>
                {overBlockId === block.id && <DropLine />}
                <BlockItem block={block} index={scenario.blocks.indexOf(block)} disableDrag={isFixed} isFixed={isFixed} />
                {block.type === 'branch' ? (
                  <BranchSplit
                    branch={block as BranchBlock}
                    hasNextBlock={i < mainBlocks.length - 1}
                  />
                ) : (
                  i < mainBlocks.length - 1 && <BlockConnector fromBlock={block} />
                )}
              </Fragment>
              )
            })}
            <AppendDropZone />
          </div>
        </SortableContext>
      )}
    </div>
  )
}

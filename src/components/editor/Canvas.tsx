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
      <div className="w-px h-3 bg-gray-300" />
      <svg width="10" height="6" viewBox="0 0 10 6" className="fill-gray-300">
        <path d="M5 6L0 0h10z" />
      </svg>
      <div className="w-px h-3 bg-gray-300" />
    </div>
  )
}

function DropLine() {
  return <div className="h-0.5 mx-1 my-0.5 rounded bg-blue-400 shadow-sm" />
}

function AppendDropZone() {
  const { setNodeRef } = useDroppable({ id: 'canvas-end' })
  const overBlockId = useContext(DragOverContext)
  return (
    <div ref={setNodeRef} className="h-8 mt-1">
      {overBlockId === 'canvas-end' && <DropLine />}
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
    <div id="editor-canvas" ref={setNodeRef} className="flex-1 min-w-0 overflow-y-auto p-4">
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

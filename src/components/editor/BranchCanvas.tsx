'use client'

import { Fragment, useContext, useEffect } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BranchBlock, BRANCH_OPTION_COLOR_CLASSES } from '@/types/scenario'
import { useEditorStore } from '@/store/editorStore'
import { getBranchChain } from '@/lib/branchChain'
import { useBranchView } from './BranchViewContext'
import BlockItem, { TYPE_META } from './BlockItem'
import BranchSplit from './BranchSplit'
import { DragOverContext } from './EditorDndProvider'

function BlockConnector() {
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

function BranchAppendDropZone({ showCenterLine = false }: { showCenterLine?: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'branch-canvas-end' })
  const overBlockId = useContext(DragOverContext)
  return (
    <div ref={setNodeRef} className="relative h-8 mt-1">
      {showCenterLine && (
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300 -translate-x-1/2 pointer-events-none select-none" />
      )}
      {overBlockId === 'branch-canvas-end' && <DropLine />}
    </div>
  )
}

export default function BranchCanvas() {
  const { branchStack, currentBranchView, resetBranchView, truncateBranchStack, pushBranchView } = useBranchView()
  const { scenario } = useEditorStore()
  const { setNodeRef } = useDroppable({ id: 'branch-canvas-container' })
  const overBlockId = useContext(DragOverContext)

  // スタック内の branchId が削除された場合はリセット
  useEffect(() => {
    if (branchStack.length === 0) return
    const blockIds = new Set(scenario?.blocks.map((b) => b.id) ?? [])
    if (branchStack.some((v) => !blockIds.has(v.branchId))) {
      resetBranchView()
    }
  }, [branchStack, scenario?.blocks, resetBranchView])

  if (!currentBranchView || !scenario) return null

  const branch = scenario.blocks.find((b) => b.id === currentBranchView.branchId) as BranchBlock | undefined
  if (!branch) return null

  const startId = branch.options.find((o) => o.id === currentBranchView.side)?.nextId ?? null
  const chainBlocks = getBranchChain(scenario.blocks, startId)

  // 現在の分岐に nextId がない場合はスタックを遡って最初に見つかる合流先を使う
  const mergeTargetBlock = (() => {
    for (let i = branchStack.length - 1; i >= 0; i--) {
      const b = scenario.blocks.find((bl) => bl.id === branchStack[i].branchId) as BranchBlock | undefined
      if (b?.nextId) return scenario.blocks.find((bl) => bl.id === b.nextId) ?? null
    }
    return null
  })()
  const mergeTargetMeta = mergeTargetBlock ? TYPE_META[mergeTargetBlock.type] : null

  const isEmpty = chainBlocks.length === 0
    && overBlockId !== 'branch-canvas-end'
    && overBlockId !== 'branch-canvas-container'

  const lastBlock = chainBlocks[chainBlocks.length - 1]
  const lastIsBranch = lastBlock?.type === 'branch'

  return (
    <div className="flex flex-col flex-1 min-w-[320px] overflow-hidden">
      {/* パンくずヘッダー */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto">
        <button
          onClick={resetBranchView}
          className="text-gray-500 hover:text-gray-800 transition-colors text-base font-medium leading-none flex-shrink-0"
          title="メインキャンバスに戻る"
        >
          ←
        </button>
        {branchStack.map((entry, i) => {
          const entryBranch = scenario.blocks.find((b) => b.id === entry.branchId) as BranchBlock | undefined
          const option = entryBranch?.options.find((o) => o.id === entry.side)
          const sideLabel = option?.label ?? entry.side
          const cls = option ? BRANCH_OPTION_COLOR_CLASSES[option.color] : BRANCH_OPTION_COLOR_CLASSES.green
          const isLast = i === branchStack.length - 1
          return (
            <Fragment key={`${entry.branchId}-${entry.side}`}>
              <span className="text-gray-300 text-xs flex-shrink-0">›</span>
              {isLast ? (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${cls.bg} ${cls.border} ${cls.text}`}>
                  {sideLabel}
                </span>
              ) : (
                <button
                  onClick={() => truncateBranchStack(i + 1)}
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 transition-opacity hover:opacity-70 ${cls.bg} ${cls.border} ${cls.text}`}
                  title={entryBranch?.question}
                >
                  {sideLabel}
                </button>
              )}
              {isLast && entryBranch && (
                <span
                  className="text-[10px] text-gray-500 ml-1 truncate max-w-[120px]"
                  title={entryBranch.question}
                >
                  {entryBranch.question}
                </span>
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Branch blocks */}
      <div
        id="branch-editor-canvas"
        ref={setNodeRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col"
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-xs select-none border-2 border-dashed border-gray-200 rounded-lg">
            <p>この分岐でのみ実行するブロックを</p>
            <p>ここにドラッグして追加</p>
          </div>
        ) : (
          <SortableContext items={chainBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {chainBlocks.map((block, i) => (
                <Fragment key={block.id}>
                  {overBlockId === block.id && <DropLine />}
                  <BlockItem block={block} index={i} />
                  {block.type === 'branch' ? (
                    <BranchSplit
                      branch={block}
                      hasNextBlock={i < chainBlocks.length - 1}
                      onNavigate={(side) => pushBranchView({ branchId: block.id, side })}
                      hideMergeHint
                    />
                  ) : (
                    i < chainBlocks.length - 1 && <BlockConnector />
                  )}
                </Fragment>
              ))}
              <BranchAppendDropZone showCenterLine={lastIsBranch} />
            </div>
          </SortableContext>
        )}

        {/* 合流フッター */}
        <div className="select-none pointer-events-none flex flex-col items-center">
          <div className="w-px h-4 bg-gray-300" />
          <svg width="10" height="6" viewBox="0 0 10 6" className="fill-gray-300">
            <path d="M5 6L0 0h10z" />
          </svg>
          <div className="mt-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center">
            <p className="text-[10px] font-semibold text-gray-400">分岐ここまで・合流</p>
            {mergeTargetBlock && mergeTargetMeta ? (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {mergeTargetMeta.emoji} 次: {mergeTargetMeta.label}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 mt-0.5">← 戻って共通処理を追加</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

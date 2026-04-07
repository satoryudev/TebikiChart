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

function BranchAppendDropZone() {
  const { setNodeRef } = useDroppable({ id: 'branch-canvas-end' })
  const overBlockId = useContext(DragOverContext)
  const isOver = overBlockId === 'branch-canvas-end'
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

export default function BranchCanvas() {
  const { branchStack, currentBranchView, resetBranchView, truncateBranchStack, pushBranchView } = useBranchView()
  const { scenario } = useEditorStore()
  const overBlockId = useContext(DragOverContext)

  // スタック内の branchId が削除された場合はリセット
  useEffect(() => {
    if (branchStack.length === 0) return
    const blockIds = new Set(scenario?.blocks.map((b) => b.id) ?? [])
    if (branchStack.some((v) => !blockIds.has(v.branchId))) {
      resetBranchView()
    }
  }, [branchStack, scenario?.blocks, resetBranchView])

  // useDroppable の disabled 判定のため、フック呼び出し前にチェーン情報を計算
  const branchBlock = currentBranchView && scenario
    ? scenario.blocks.find((b) => b.id === currentBranchView.branchId) as BranchBlock | undefined
    : undefined
  const chainStartId = branchBlock
    ? (branchBlock.options.find((o) => o.id === currentBranchView!.side)?.nextId ?? null)
    : null
  const chainBlocks = getBranchChain(scenario?.blocks ?? [], chainStartId)
  const hasBranchInChain = chainBlocks.some(b => b.type === 'branch')

  const { setNodeRef } = useDroppable({ id: 'branch-canvas-container', disabled: hasBranchInChain })

  if (!currentBranchView || !scenario) return null

  const branch = branchBlock
  if (!branch) return null



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

  return (
    <div className="flex flex-col flex-1 min-w-[320px] overflow-hidden">
      {/* パンくずヘッダー */}
      <div className="flex items-center gap-1 px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-x-auto">
        <button
          onClick={resetBranchView}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-base font-medium leading-none flex-shrink-0"
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
              <span className="text-gray-300 dark:text-gray-600 text-xs flex-shrink-0">›</span>
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
                  className="text-[10px] text-gray-500 dark:text-gray-400 ml-1 truncate max-w-[120px]"
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
          <div className="flex flex-col items-center justify-center h-24 text-gray-400 dark:text-gray-500 text-xs select-none border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <p>この分岐でのみ実行するブロックを</p>
            <p>ここにドラッグして追加</p>
          </div>
        ) : hasBranchInChain ? (
          // 条件分岐ブロックが含まれる場合はドラッグ・追加を完全に禁止
          <div className="flex flex-col">
            {chainBlocks.map((block, i) => (
              <Fragment key={block.id}>
                <BlockItem block={block} index={i} disableDrag />
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
              <BranchAppendDropZone />
            </div>
          </SortableContext>
        )}

        {/* 合流フッター */}
        <div className="select-none pointer-events-none flex flex-col items-center">
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
          <svg width="10" height="6" viewBox="0 0 10 6" className="fill-gray-300 dark:fill-gray-600">
            <path d="M5 6L0 0h10z" />
          </svg>
          <div className="mt-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-center">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">分岐ここまで・合流</p>
            {mergeTargetBlock && mergeTargetMeta ? (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                {mergeTargetMeta.emoji} 次: {mergeTargetMeta.label}
              </p>
            ) : (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">← 戻って共通処理を追加</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

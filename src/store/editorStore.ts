import { create } from 'zustand'
import { Block, BranchBlock, Scenario } from '@/types/scenario'
import { saveScenario } from '@/lib/scenarioStorage'
import { getBranchChain, getBranchChainIds, collectBranchSubtreeIds } from '@/lib/branchChain'

/**
 * キャンバス上の順序に基づき nextId を自動計算する。
 * - メインチェーン: 通常通り前後ブロックを繋ぐ
 * - branch.nextId: branch の次のメインブロック（合流先）をセット
 * - チェーン末尾ブロック: branch.nextId（合流先）を nextId にセットし分岐後に合流させる
 */
function autoLink(blocks: Block[]): Block[] {
  const chainIds = getBranchChainIds(blocks)
  const mainBlocks = blocks.filter((b) => !chainIds.has(b.id))

  // 各 branch の合流先（次のメインブロック）を求める
  const branchMergeTarget = new Map<string, string | null>()
  for (let i = 0; i < mainBlocks.length; i++) {
    const b = mainBlocks[i]
    if (b.type === 'branch') {
      branchMergeTarget.set(b.id, mainBlocks[i + 1]?.id ?? null)
    }
  }

  // チェーン末尾ブロック → 合流先 ID のマップを求める
  const tailMergeTarget = new Map<string, string | null>()
  for (const b of blocks) {
    if (b.type !== 'branch') continue
    const mergeTarget = branchMergeTarget.get(b.id) ?? null
    for (const startId of [b.yesNextId, b.noNextId]) {
      const chain = getBranchChain(blocks, startId)
      if (chain.length > 0) tailMergeTarget.set(chain[chain.length - 1].id, mergeTarget)
    }
  }

  return blocks.map((b) => {
    if (b.type === 'end') return b

    if (chainIds.has(b.id)) {
      // 末尾ブロックなら合流先をセット、それ以外はそのまま保持
      return tailMergeTarget.has(b.id)
        ? { ...b, nextId: tailMergeTarget.get(b.id) ?? null }
        : b
    }

    if (b.type === 'branch') {
      return { ...b, nextId: branchMergeTarget.get(b.id) ?? null }
    }

    // メインチェーンの通常ブロック
    const mainIdx = mainBlocks.findIndex((m) => m.id === b.id)
    return { ...b, nextId: mainBlocks[mainIdx + 1]?.id ?? null }
  })
}

/** 開始ブロックの ID を自動取得する */
function getStartBlockId(blocks: Block[]): string | null {
  return blocks.find((b) => b.type === 'start')?.id ?? null
}

/** ピックモード：どのブロックのどのフィールドを待っているか */
export interface PickRequest {
  blockId: string
  field: string  // 'targetSelector' | 'targetId' など
  withHash: boolean  // true → "#foo" 形式、false → "foo" 形式
}

const UNDO_LIMIT = 50

interface EditorState {
  scenario: Scenario | null
  selectedBlockId: string | null
  editorOpenKey: number
  pickRequest: PickRequest | null
  activeBlockId: string | null
  undoStack: Block[][]
  redoStack: Block[][]
  setScenario: (scenario: Scenario) => void
  setSelectedBlockId: (id: string | null) => void
  setActiveBlockId: (id: string | null) => void
  updateBlock: (block: Block) => void
  addBlock: (block: Block) => void
  insertBlockAt: (block: Block, index: number) => void
  addBlocksAt: (blocks: Block[], index: number) => void
  setBranchChild: (branchId: string, side: 'yes' | 'no', block: Block) => void
  addBlocksToBranchChain: (branchId: string, side: 'yes' | 'no', newBlocks: Block[], index: number) => void
  reorderBranchChain: (branchId: string, side: 'yes' | 'no', reorderedChain: Block[]) => void
  removeBlock: (id: string) => void
  reorderBlocks: (blocks: Block[]) => void
  updateScenarioMeta: (meta: Partial<Pick<Scenario, 'title' | 'category' | 'totalSteps' | 'startBlockId' | 'previewUrl' | 'completedAt'>>) => void
  persist: () => void
  startPick: (req: PickRequest) => void
  applyPick: (value: string) => void
  cancelPick: () => void
  undo: () => void
  redo: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scenario: null,
  selectedBlockId: null,
  editorOpenKey: 0,
  pickRequest: null,
  activeBlockId: null,
  undoStack: [],
  redoStack: [],

  setScenario: (scenario) => set({ scenario, selectedBlockId: null }),

  setActiveBlockId: (id) => set({ activeBlockId: id }),

  setSelectedBlockId: (id) => set((s) => ({ selectedBlockId: id, editorOpenKey: id !== null ? s.editorOpenKey + 1 : s.editorOpenKey })),

  undo: () => {
    const { scenario, undoStack, redoStack } = get()
    if (!scenario || undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    const newUndo = undoStack.slice(0, -1)
    const updated = { ...scenario, blocks: prev, startBlockId: getStartBlockId(prev), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: newUndo, redoStack: [scenario.blocks, ...redoStack] })
    saveScenario(updated)
  },

  redo: () => {
    const { scenario, undoStack, redoStack } = get()
    if (!scenario || redoStack.length === 0) return
    const next = redoStack[0]
    const newRedo = redoStack.slice(1)
    const updated = { ...scenario, blocks: next, startBlockId: getStartBlockId(next), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: newRedo })
    saveScenario(updated)
  },

  updateBlock: (block) => {
    const { scenario } = get()
    if (!scenario) return
    const blocks = scenario.blocks.map((b) => (b.id === block.id ? block : b))
    const updated = { ...scenario, blocks, updatedAt: new Date().toISOString() }
    set({ scenario: updated })
    saveScenario(updated)
  },

  addBlock: (block) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const blocks = autoLink([...scenario.blocks, block])
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  insertBlockAt: (block, index) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const arr = [...scenario.blocks]
    arr.splice(index, 0, block)
    const blocks = autoLink(arr)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  addBlocksAt: (newBlocks, index) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const arr = [...scenario.blocks]
    arr.splice(index, 0, ...newBlocks)
    const blocks = autoLink(arr)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  setBranchChild: (branchId, side, block) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const branchIdx = scenario.blocks.findIndex((b) => b.id === branchId)
    if (branchIdx === -1) return
    const arr: Block[] = scenario.blocks.map((b) => {
      if (b.id !== branchId) return b
      const branch = b as BranchBlock
      return side === 'yes' ? { ...branch, yesNextId: block.id } : { ...branch, noNextId: block.id }
    })
    arr.splice(branchIdx + 1, 0, block)
    const blocks = autoLink(arr)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  addBlocksToBranchChain: (branchId, side, newBlocks, index) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const branch = scenario.blocks.find((b) => b.id === branchId) as BranchBlock | undefined
    if (!branch) return

    const startId = side === 'yes' ? branch.yesNextId : branch.noNextId
    const chain = getBranchChain(scenario.blocks, startId)

    // Insert newBlocks at index in chain
    const newChain = [...chain.slice(0, index), ...newBlocks, ...chain.slice(index)]
    // Re-link the chain
    const linkedChain = newChain.map((b, i) => ({
      ...b,
      nextId: i < newChain.length - 1 ? newChain[i + 1].id : null,
    }))

    const newStartId = linkedChain[0]?.id ?? null
    const updatedBranch: BranchBlock = side === 'yes'
      ? { ...branch, yesNextId: newStartId }
      : { ...branch, noNextId: newStartId }

    const chainIdSet = new Set(chain.map((b) => b.id))
    const withoutChain = scenario.blocks
      .filter((b) => !chainIdSet.has(b.id))
      .map((b) => (b.id === branchId ? updatedBranch : b))

    const branchPos = withoutChain.findIndex((b) => b.id === branchId)
    const insertAt = branchPos === -1 ? withoutChain.length : branchPos + 1

    const arr = [
      ...withoutChain.slice(0, insertAt),
      ...linkedChain,
      ...withoutChain.slice(insertAt),
    ]
    const blocks = autoLink(arr)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  reorderBranchChain: (branchId, side, reorderedChain) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const branch = scenario.blocks.find((b) => b.id === branchId) as BranchBlock | undefined
    if (!branch) return

    const startId = side === 'yes' ? branch.yesNextId : branch.noNextId
    const oldChain = getBranchChain(scenario.blocks, startId)
    const chainIdSet = new Set(oldChain.map((b) => b.id))

    const newStartId = reorderedChain[0]?.id ?? null
    const linkedChain = reorderedChain.map((b, i) => ({
      ...b,
      nextId: i < reorderedChain.length - 1 ? reorderedChain[i + 1].id : null,
    }))

    const updatedBranch: BranchBlock = side === 'yes'
      ? { ...branch, yesNextId: newStartId }
      : { ...branch, noNextId: newStartId }

    const withoutChain = scenario.blocks
      .filter((b) => !chainIdSet.has(b.id))
      .map((b) => (b.id === branchId ? updatedBranch : b))

    const branchPos = withoutChain.findIndex((b) => b.id === branchId)
    const insertAt = branchPos === -1 ? withoutChain.length : branchPos + 1

    const arr = [
      ...withoutChain.slice(0, insertAt),
      ...linkedChain,
      ...withoutChain.slice(insertAt),
    ]
    const blocks = autoLink(arr)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  removeBlock: (id) => {
    const { scenario, selectedBlockId, undoStack } = get()
    if (!scenario) return

    const blockToRemove = scenario.blocks.find((b) => b.id === id)

    // 開始・終了ブロックは削除不可
    if (blockToRemove?.type === 'start' || blockToRemove?.type === 'end') return

    // 分岐ブロックの場合は yes/no サブツリーも一括削除
    const subtreeIds = blockToRemove?.type === 'branch'
      ? collectBranchSubtreeIds(scenario.blocks, id)
      : new Set<string>()
    const removeIds = new Set([id, ...Array.from(subtreeIds)])

    const removedNextId = blockToRemove && 'nextId' in blockToRemove
      ? (blockToRemove as { nextId: string | null }).nextId
      : null

    // nextId でこのブロックを指している前のブロック
    const prevInChain = scenario.blocks.find(
      (b) => 'nextId' in b && (b as { nextId: string | null }).nextId === id
    )
    // yesNextId / noNextId でこのブロックを指している branch
    const branchWithDirect = scenario.blocks.find(
      (b) => b.type === 'branch' && (b.yesNextId === id || b.noNextId === id)
    ) as BranchBlock | undefined

    const patchedBlocks = scenario.blocks
      .filter((b) => !removeIds.has(b.id))
      .map((b) => {
        if (prevInChain && b.id === prevInChain.id) {
          return { ...b, nextId: removedNextId } as Block
        }
        if (branchWithDirect && b.id === branchWithDirect.id) {
          const branch = b as BranchBlock
          const updates: Partial<BranchBlock> = {}
          if (branch.yesNextId === id) updates.yesNextId = removedNextId
          if (branch.noNextId === id) updates.noNextId = removedNextId
          return { ...branch, ...updates }
        }
        return b
      })

    const blocks = autoLink(patchedBlocks)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({
      scenario: updated,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
      undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT),
      redoStack: [],
    })
    saveScenario(updated)
  },

  reorderBlocks: (blocks) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const linked = autoLink(blocks)
    const updated = { ...scenario, blocks: linked, startBlockId: getStartBlockId(linked), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  updateScenarioMeta: (meta) => {
    const { scenario } = get()
    if (!scenario) return
    const updated = { ...scenario, ...meta, updatedAt: new Date().toISOString() }
    set({ scenario: updated })
    saveScenario(updated)
  },

  persist: () => {
    const { scenario } = get()
    if (scenario) saveScenario(scenario)
  },

  startPick: (req) => set({ pickRequest: req }),

  applyPick: (value) => {
    const { scenario, pickRequest } = get()
    if (!scenario || !pickRequest) return
    const block = scenario.blocks.find((b) => b.id === pickRequest.blockId)
    if (!block) return
    const updated = { ...block, [pickRequest.field]: value } as Block
    const blocks = scenario.blocks.map((b) => (b.id === updated.id ? updated : b))
    const newScenario = { ...scenario, blocks, updatedAt: new Date().toISOString() }
    set({ scenario: newScenario, pickRequest: null })
    saveScenario(newScenario)
  },

  cancelPick: () => set({ pickRequest: null }),
}))

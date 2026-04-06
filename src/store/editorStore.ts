import { create } from 'zustand'
import { Block, BranchBlock, BranchOption, Scenario } from '@/types/scenario'
import { saveScenario } from '@/lib/scenarioStorage'
import { getBranchChain, getBranchChainIds, collectBranchSubtreeIds } from '@/lib/branchChain'

function autoLink(blocks: Block[]): Block[] {
  const chainIds = getBranchChainIds(blocks)
  const mainBlocks = blocks.filter((b) => !chainIds.has(b.id))

  const branchMergeTarget = new Map<string, string | null>()
  for (let i = 0; i < mainBlocks.length; i++) {
    const b = mainBlocks[i]
    if (b.type === 'branch') {
      branchMergeTarget.set(b.id, mainBlocks[i + 1]?.id ?? null)
    }
  }

  const tailMergeTarget = new Map<string, string | null>()
  for (const b of blocks) {
    if (b.type !== 'branch') continue
    const mergeTarget = branchMergeTarget.get(b.id) ?? null
    for (const opt of b.options) {
      const chain = getBranchChain(blocks, opt.nextId)
      if (chain.length > 0) tailMergeTarget.set(chain[chain.length - 1].id, mergeTarget)
    }
  }

  return blocks.map((b) => {
    if (b.type === 'end') return b

    if (chainIds.has(b.id)) {
      return tailMergeTarget.has(b.id)
        ? { ...b, nextId: tailMergeTarget.get(b.id) ?? null }
        : b
    }

    if (b.type === 'branch') {
      return { ...b, nextId: branchMergeTarget.get(b.id) ?? null }
    }

    const mainIdx = mainBlocks.findIndex((m) => m.id === b.id)
    return { ...b, nextId: mainBlocks[mainIdx + 1]?.id ?? null }
  })
}

function getStartBlockId(blocks: Block[]): string | null {
  return blocks.find((b) => b.type === 'start')?.id ?? null
}

export interface PickRequest {
  blockId: string
  field: string
  withHash: boolean
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
  setBranchChild: (branchId: string, optionId: string, block: Block) => void
  addBlocksToBranchChain: (branchId: string, optionId: string, newBlocks: Block[], index: number) => void
  reorderBranchChain: (branchId: string, optionId: string, reorderedChain: Block[]) => void
  addBranchOption: (branchId: string, option: BranchOption) => void
  removeBranchOption: (branchId: string, optionId: string) => void
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

  setBranchChild: (branchId, optionId, block) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const branchIdx = scenario.blocks.findIndex((b) => b.id === branchId)
    if (branchIdx === -1) return
    const arr: Block[] = scenario.blocks.map((b) => {
      if (b.id !== branchId) return b
      const branch = b as BranchBlock
      return { ...branch, options: branch.options.map(o => o.id === optionId ? { ...o, nextId: block.id } : o) }
    })
    arr.splice(branchIdx + 1, 0, block)
    const blocks = autoLink(arr)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  addBlocksToBranchChain: (branchId, optionId, newBlocks, index) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const branch = scenario.blocks.find((b) => b.id === branchId) as BranchBlock | undefined
    if (!branch) return

    const opt = branch.options.find(o => o.id === optionId)
    if (!opt) return
    const startId = opt.nextId
    const chain = getBranchChain(scenario.blocks, startId)

    const newChain = [...chain.slice(0, index), ...newBlocks, ...chain.slice(index)]
    const linkedChain = newChain.map((b, i) => ({
      ...b,
      nextId: i < newChain.length - 1 ? newChain[i + 1].id : null,
    }))

    const newStartId = linkedChain[0]?.id ?? null
    const updatedBranch: BranchBlock = {
      ...branch,
      options: branch.options.map(o => o.id === optionId ? { ...o, nextId: newStartId } : o),
    }

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

  reorderBranchChain: (branchId, optionId, reorderedChain) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const branch = scenario.blocks.find((b) => b.id === branchId) as BranchBlock | undefined
    if (!branch) return

    const opt = branch.options.find(o => o.id === optionId)
    if (!opt) return
    const startId = opt.nextId
    const oldChain = getBranchChain(scenario.blocks, startId)
    const chainIdSet = new Set(oldChain.map((b) => b.id))

    const newStartId = reorderedChain[0]?.id ?? null
    const linkedChain = reorderedChain.map((b, i) => ({
      ...b,
      nextId: i < reorderedChain.length - 1 ? reorderedChain[i + 1].id : null,
    }))

    const updatedBranch: BranchBlock = {
      ...branch,
      options: branch.options.map(o => o.id === optionId ? { ...o, nextId: newStartId } : o),
    }

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

  addBranchOption: (branchId, option) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const blocks = scenario.blocks.map((b) => {
      if (b.id !== branchId || b.type !== 'branch') return b
      return { ...b, options: [...b.options, option] }
    })
    const updated = { ...scenario, blocks, updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  removeBranchOption: (branchId, optionId) => {
    const { scenario, undoStack } = get()
    if (!scenario) return
    const branch = scenario.blocks.find((b) => b.id === branchId) as BranchBlock | undefined
    if (!branch || branch.options.length <= 2) return

    const opt = branch.options.find(o => o.id === optionId)
    if (!opt) return

    // オプションのチェーンブロックを収集して削除
    const chainBlocks = getBranchChain(scenario.blocks, opt.nextId)
    const removeIds = new Set<string>()
    for (const bl of chainBlocks) {
      removeIds.add(bl.id)
      if (bl.type === 'branch') {
        collectBranchSubtreeIds(scenario.blocks, bl.id).forEach((sid) => removeIds.add(sid))
      }
    }

    const updatedBranch: BranchBlock = { ...branch, options: branch.options.filter(o => o.id !== optionId) }
    const patchedBlocks = scenario.blocks
      .filter((b) => !removeIds.has(b.id))
      .map((b) => b.id === branchId ? updatedBranch : b)

    const blocks = autoLink(patchedBlocks)
    const updated = { ...scenario, blocks, startBlockId: getStartBlockId(blocks), updatedAt: new Date().toISOString() }
    set({ scenario: updated, undoStack: [...undoStack, scenario.blocks].slice(-UNDO_LIMIT), redoStack: [] })
    saveScenario(updated)
  },

  removeBlock: (id) => {
    const { scenario, selectedBlockId, undoStack } = get()
    if (!scenario) return

    const blockToRemove = scenario.blocks.find((b) => b.id === id)
    if (blockToRemove?.type === 'start' || blockToRemove?.type === 'end') return

    const subtreeIds = blockToRemove?.type === 'branch'
      ? collectBranchSubtreeIds(scenario.blocks, id)
      : new Set<string>()
    const removeIds = new Set([id, ...Array.from(subtreeIds)])

    const removedNextId = blockToRemove && 'nextId' in blockToRemove
      ? (blockToRemove as { nextId: string | null }).nextId
      : null

    const prevInChain = scenario.blocks.find(
      (b) => 'nextId' in b && (b as { nextId: string | null }).nextId === id
    )
    // いずれかの option.nextId がこのブロックを指している branch
    const branchWithDirect = scenario.blocks.find(
      (b) => b.type === 'branch' && b.options.some(o => o.nextId === id)
    ) as BranchBlock | undefined

    const patchedBlocks = scenario.blocks
      .filter((b) => !removeIds.has(b.id))
      .map((b) => {
        if (prevInChain && b.id === prevInChain.id) {
          return { ...b, nextId: removedNextId } as Block
        }
        if (branchWithDirect && b.id === branchWithDirect.id) {
          const branch = b as BranchBlock
          return { ...branch, options: branch.options.map(o => o.nextId === id ? { ...o, nextId: removedNextId } : o) }
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

import { create } from 'zustand'
import { Block, Scenario } from '@/types/scenario'
import { saveScenario } from '@/lib/scenarioStorage'

/** ピックモード：どのブロックのどのフィールドを待っているか */
export interface PickRequest {
  blockId: string
  field: string  // 'targetSelector' | 'targetId' など
  withHash: boolean  // true → "#foo" 形式、false → "foo" 形式
}

interface EditorState {
  scenario: Scenario | null
  selectedBlockId: string | null
  pickRequest: PickRequest | null
  setScenario: (scenario: Scenario) => void
  setSelectedBlockId: (id: string | null) => void
  updateBlock: (block: Block) => void
  addBlock: (block: Block) => void
  removeBlock: (id: string) => void
  reorderBlocks: (blocks: Block[]) => void
  updateScenarioMeta: (meta: Partial<Pick<Scenario, 'title' | 'category' | 'totalSteps' | 'startBlockId' | 'previewUrl' | 'completedAt'>>) => void
  persist: () => void
  startPick: (req: PickRequest) => void
  applyPick: (value: string) => void
  cancelPick: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scenario: null,
  selectedBlockId: null,
  pickRequest: null,

  setScenario: (scenario) => set({ scenario, selectedBlockId: null }),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  updateBlock: (block) => {
    const { scenario } = get()
    if (!scenario) return
    const blocks = scenario.blocks.map((b) => (b.id === block.id ? block : b))
    const updated = { ...scenario, blocks, updatedAt: new Date().toISOString() }
    set({ scenario: updated })
    saveScenario(updated)
  },

  addBlock: (block) => {
    const { scenario } = get()
    if (!scenario) return
    const blocks = [...scenario.blocks, block]
    const updated = { ...scenario, blocks, updatedAt: new Date().toISOString() }
    set({ scenario: updated })
    saveScenario(updated)
  },

  removeBlock: (id) => {
    const { scenario, selectedBlockId } = get()
    if (!scenario) return
    const blocks = scenario.blocks.filter((b) => b.id !== id)
    const updated = { ...scenario, blocks, updatedAt: new Date().toISOString() }
    set({
      scenario: updated,
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
    })
    saveScenario(updated)
  },

  reorderBlocks: (blocks) => {
    const { scenario } = get()
    if (!scenario) return
    const updated = { ...scenario, blocks, updatedAt: new Date().toISOString() }
    set({ scenario: updated })
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

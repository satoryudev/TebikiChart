import { Block, BlockType, BranchBlock } from '@/types/scenario'

export function createBlock(type: BlockType): Block {
  const id = `block-${Math.random().toString(36).slice(2, 7)}`
  switch (type) {
    case 'start':
      return { id, type: 'start', nextId: null }
    case 'end':
      return { id, type: 'end' }
    case 'speech':
      return { id, type: 'speech', message: '', characterMood: 'normal', nextId: null }
    case 'spotlight':
      return { id, type: 'spotlight', message: '', targetSelector: '', targetLabel: '', nextId: null }
    case 'input-spotlight':
      return { id, type: 'input-spotlight', message: '', targetId: '', targetLabel: '', nextId: null }
    case 'branch':
      return { id, type: 'branch', question: '', nextId: null, options: [
        { id: 'yes', label: 'はい', color: 'green', nextId: null },
        { id: 'no',  label: 'いいえ', color: 'red',   nextId: null },
      ] }
  }
}

/** 条件分岐ブロックを生成する（分岐先は空） */
export function createBranchGroup(): [BranchBlock] {
  const branchId = `block-${Math.random().toString(36).slice(2, 7)}`
  return [
    { id: branchId, type: 'branch', question: '', nextId: null, options: [
      { id: 'yes', label: 'はい', color: 'green', nextId: null },
      { id: 'no',  label: 'いいえ', color: 'red',   nextId: null },
    ] },
  ]
}

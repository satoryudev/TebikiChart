import { Block, BlockType, BranchBlock, SpeechBlock } from '@/types/scenario'

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

/** 条件分岐ブロックをドロップした際に yes/no の子ブロックを含めて3つまとめて生成する */
export function createBranchGroup(): [BranchBlock, SpeechBlock, SpeechBlock] {
  const branchId = `block-${Math.random().toString(36).slice(2, 7)}`
  const yesId    = `block-${Math.random().toString(36).slice(2, 7)}`
  const noId     = `block-${Math.random().toString(36).slice(2, 7)}`
  return [
    { id: branchId, type: 'branch', question: '', nextId: null, options: [
      { id: 'yes', label: 'はい', color: 'green', nextId: yesId },
      { id: 'no',  label: 'いいえ', color: 'red',   nextId: noId },
    ] },
    { id: yesId,    type: 'speech',  message: '', characterMood: 'normal', nextId: null },
    { id: noId,     type: 'speech',  message: '', characterMood: 'normal', nextId: null },
  ]
}

import { Block, BranchBlock } from '@/types/scenario'

/** branch.nextId（合流先）の ID セットを収集する */
function getMergeTargetIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>()
  for (const b of blocks) {
    if (b.type === 'branch' && b.nextId) ids.add(b.nextId)
  }
  return ids
}

/**
 * startId から nextId チェーンを辿って Block の配列を返す。
 * branch.nextId（合流先）に達したら停止し、合流先自体はリストに含めない。
 */
export function getBranchChain(blocks: Block[], startId: string | null): Block[] {
  const mergeTargetIds = getMergeTargetIds(blocks)
  const result: Block[] = []
  let currentId = startId
  const visited = new Set<string>()
  while (currentId) {
    if (visited.has(currentId)) break
    if (mergeTargetIds.has(currentId)) break
    visited.add(currentId)
    const block = blocks.find((b) => b.id === currentId)
    if (!block) break
    result.push(block)
    currentId = block.type !== 'branch' && block.type !== 'end'
      ? (block as { nextId: string | null }).nextId
      : null
  }
  return result
}

/**
 * 指定した branch ブロックの全オプションチェーン（ネスト含む）に属する
 * すべてのブロック ID を再帰的に収集する。branch 自身は含まない。
 */
export function collectBranchSubtreeIds(blocks: Block[], branchId: string): Set<string> {
  const result = new Set<string>()
  const queue: string[] = [branchId]
  while (queue.length > 0) {
    const id = queue.pop()!
    const b = blocks.find((bl) => bl.id === id)
    if (!b || b.type !== 'branch') continue
    const branch = b as BranchBlock
    for (const opt of branch.options) {
      for (const bl of getBranchChain(blocks, opt.nextId)) {
        if (!result.has(bl.id)) {
          result.add(bl.id)
          if (bl.type === 'branch') queue.push(bl.id)
        }
      }
    }
  }
  return result
}

/**
 * blockId がどの分岐チェーンに属するかを表すスタック（外→内の順）を返す。
 * メインチェーンのブロックなら空配列。
 */
export function findBranchStackForBlock(
  blocks: Block[],
  blockId: string,
): Array<{ branchId: string; side: string }> {
  for (const block of blocks) {
    if (block.type !== 'branch') continue
    for (const opt of block.options) {
      if (getBranchChain(blocks, opt.nextId).some((b) => b.id === blockId)) {
        return [...findBranchStackForBlock(blocks, block.id), { branchId: block.id, side: opt.id }]
      }
    }
  }
  return []
}

/** すべての branch の全オプションチェーンに含まれるブロック ID を返す */
export function getBranchChainIds(blocks: Block[]): Set<string> {
  const ids = new Set<string>()
  for (const b of blocks) {
    if (b.type === 'branch') {
      for (const opt of b.options) {
        for (const child of getBranchChain(blocks, opt.nextId)) ids.add(child.id)
      }
    }
  }
  return ids
}

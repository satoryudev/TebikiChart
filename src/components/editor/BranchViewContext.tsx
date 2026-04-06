'use client'

import { createContext, useCallback, useContext, useState } from 'react'

export interface BranchView {
  branchId: string
  side: string  // option id ('yes', 'no', or custom)
}

interface BranchViewContextValue {
  branchStack: BranchView[]
  currentBranchView: BranchView | null
  pushBranchView: (view: BranchView) => void
  popBranchView: () => void
  resetBranchView: () => void
  truncateBranchStack: (depth: number) => void
  /** 後方互換シム: null→reset、非null→スタッククリアして push */
  setBranchView: (view: BranchView | null) => void
}

export const BranchViewContext = createContext<BranchViewContextValue>({
  branchStack: [],
  currentBranchView: null,
  pushBranchView: () => {},
  popBranchView: () => {},
  resetBranchView: () => {},
  truncateBranchStack: () => {},
  setBranchView: () => {},
})

export function useBranchView() {
  return useContext(BranchViewContext)
}

export function BranchViewProvider({ children }: { children: React.ReactNode }) {
  const [branchStack, setBranchStack] = useState<BranchView[]>([])

  const currentBranchView = branchStack.at(-1) ?? null

  const pushBranchView = useCallback((view: BranchView) =>
    setBranchStack((prev) => [...prev, view]), [])

  const popBranchView = useCallback(() =>
    setBranchStack((prev) => prev.slice(0, -1)), [])

  const resetBranchView = useCallback(() => setBranchStack([]), [])

  const truncateBranchStack = useCallback((depth: number) =>
    setBranchStack((prev) => prev.slice(0, depth)), [])

  const setBranchView = useCallback((view: BranchView | null) => {
    if (view === null) setBranchStack([])
    else setBranchStack([view])
  }, [])

  return (
    <BranchViewContext.Provider value={{
      branchStack,
      currentBranchView,
      pushBranchView,
      popBranchView,
      resetBranchView,
      truncateBranchStack,
      setBranchView,
    }}>
      {children}
    </BranchViewContext.Provider>
  )
}

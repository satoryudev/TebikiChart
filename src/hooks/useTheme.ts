'use client'

import { useEffect, useState } from 'react'

export function useTheme() {
  // DOMの実際の状態を正とする（inline scriptで設定済みの値を反映）
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = (originX?: number, originY?: number) => {
    const next = !document.documentElement.classList.contains('dark')

    if (originX !== undefined && originY !== undefined) {
      document.documentElement.style.setProperty('--theme-toggle-x', `${originX}px`)
      document.documentElement.style.setProperty('--theme-toggle-y', `${originY}px`)
    }

    const apply = () => {
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
      setIsDark(next)
    }

    if (!('startViewTransition' in document)) {
      apply()
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(document as any).startViewTransition(apply)
  }

  return { isDark, toggle }
}

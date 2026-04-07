'use client'

import { useTheme } from '@/hooks/useTheme'

interface Props {
  className?: string
}

export default function ThemeToggle({ className = '' }: Props) {
  const { isDark, toggle } = useTheme()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    toggle(rect.left + rect.width / 2, rect.top + rect.height / 2)
  }

  return (
    <button
      onClick={handleClick}
      title={isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
      className={`text-base leading-none ${className}`}
    >
      <span key={String(isDark)} className="inline-block animate-theme-icon">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  )
}

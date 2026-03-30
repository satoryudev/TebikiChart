'use client'

interface Props {
  onResize: (delta: number) => void
  onDragStart?: () => void
}

export default function ResizeDivider({ onResize, onDragStart }: Props) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onDragStart?.()   // startWidth をここで一度だけ記録させる
    const startX = e.clientX

    const onMove = (me: MouseEvent) => {
      onResize(me.clientX - startX)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-1 flex-shrink-0 bg-gray-200 hover:bg-blue-400 active:bg-blue-500
        cursor-col-resize transition-colors group relative"
    >
      {/* 掴みやすくするための透明な当たり判定拡張 */}
      <div className="absolute inset-y-0 -inset-x-1" />
    </div>
  )
}

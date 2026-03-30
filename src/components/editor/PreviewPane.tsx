'use client'

import { forwardRef } from 'react'

interface Props {
  isPlaying: boolean
  previewUrl?: string
}

const DEFAULT_PREVIEW = '/demo.html'

const PreviewPane = forwardRef<HTMLIFrameElement, Props>(({ isPlaying, previewUrl }, ref) => {
  const base = previewUrl?.trim() || DEFAULT_PREVIEW
  // ?preview=1 を付与（既にクエリがある場合は & で追加）
  const src = base.includes('?') ? `${base}&preview=1` : `${base}?preview=1`

  return (
    <div id="preview-pane" className="flex flex-col h-full w-full bg-white">
      {/* ステータスバッジ */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <span className="text-xs text-gray-400 truncate" title={base}>
          {base === DEFAULT_PREVIEW ? '/demo.html' : base}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
          isPlaying ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {isPlaying ? '▶ 実行中' : '⏸ 待機中'}
        </span>
      </div>
      <iframe ref={ref} src={src} className="flex-1 w-full border-none" title="プレビュー" />
    </div>
  )
})

PreviewPane.displayName = 'PreviewPane'
export default PreviewPane

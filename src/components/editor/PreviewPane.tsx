'use client'

import { forwardRef } from 'react'

interface Props {
  isPlaying: boolean
  previewUrl?: string
  onPlay: () => void
  onStop: () => void
}

const DEFAULT_PREVIEW = '/demo.html'

const PreviewPane = forwardRef<HTMLIFrameElement, Props>(({ isPlaying, previewUrl, onPlay, onStop }, ref) => {
  const base = previewUrl?.trim() || DEFAULT_PREVIEW
  const src = base.includes('?') ? `${base}&preview=1` : `${base}?preview=1`

  return (
    <div id="preview-pane" className="flex flex-col h-full w-full bg-white">
      {/* ヘッダー：URL + 実行/停止 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <span className="text-xs text-gray-400 truncate flex-1" title={base}>
          {base === DEFAULT_PREVIEW ? '/demo.html' : base}
        </span>
        <button
          onClick={onPlay}
          disabled={isPlaying}
          className="text-xs px-3 py-1 rounded font-semibold bg-green-500 text-white
            hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ▶ 実行
        </button>
        <button
          onClick={onStop}
          disabled={!isPlaying}
          className="text-xs px-3 py-1 rounded font-semibold bg-gray-400 text-white
            hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ■ 停止
        </button>
      </div>
      <iframe ref={ref} src={src} className="flex-1 w-full border-none" title="プレビュー" />
    </div>
  )
})

PreviewPane.displayName = 'PreviewPane'
export default PreviewPane

'use client'

import { useEditorStore } from '@/store/editorStore'
import { Block } from '@/types/scenario'

const TYPE_EMOJI: Record<Block['type'], string> = {
  speech: '💬', spotlight: '🔦', 'input-spotlight': '✏️',
  'document-preview': '📄', validation: '✅', branch: '🔀',
}
function blockLabel(b: Block): string {
  const e = TYPE_EMOJI[b.type]
  switch (b.type) {
    case 'speech': return `${e} ${b.message.slice(0, 18)}`
    case 'branch': return `${e} ${b.question.slice(0, 18)}`
    default: return `${e} ${(b as { targetLabel: string }).targetLabel}`
  }
}

interface Props {
  onExportCallback?: () => void
}

export default function PreviewToolbar({ onExportCallback }: Props) {
  const { scenario, updateScenarioMeta } = useEditorStore()

  const handleExport = () => {
    if (!scenario) return
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: `${scenario.id}.json` }).click()
    URL.revokeObjectURL(url)
    updateScenarioMeta({ completedAt: new Date().toISOString() })
    onExportCallback?.()
  }

  return (
    <div id="preview-toolbar" className="bg-white border-b border-gray-200 flex-shrink-0 px-3 py-1.5 space-y-1.5">
      {/* 行1: 開始ブロック / 総ステップ / 実行・停止 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-shrink-0">
          <label className="text-xs text-gray-500 whitespace-nowrap">開始:</label>
          <select
            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white max-w-[130px]"
            value={scenario?.startBlockId ?? ''}
            onChange={(e) => updateScenarioMeta({ startBlockId: e.target.value || null })}
          >
            <option value="">（未設定）</option>
            {scenario?.blocks.map((b) => (
              <option key={b.id} value={b.id}>{blockLabel(b)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <label className="text-xs text-gray-500 whitespace-nowrap">Steps:</label>
          <input
            type="number" min={1}
            className="text-xs border border-gray-200 rounded px-1.5 py-1 w-14 bg-white"
            placeholder={String(scenario?.blocks.length ?? 0)}
            value={scenario?.totalSteps ?? ''}
            onChange={(e) => updateScenarioMeta({ totalSteps: e.target.value ? parseInt(e.target.value) : undefined })}
          />
        </div>

      </div>

      {/* 行2: 対象HTML / JSON書き出し */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">対象HTML:</label>
        <input
          type="text"
          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white flex-1 min-w-0"
          placeholder="/demo.html（省略可）"
          value={scenario?.previewUrl ?? ''}
          onChange={(e) => updateScenarioMeta({ previewUrl: e.target.value || undefined })}
        />
        <button
          onClick={handleExport}
          className="text-xs px-2.5 py-1.5 rounded border border-gray-300 text-gray-600
            hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
        >↓ JSON</button>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/store/editorStore'
import { saveScenario } from '@/lib/scenarioStorage'
import { Scenario } from '@/types/scenario'

// 重複注入を検知するためのマーカー
const MARKER_START = '<!-- TebikiChart Tutorial Start -->'
const MARKER_END = '<!-- TebikiChart Tutorial End -->'

async function fetchEmbedJs(): Promise<string> {
  const res = await fetch('/embed.js')
  return res.text()
}

function buildEmbedBlock(embedJs: string, scenarioJson: string): string {
  return [
    MARKER_START,
    '<script>',
    embedJs,
    '<\/script>',
    '<script>',
    `TebikiChart.startWithPrompt(${scenarioJson});`,
    '<\/script>',
    MARKER_END,
  ].join('\n')
}

function downloadBlob(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}

/** showSaveFilePicker 対応ブラウザはダイアログ経由で保存、非対応はBlobダウンロード */
async function saveHtml(content: string, suggestedName: string): Promise<void> {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handle = await (window as any).showSaveFilePicker({
      suggestedName,
      types: [{ description: 'HTMLファイル', accept: { 'text/html': ['.html', '.htm'] } }],
    })
    const writable = await handle.createWritable()
    await writable.write(new Blob([content], { type: 'text/html' }))
    await writable.close()
  } else {
    downloadBlob(content, suggestedName)
  }
}

/** HTML 文字列にチュートリアルブロックを注入して返す */
function injectBlock(content: string, block: string): string {
  const markerStartEsc = MARKER_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const markerEndEsc   = MARKER_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const existingRegex  = new RegExp(`${markerStartEsc}[\\s\\S]*?${markerEndEsc}`)

  if (existingRegex.test(content)) {
    // 既存マーカーを置き換え（() => block で $ の特殊解釈を回避）
    return content.replace(existingRegex, () => block)
  }
  if (/<\/body>/i.test(content)) {
    return content.replace(/<\/body>/i, () => `${block}\n</body>`)
  }
  // </body> がない場合は末尾に追記
  return content + '\n' + block
}

interface Props {
  onExportCallback?: () => void
  tourActive?: boolean
}

export default function PreviewToolbar({ onExportCallback, tourActive }: Props) {
  const { scenario, setScenario } = useEditorStore()
  const router = useRouter()

  const [embedModalOpen, setEmbedModalOpen] = useState(false)
  const [embedCode, setEmbedCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const fallbackFileRef = useRef<HTMLInputElement>(null)
  const jsonImportRef = useRef<HTMLInputElement>(null)

  // ---- JSON ダウンロード ----
  const handleJsonExport = () => {
    if (!scenario) return
    const blob = new Blob([JSON.stringify(scenario, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: `${scenario.id}.json` }).click()
    URL.revokeObjectURL(url)
    onExportCallback?.()
  }

  // ---- JSON インポート ----
  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text) as Scenario
      if (!data.id || !Array.isArray(data.blocks)) {
        alert('有効なシナリオJSONではありません。')
        return
      }
      saveScenario(data)
      setScenario(data)
      // チュートリアル中はページ遷移しない（ナビゲートするとツアーが step 1 からリスタートするため）
      if (!tourActive) {
        router.push(`/editor/${data.id}`)
      }
    } catch {
      alert('JSONの読み込みに失敗しました。')
    }
  }

  // ---- 埋め込みコード モーダルを開く ----
  const handleOpenEmbedModal = async () => {
    if (!scenario) return
    const embedJs = await fetchEmbedJs()
    const json = JSON.stringify(scenario, null, 2)
    setEmbedCode(buildEmbedBlock(embedJs, json))
    setEmbedModalOpen(true)
    onExportCallback?.()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ---- HTMLファイルへの書き出し ----
  const handleExportHtml = async () => {
    if (!scenario) return
    setExporting(true)
    try {
      const embedJs = await fetchEmbedJs()
      const json = JSON.stringify(scenario, null, 2)
      const block = buildEmbedBlock(embedJs, json)

      if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
        // ファイル選択（読み込みのみ）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'HTMLファイル', accept: { 'text/html': ['.html', '.htm'] } }],
        })
        const file = await fileHandle.getFile()
        const content = injectBlock(await file.text(), block)
        const suggestedName = file.name.replace(/\.html?$/i, '') + '-tutorial.html'
        await saveHtml(content, suggestedName)
        onExportCallback?.()
      } else {
        fallbackFileRef.current?.click()
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') {
        console.error('[ExportHTML]', e)
        alert('書き出しに失敗しました。')
      }
    } finally {
      setExporting(false)
    }
  }

  // フォールバック用：ファイルを選択 → 修正版をダウンロード
  const handleFallbackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !scenario) return
    e.target.value = ''

    const embedJs = await fetchEmbedJs()
    const json = JSON.stringify(scenario, null, 2)
    const block = buildEmbedBlock(embedJs, json)
    const content = injectBlock(await file.text(), block)
    const suggestedName = file.name.replace(/\.html?$/i, '') + '-tutorial.html'
    await saveHtml(content, suggestedName)
    onExportCallback?.()
  }

  return (
    <>
      <div id="preview-toolbar" className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 px-3 py-1.5">
        {/* 隠しファイル入力（フォールバック用） */}
        <input
          ref={fallbackFileRef}
          type="file"
          accept=".html,.htm"
          className="hidden"
          onChange={handleFallbackFile}
        />
        <input
          ref={jsonImportRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleJsonImport}
        />

        {/* 1段：エクスポート操作 */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenEmbedModal}
            className="text-xs px-2.5 py-1.5 rounded border border-blue-300 dark:border-blue-600 text-blue-600 dark:text-blue-400
              hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
          >
            📋 埋め込みコード
          </button>
          <button
            onClick={handleExportHtml}
            disabled={exporting}
            className="text-xs px-2.5 py-1.5 rounded border border-emerald-400 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400
              hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            {exporting ? '書き出し中…' : '💾 HTMLに書き出し'}
          </button>
          <button
            onClick={handleJsonExport}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            保存
          </button>
          <button
            onClick={() => jsonImportRef.current?.click()}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400
              hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            インポート
          </button>
        </div>
      </div>

      {/* 埋め込みコード モーダル */}
      {embedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setEmbedModalOpen(false) }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col"
            style={{ width: 'min(680px, 95vw)', maxHeight: '85vh' }}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">埋め込みコード</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  以下のコードを対象HTMLの <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">&lt;/body&gt;</code> 直前に貼り付けてください
                </p>
              </div>
              <button
                onClick={() => setEmbedModalOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>

            {/* コード表示 */}
            <div className="flex-1 overflow-hidden p-5">
              <textarea
                readOnly
                value={embedCode}
                className="w-full h-full font-mono text-[11px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600
                  rounded-lg p-3 resize-none focus:outline-none text-gray-700 dark:text-gray-300"
                style={{ minHeight: '240px' }}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>

            {/* フッター */}
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                クリックで全選択 / コピーボタンでクリップボードにコピー
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`text-xs px-4 py-1.5 rounded font-semibold transition-colors ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '✓ コピー済み' : '📋 コピー'}
                </button>
                <button
                  onClick={() => setEmbedModalOpen(false)}
                  className="text-xs px-4 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

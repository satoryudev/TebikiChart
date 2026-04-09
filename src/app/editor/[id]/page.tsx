'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEditorStore } from '@/store/editorStore'
import { loadScenario } from '@/lib/scenarioStorage'
import { savePreviewData, loadPreviewData } from '@/lib/previewStorage'
import BlockPalette from '@/components/editor/BlockPalette'
import Canvas from '@/components/editor/Canvas'
import BlockEditor from '@/components/editor/BlockEditor'
import PreviewPane from '@/components/editor/PreviewPane'
import PreviewToolbar from '@/components/editor/PreviewToolbar'
import ResizeDivider from '@/components/editor/ResizeDivider'
import EditorDndProvider from '@/components/editor/EditorDndProvider'
import { BranchViewProvider, useBranchView } from '@/components/editor/BranchViewContext'
import BranchCanvas from '@/components/editor/BranchCanvas'
import { useOnboarding } from '@/hooks/useOnboarding'
import EditorTour from '@/components/onboarding/EditorTour'
import { getScenarioStatus, ScenarioStatus } from '@/lib/scenarioUtils'
import { Scenario } from '@/types/scenario'
import { findBranchStackForBlock } from '@/lib/branchChain'
import ValidationBadge from '@/components/editor/ValidationBadge'
import ValidationDialog from '@/components/editor/ValidationDialog'
import { validateScenario, ValidationIssue } from '@/lib/scenarioValidation'
import ThemeToggle from '@/components/ThemeToggle'

const PANEL_MIN = 160
const COLLAPSED_W = 32
const CANVAS_MIN = 320  // canvas の min-w-[320px] と一致（ツールバー3ボタンが見切れない最小幅）
const DIVIDERS_W = 12   // 3本 × 4px

interface PanelWidths { palette: number; canvas: number; preview: number; blockEditor: number }
interface Collapsed { palette: boolean; preview: boolean; blockEditor: boolean }

/** パネルのヘッダーバー（タイトル + 最小化ボタン） */
function PanelHeader({
  title, collapsed, onToggle,
}: { title: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-gray-800 border-b border-slate-200/70 dark:border-gray-700 flex-shrink-0">
      {!collapsed && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>}
      <button
        onClick={onToggle}
        className="ml-auto text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-5 h-5
          flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold"
        title={collapsed ? '展開' : '最小化'}
      >
        {collapsed ? '▶' : '×'}
      </button>
    </div>
  )
}

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; cls: string }> = {
  not_started: { label: '未開始',  cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  in_progress:  { label: '作成中',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  completed:    { label: '完了 ✓', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
}

function StatusBadge({ scenario }: { scenario: Scenario }) {
  const status = getScenarioStatus(scenario)
  const { label, cls } = STATUS_CONFIG[status]
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}


/** 最小化時に縦書きで表示するタブ */
function CollapsedTab({ title, onExpand }: { title: string; onExpand: () => void }) {
  return (
    <div
      onClick={onExpand}
      className="flex flex-col items-center justify-center h-full cursor-pointer
        bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-2 border-r border-gray-200 dark:border-gray-700"
      style={{ width: COLLAPSED_W }}
    >
      <span className="text-gray-400 dark:text-gray-500 text-xs font-bold">▶</span>
      <span
        className="text-gray-500 dark:text-gray-400 text-xs font-semibold tracking-widest"
        style={{ writingMode: 'vertical-rl' }}
      >{title}</span>
    </div>
  )
}

/** ブランチビューとメインキャンバスを切り替えるパネルコンテンツ */
function CanvasPanelContent({ onExportCallback }: { onExportCallback: () => void }) {
  const { currentBranchView, setBranchView, resetBranchView } = useBranchView()
  const { activeBlockId } = useEditorStore()

  // activeBlockId が変わったらブランチビューを自動切り替えしてスクロール
  useEffect(() => {
    if (!activeBlockId) return
    const blocks = useEditorStore.getState().scenario?.blocks ?? []
    const stack = findBranchStackForBlock(blocks, activeBlockId)
    if (stack.length === 0) {
      resetBranchView()
    } else {
      setBranchView(stack[stack.length - 1])
    }
    requestAnimationFrame(() => {
      document.querySelector(`[data-block-id="${activeBlockId}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBlockId, resetBranchView, setBranchView])

  if (currentBranchView) return <BranchCanvas />
  return (
    <>
      <PreviewToolbar onExportCallback={onExportCallback} />
      <Canvas />
    </>
  )
}

export default function EditorPage() {
  const params = useParams()
  const id = params.id as string
  const { scenario, setScenario, updateScenarioMeta, pickRequest, applyPick, cancelPick, selectedBlockId, setSelectedBlockId, editorOpenKey, setActiveBlockId, undo, redo } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const localBlobRef = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([])
  const [titleEditing, setTitleEditing] = useState(false)
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const { tourCompleted, completeTour } = useOnboarding()
  const [tourActive, setTourActive] = useState(false)

  const [widths, setWidths] = useState<PanelWidths>({ palette: 220, canvas: 340, preview: 420, blockEditor: 260 })
  const [collapsed, setCollapsed] = useState<Collapsed>({ palette: false, preview: false, blockEditor: true })

  // mousedown 時に一度だけ記録する startWidth refs
  const paletteStartRef = useRef(widths.palette)
  const previewStartRef = useRef(widths.preview)
  const blockEditorStartRef = useRef(widths.blockEditor)

  // コンテナ幅とパネル幅の最新値を常に参照できるよう ref で保持（上限制約計算に使用）
  const containerRef = useRef<HTMLDivElement>(null)
  const paletteWRef = useRef(0)
  const previewWRef = useRef(0)
  const blockEditorWRef = useRef(0)
  const blockEditorPanelRef = useRef<HTMLDivElement>(null)
  // ブロック設定を開く直前のプレビュー幅を保存（閉じたとき復元するため）
  const previewWidthBeforeBlockEditorRef = useRef<number | null>(null)

  const toggleCollapse = (panel: keyof Collapsed) => {
    // 展開するとき、隣のパネルのstartRefを更新
    setCollapsed((c) => ({ ...c, [panel]: !c[panel] }))
  }

  // ブロック設定を閉じる：プレビューが開いていれば開く前の幅に復元、閉じていればキャンバスが広がる
  const closeBlockEditor = useCallback(() => {
    if (!collapsed.preview) {
      const savedWidth = previewWidthBeforeBlockEditorRef.current
      setWidths((w) => ({ ...w, preview: savedWidth ?? w.preview + w.blockEditor }))
      previewWidthBeforeBlockEditorRef.current = null
    }
    setCollapsed((c) => ({ ...c, blockEditor: true }))
  }, [collapsed.preview])

  useEffect(() => {
    const s = loadScenario(id)
    if (s) setScenario(s)

    // 前回このシナリオで開いていたファイルを復元
    const saved = loadPreviewData(id)
    if (saved) {
      const restoreBlob = async () => {
        let injectedHtml: string
        if ('html' in saved) {
          // window キャッシュ: 注入済みのためそのまま使用
          injectedHtml = saved.html
        } else {
          // localStorage: 元 HTML に embed.js を再注入
          const embedJs = await fetch('/embed.js').then((r) => r.text())
          const injection = `\n<script>\n${embedJs}\n<\/script>`
          injectedHtml = /<\/body>/i.test(saved.originalHtml)
            ? saved.originalHtml.replace(/<\/body>/i, `${injection}\n</body>`)
            : saved.originalHtml + injection
        }
        if (localBlobRef.current) URL.revokeObjectURL(localBlobRef.current)
        const blob = new Blob([injectedHtml], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        localBlobRef.current = url
        setLocalBlobUrl(url)
        setLocalFileName(saved.fileName)
      }
      restoreBlob()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, setScenario])

  // Ctrl+Z / Cmd+Z → undo、Ctrl+Shift+Z / Cmd+Shift+Z → redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          redo()
        } else {
          undo()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

  useEffect(() => {
    if (tourCompleted) return
    const t = setTimeout(() => setTourActive(true), 500)
    return () => clearTimeout(t)
  }, [tourCompleted])

  // ⋮ ボタンでブロックが選択されたらブロック設定パネルを展開する
  useEffect(() => {
    if (!selectedBlockId) return
    // ブロック設定が閉じていた場合のみ開く前のプレビュー幅を保存
    if (collapsed.blockEditor && !collapsed.preview) {
      previewWidthBeforeBlockEditorRef.current = previewWRef.current
    }
    setCollapsed((c) => ({ ...c, blockEditor: false }))
    // プレビューが広すぎてブロック設定が隠れる場合は縮小する
    const containerW = containerRef.current?.clientWidth ?? 0
    const maxPreview = containerW - paletteWRef.current - widths.blockEditor - CANVAS_MIN - DIVIDERS_W
    if (previewWRef.current > maxPreview) {
      setWidths((w) => ({ ...w, preview: Math.max(PANEL_MIN, maxPreview) }))
    }
  }, [editorOpenKey])

  // ブロック設定パネル外クリックで閉じる
  useEffect(() => {
    if (collapsed.blockEditor) return
    const handleClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[title="ブロック設定を開く"]')) return
      // ブロックアイテムをクリックした場合はパネルを閉じない（別ブロックへの切り替えを優先）
      if ((e.target as HTMLElement).closest('[data-block-id]')) return
      // composedPath を使うことで、クリック後に DOM から削除された要素（選択肢の×ボタン等）でも正しく判定できる
      const path = e.composedPath()
      if (blockEditorPanelRef.current && !path.includes(blockEditorPanelRef.current)) {
        closeBlockEditor()
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [collapsed.blockEditor, closeBlockEditor])

  useEffect(() => {
    if (!pickRequest) return
    iframeRef.current?.contentWindow?.postMessage({ type: 'TEBIKI_CHART_PICK_START' }, '*')
  }, [pickRequest])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TEBIKI_CHART_FINISHED') {
        setIsPlaying(false)
        setActiveBlockId(null)
        return
      }
      if (e.data?.type === 'TEBIKI_CHART_BLOCK_ACTIVE') {
        setActiveBlockId(e.data.blockId ?? null)
        return
      }
      if (e.data?.type !== 'TEBIKI_CHART_ELEMENT_PICKED') return
      const { selector, id: elemId } = e.data as { selector: string; id: string }
      if (!pickRequest) return
      applyPick(pickRequest.withHash ? selector : elemId)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [pickRequest, applyPick])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pickRequest) {
        iframeRef.current?.contentWindow?.postMessage({ type: 'TEBIKI_CHART_PICK_CANCEL' }, '*')
        cancelPick()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pickRequest, cancelPick])

  if (!scenario) {
    return <div className="flex items-center justify-center h-screen text-gray-400">シナリオが見つかりません。</div>
  }

  const handleLocalFileSelect = async (file: File) => {
    const html = await file.text()
    const embedJs = await fetch('/embed.js').then((r) => r.text())
    const injection = `\n<script>\n${embedJs}\n<\/script>`
    const modified = /<\/body>/i.test(html)
      ? html.replace(/<\/body>/i, `${injection}\n</body>`)
      : html + injection
    if (localBlobRef.current) URL.revokeObjectURL(localBlobRef.current)
    const blob = new Blob([modified], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    localBlobRef.current = url
    setLocalBlobUrl(url)
    setLocalFileName(file.name)
    savePreviewData(id, { fileName: file.name, html: modified, originalHtml: html })
  }

  const getPreviewSrc = () => {
    if (localBlobUrl) return localBlobUrl
    const base = scenario?.previewUrl?.trim() || '/demo.html'
    return base.includes('?') ? `${base}&preview=1` : `${base}?preview=1`
  }

  const handlePlay = () => {
    const blocks = scenario?.blocks ?? []
    const issues = validateScenario(blocks)
    if (issues.length > 0) {
      setValidationIssues(issues)
      return
    }
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.src = getPreviewSrc()
    iframe.onload = () => {
      iframe.onload = null
      iframe.contentWindow?.postMessage({ type: 'TEBIKI_CHART_START', scenario }, '*')
      setIsPlaying(true)
    }
  }

  const handleStop = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.src = getPreviewSrc()
    setIsPlaying(false)
    setActiveBlockId(null)
  }

  const paletteW = collapsed.palette ? COLLAPSED_W : widths.palette
  const previewW = collapsed.preview ? COLLAPSED_W : widths.preview
  const blockEditorW = collapsed.blockEditor ? 0 : widths.blockEditor

  // レンダーのたびに最新値を ref に反映（リサイズ上限計算で使用）
  paletteWRef.current = paletteW
  previewWRef.current = previewW
  blockEditorWRef.current = blockEditorW

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-gray-900">
      {validationIssues.length > 0 && (
        <ValidationDialog
          issues={validationIssues}
          onClose={() => setValidationIssues([])}
          onJumpToBlock={(blockId) => setSelectedBlockId(blockId)}
        />
      )}
      {/* Top header — breadcrumb style */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 min-h-[48px]">
        {/* Left: breadcrumb + title */}
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <Link href="/" className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 flex-shrink-0 text-xs">
            ← ダッシュボード
          </Link>
          <span className="text-gray-300 dark:text-gray-600 flex-shrink-0">/</span>
          {titleEditing ? (
            <input
              autoFocus
              className="font-semibold text-sm border border-blue-400 rounded px-2 py-0.5 min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={scenario.title}
              onChange={(e) => updateScenarioMeta({ title: e.target.value })}
              onBlur={() => setTitleEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setTitleEditing(false)}
            />
          ) : (
            <button
              onClick={() => setTitleEditing(true)}
              className="font-semibold text-sm text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[200px]"
            >
              {scenario.title}
            </button>
          )}
        </div>

        {/* Right: status badge + validation + theme toggle */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <ValidationBadge />
          <StatusBadge scenario={scenario} />
          <ThemeToggle className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700" />
        </div>
      </header>

      {/* Main 4-panel layout */}
      <BranchViewProvider>
      <EditorDndProvider>
      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* ── パレット ── */}
        {collapsed.palette ? (
          <CollapsedTab title="ブロック" onExpand={() => toggleCollapse('palette')} />
        ) : (
          <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: paletteW }}>
            <PanelHeader title="ブロック" collapsed={false} onToggle={() => toggleCollapse('palette')} />
            <div className="flex-1 overflow-y-auto">
              <BlockPalette />
            </div>
          </div>
        )}

        <ResizeDivider
          onDragStart={() => { paletteStartRef.current = widths.palette }}
          onResize={(delta) => {
            if (collapsed.palette) return
            const containerW = containerRef.current?.clientWidth ?? 0
            const maxPalette = containerW - previewWRef.current - blockEditorWRef.current - CANVAS_MIN - DIVIDERS_W
            setWidths((w) => ({ ...w, palette: Math.max(PANEL_MIN, Math.min(maxPalette, paletteStartRef.current + delta)) }))
          }}
        />

        {/* ── キャンバスエリア（キャンバス + ブロック設定）── */}
        <div className="flex flex-row flex-1 overflow-hidden">

          {/* キャンバス本体 */}
          <div className="flex flex-col flex-1 min-w-[320px] overflow-hidden">
            <CanvasPanelContent onExportCallback={() => {}} />
          </div>

          {/* 内部 ResizeDivider（キャンバス ↔ ブロック設定）*/}
          {!collapsed.blockEditor && (
            <ResizeDivider
              onDragStart={() => { blockEditorStartRef.current = widths.blockEditor }}
              onResize={(delta) => {
                const containerW = containerRef.current?.clientWidth ?? 0
                const maxBlockEditor = containerW - paletteWRef.current - previewWRef.current - CANVAS_MIN - DIVIDERS_W
                setWidths((w) => ({ ...w, blockEditor: Math.max(PANEL_MIN, Math.min(maxBlockEditor, blockEditorStartRef.current - delta)) }))
              }}
            />
          )}

          {/* ── ブロック設定 ── */}
          {!collapsed.blockEditor && (
            <div ref={blockEditorPanelRef} className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: blockEditorW }}>
              <PanelHeader title="ブロック設定" collapsed={false} onToggle={closeBlockEditor} />
              <div className="flex-1 overflow-y-auto">
                <BlockEditor />
              </div>
            </div>
          )}

        </div>{/* end キャンバスエリア */}

        <ResizeDivider
          onDragStart={() => { previewStartRef.current = widths.preview }}
          onResize={(delta) => {
            if (collapsed.preview) return
            const containerW = containerRef.current?.clientWidth ?? 0
            const maxPreview = containerW - paletteWRef.current - blockEditorWRef.current - CANVAS_MIN - DIVIDERS_W
            setWidths((w) => ({ ...w, preview: Math.max(PANEL_MIN, Math.min(maxPreview, previewStartRef.current - delta)) }))
          }}
        />

        {/* ── プレビュー ── */}
        {collapsed.preview ? (
          <CollapsedTab title="プレビュー" onExpand={() => toggleCollapse('preview')} />
        ) : (
          <div className="flex flex-col overflow-hidden flex-shrink-0 relative" style={{ width: previewW }}>
            {pickRequest && (
              <div className="absolute inset-x-0 top-[33px] z-10 flex items-center justify-between
                bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1.5">
                <span>🎯 要素をクリックして選択 — ESC でキャンセル</span>
                <button onClick={() => {
                  iframeRef.current?.contentWindow?.postMessage({ type: 'TEBIKI_CHART_PICK_CANCEL' }, '*')
                  cancelPick()
                }} className="underline">キャンセル</button>
              </div>
            )}
            <PreviewPane
              ref={iframeRef}
              isPlaying={isPlaying}
              previewUrl={scenario.previewUrl}
              localBlobUrl={localBlobUrl}
              localFileName={localFileName}
              onFileSelect={handleLocalFileSelect}
              onCollapse={() => toggleCollapse('preview')}
              onPlay={handlePlay}
              onStop={handleStop}
            />
          </div>
        )}

      </div>
      </EditorDndProvider>
      </BranchViewProvider>

      {/* Editor tour (portal → document.body) */}
      <EditorTour
        active={tourActive}
        onComplete={() => {
          setTourActive(false)
          completeTour()
        }}
        onSkip={() => {
          setTourActive(false)
          completeTour()
        }}
      />
    </div>
  )
}

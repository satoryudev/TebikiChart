'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useEditorStore } from '@/store/editorStore'
import { loadScenario } from '@/lib/scenarioStorage'
import BlockPalette from '@/components/editor/BlockPalette'
import Canvas from '@/components/editor/Canvas'
import BlockEditor from '@/components/editor/BlockEditor'
import PreviewPane from '@/components/editor/PreviewPane'
import PreviewToolbar from '@/components/editor/PreviewToolbar'
import ResizeDivider from '@/components/editor/ResizeDivider'
import { useOnboarding } from '@/hooks/useOnboarding'
import EditorTour from '@/components/onboarding/EditorTour'
import { getScenarioStatus, ScenarioStatus } from '@/lib/scenarioUtils'
import { Scenario } from '@/types/scenario'

const PANEL_MIN = 160
const COLLAPSED_W = 32
const CANVAS_MIN = 200  // canvas の min-w-[200px] と一致
const DIVIDERS_W = 12   // 3本 × 4px

interface PanelWidths { palette: number; canvas: number; preview: number; blockEditor: number }
interface Collapsed { palette: boolean; preview: boolean; blockEditor: boolean }

/** パネルのヘッダーバー（タイトル + 最小化ボタン） */
function PanelHeader({
  title, collapsed, onToggle,
}: { title: string; collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200/70 flex-shrink-0">
      {!collapsed && <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>}
      <button
        onClick={onToggle}
        className="ml-auto text-slate-400 hover:text-slate-700 transition-colors w-5 h-5
          flex items-center justify-center rounded hover:bg-slate-200 text-xs font-bold"
        title={collapsed ? '展開' : '最小化'}
      >
        {collapsed ? '▶' : '×'}
      </button>
    </div>
  )
}

const STATUS_CONFIG: Record<ScenarioStatus, { label: string; cls: string }> = {
  not_started: { label: '未開始',  cls: 'bg-gray-100 text-gray-600' },
  in_progress:  { label: '作成中',  cls: 'bg-blue-100 text-blue-700' },
  completed:    { label: '完了 ✓', cls: 'bg-emerald-100 text-emerald-700' },
}

function StatusBadge({ scenario }: { scenario: Scenario }) {
  const status = getScenarioStatus(scenario)
  const { label, cls } = STATUS_CONFIG[status]
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}

function EditorProgressBar({ steps }: { steps: Array<{ completed: boolean }> }) {
  const done = steps.filter((s) => s.completed).length
  const pct = Math.round((done / steps.length) * 100)
  return (
    <div className="flex items-center gap-2 w-44">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">{done}/{steps.length}</span>
    </div>
  )
}

/** 最小化時に縦書きで表示するタブ */
function CollapsedTab({ title, onExpand }: { title: string; onExpand: () => void }) {
  return (
    <div
      onClick={onExpand}
      className="flex flex-col items-center justify-center h-full cursor-pointer
        bg-gray-50 hover:bg-gray-100 transition-colors gap-2 border-r border-gray-200"
      style={{ width: COLLAPSED_W }}
    >
      <span className="text-gray-400 text-xs font-bold">▶</span>
      <span
        className="text-gray-500 text-xs font-semibold tracking-widest"
        style={{ writingMode: 'vertical-rl' }}
      >{title}</span>
    </div>
  )
}

export default function EditorPage() {
  const params = useParams()
  const id = params.id as string
  const { scenario, setScenario, updateScenarioMeta, pickRequest, applyPick, cancelPick } = useEditorStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [titleEditing, setTitleEditing] = useState(false)
  const { tourCompleted, completeTour } = useOnboarding()
  const [tourActive, setTourActive] = useState(false)
  const [previewPlayed, setPreviewPlayed] = useState(false)
  const [exported, setExported] = useState(false)

  const [widths, setWidths] = useState<PanelWidths>({ palette: 220, canvas: 340, preview: 420, blockEditor: 260 })
  const [collapsed, setCollapsed] = useState<Collapsed>({ palette: false, preview: false, blockEditor: false })

  // mousedown 時に一度だけ記録する startWidth refs
  const paletteStartRef = useRef(widths.palette)
  const previewStartRef = useRef(widths.preview)
  const blockEditorStartRef = useRef(widths.blockEditor)

  // コンテナ幅とパネル幅の最新値を常に参照できるよう ref で保持（上限制約計算に使用）
  const containerRef = useRef<HTMLDivElement>(null)
  const paletteWRef = useRef(0)
  const blockEditorWRef = useRef(0)

  const toggleCollapse = (panel: keyof Collapsed) => {
    // 展開するとき、隣のパネルのstartRefを更新
    setCollapsed((c) => ({ ...c, [panel]: !c[panel] }))
  }

  useEffect(() => {
    const s = loadScenario(id)
    if (s) setScenario(s)
  }, [id, setScenario])

  useEffect(() => {
    if (tourCompleted) return
    const t = setTimeout(() => setTourActive(true), 500)
    return () => clearTimeout(t)
  }, [tourCompleted])

  useEffect(() => {
    if (!pickRequest) return
    iframeRef.current?.contentWindow?.postMessage({ type: 'TETSUZUKI_QUEST_PICK_START' }, '*')
  }, [pickRequest])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type !== 'TETSUZUKI_QUEST_ELEMENT_PICKED') return
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
        iframeRef.current?.contentWindow?.postMessage({ type: 'TETSUZUKI_QUEST_PICK_CANCEL' }, '*')
        cancelPick()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pickRequest, cancelPick])

  if (!scenario) {
    return <div className="flex items-center justify-center h-screen text-gray-400">シナリオが見つかりません。</div>
  }

  const getPreviewSrc = () => {
    const base = scenario?.previewUrl?.trim() || '/demo.html'
    return base.includes('?') ? `${base}&preview=1` : `${base}?preview=1`
  }

  const handlePlay = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.src = getPreviewSrc()
    iframe.onload = () => {
      iframe.onload = null
      iframe.contentWindow?.postMessage({ type: 'TETSUZUKI_QUEST_START', scenario }, '*')
      setIsPlaying(true)
      setPreviewPlayed(true)
    }
  }

  const handleStop = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.src = getPreviewSrc()
    setIsPlaying(false)
  }

  const paletteW = collapsed.palette ? COLLAPSED_W : widths.palette
  const previewW = collapsed.preview ? COLLAPSED_W : widths.preview
  const blockEditorW = collapsed.blockEditor ? COLLAPSED_W : widths.blockEditor

  // レンダーのたびに最新値を ref に反映（リサイズ上限計算で使用）
  paletteWRef.current = paletteW
  blockEditorWRef.current = blockEditorW

  const stepperSteps = [
    { label: 'ブロックを追加', completed: (scenario?.blocks.length ?? 0) > 0 },
    { label: 'ブロックを設定', completed: scenario?.blocks.some((b) => {
      if (b.type === 'speech') return b.message !== '新しいセリフ'
      if (b.type === 'branch') return b.question !== 'はいですか？'
      return false
    }) ?? false },
    { label: 'プレビュー確認', completed: previewPlayed },
    { label: 'エクスポート', completed: exported },
  ]

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top header — breadcrumb style */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0 min-h-[48px]">
        {/* Left: breadcrumb + title */}
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <Link href="/" className="text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1 flex-shrink-0 text-xs">
            ← ダッシュボード
          </Link>
          <span className="text-gray-300 flex-shrink-0">/</span>
          {titleEditing ? (
            <input
              autoFocus
              className="font-semibold text-sm border border-blue-400 rounded px-2 py-0.5 min-w-0"
              value={scenario.title}
              onChange={(e) => updateScenarioMeta({ title: e.target.value })}
              onBlur={() => setTitleEditing(false)}
              onKeyDown={(e) => e.key === 'Enter' && setTitleEditing(false)}
            />
          ) : (
            <button
              onClick={() => setTitleEditing(true)}
              className="font-semibold text-sm text-gray-800 hover:text-blue-600 transition-colors truncate max-w-[200px]"
            >
              {scenario.title}
            </button>
          )}
          <select
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 flex-shrink-0 ml-1"
            value={scenario.category}
            onChange={(e) => updateScenarioMeta({ category: e.target.value as typeof scenario.category })}
          >
            <option value="moving">引越し・転居</option>
            <option value="mynumber">マイナンバー</option>
            <option value="tax">確定申告</option>
            <option value="childcare">育児・出産</option>
          </select>
        </div>

        {/* Right: status badge + linear progress */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <StatusBadge scenario={scenario} />
          <EditorProgressBar steps={stepperSteps} />
        </div>
      </header>

      {/* Main 4-panel layout */}
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
            const maxPalette = containerW - blockEditorWRef.current - CANVAS_MIN - DIVIDERS_W
            setWidths((w) => ({ ...w, palette: Math.max(PANEL_MIN, Math.min(maxPalette, paletteStartRef.current + delta)) }))
          }}
        />

        {/* ── キャンバス ── */}
        <div className="flex flex-col flex-1 min-w-[200px] overflow-hidden">
          <PreviewToolbar onExportCallback={() => setExported(true)} />
          <Canvas />
        </div>

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
            <PanelHeader title="プレビュー" collapsed={false} onToggle={() => toggleCollapse('preview')} />
            {pickRequest && (
              <div className="absolute inset-x-0 top-8 z-10 flex items-center justify-between
                bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1.5">
                <span>🎯 要素をクリックして選択 — ESC でキャンセル</span>
                <button onClick={() => {
                  iframeRef.current?.contentWindow?.postMessage({ type: 'TETSUZUKI_QUEST_PICK_CANCEL' }, '*')
                  cancelPick()
                }} className="underline">キャンセル</button>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <PreviewPane ref={iframeRef} isPlaying={isPlaying} previewUrl={scenario.previewUrl} onPlay={handlePlay} onStop={handleStop} />
            </div>
          </div>
        )}

        <ResizeDivider
          onDragStart={() => { blockEditorStartRef.current = widths.blockEditor }}
          onResize={(delta) => {
            if (collapsed.blockEditor) return
            const containerW = containerRef.current?.clientWidth ?? 0
            const maxBlockEditor = containerW - paletteWRef.current - previewW - CANVAS_MIN - DIVIDERS_W
            setWidths((w) => ({ ...w, blockEditor: Math.max(PANEL_MIN, Math.min(maxBlockEditor, blockEditorStartRef.current - delta)) }))
          }}
        />

        {/* ── ブロック設定 ── */}
        {collapsed.blockEditor ? (
          <CollapsedTab title="設定" onExpand={() => toggleCollapse('blockEditor')} />
        ) : (
          <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: blockEditorW }}>
            <PanelHeader title="ブロック設定" collapsed={false} onToggle={() => toggleCollapse('blockEditor')} />
            <div className="flex-1 overflow-y-auto">
              <BlockEditor />
            </div>
          </div>
        )}

      </div>

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

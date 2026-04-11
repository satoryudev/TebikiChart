'use client';

import React, { CSSProperties, MouseEvent as ReactMouseEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/store/editorStore';
import { Block } from '@/types/scenario';
import { useTheme } from '@/hooks/useTheme';

// ─── Tour steps (tooltip phase) ────────────────────────────────────────────

interface TourStep {
  targetId: string;
  message: string;
  position: 'left' | 'right' | 'bottom';
  waitForClick?: boolean;       // ターゲット要素クリックで自動進行（"次へ" ボタン非表示）
  waitForClickIn?: string;      // 指定 id の子要素クリックで自動進行（パルスリング付き）
  noSpotlight?: boolean;        // スポットライトオーバーレイを省略（要素自身がモーダルの場合など）
  transitionToField?: boolean;  // このステップ後に 'field' フェーズへ遷移
  transitionToTheme?: boolean;  // このステップ後に 'theme' フェーズへ遷移
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'validation-dialog',
    message: 'ブロックの設定が未完了の場合、実行できません。エラー項目をクリックして該当ブロックへジャンプしてみましょう。',
    position: 'right',
    noSpotlight: true,
    waitForClickIn: 'validation-issues-list',
    transitionToField: true,
  },
  {
    targetId: 'validation-badge-btn',
    message: 'シナリオチェックボタンでエラーや警告を常に確認できます。「✓ 問題なし」になると実行可能です。修正後は再度実行してみましょう。',
    position: 'bottom',
    transitionToTheme: true,
  },
  {
    targetId: 'preview-toolbar',
    message: '完成したらここからHTMLへの書き出しや埋め込みコードの取得、JSONの保存・インポートができます。',
    position: 'bottom',
  },
];

// ─── Drag stages ───────────────────────────────────────────────────────────

const DRAG_STAGES = [
  {
    paletteType: 'speech',
    emoji: '💬',
    label: '吹き出し',
    color: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  },
  {
    paletteType: 'input-spotlight',
    emoji: '✏️',
    label: 'スポットライト',
    color: { bg: '#eef2ff', border: '#a5b4fc', text: '#3730a3' },
  },
] as const;

const REORDER_STEP_INDEX  = DRAG_STAGES.length;                                // display: 3
const MENU_STEP_INDEX     = DRAG_STAGES.length + 1;                            // display: 4
// fill 2nd=5, hint 3rd=6, fill 3rd=7
const RIBBON_STEP_DISPLAY       = DRAG_STAGES.length + 1 + 3 + 1;                       // display: 8
const SPEECH_CLEAR_STEP_DISPLAY  = RIBBON_STEP_DISPLAY + 1;                               // display: 9
const RUN_PREVIEW_STEP_DISPLAY   = SPEECH_CLEAR_STEP_DISPLAY + 1;                         // display: 10
const FIELD_STEP_INDEX           = DRAG_STAGES.length + 1 + 3 + 1 + 1 + 1 + 2;           // display: 13
const TOTAL_STEPS                = DRAG_STAGES.length + 1 + 1 + 2 + 1 + 1 + 1 + 1 + TOUR_STEPS.length + 1 + 1; // 2+1+1+2+1+1+1+1+3+1+1 = 15
const THEME_STEP_DISPLAY        = TOTAL_STEPS - 1; // 13

// ─── easing ────────────────────────────────────────────────────────────────

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Types ─────────────────────────────────────────────────────────────────

interface Rect4 { left: number; top: number; width: number; height: number }
interface DragPos {
  startX: number; startY: number;
  endX: number;   endY: number;
  paletteRect: Rect4;          // 対象ブロックのみ（ハイライト用）
  paletteContainerRect: Rect4; // パレット全体（ブロッカー除外用）
  canvasRect: Rect4;
  otherPaletteRects: Rect4[];  // 対象外パレットアイテム（個別ブロック用）
}

// ─── Animated block card (requestAnimationFrame) ──────────────────────────

type DragStage = typeof DRAG_STAGES[number];

function DragBlockCard({ pos, stage }: { pos: DragPos; stage: DragStage }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  // カードサイズ（パレットアイテムと同じ幅感）
  const W = 140;
  const H = 52;

  useEffect(() => {
    const CYCLE      = 2800;
    const PAUSE_FRAC = 0.15;
    const MOVE_FRAC  = 0.80;
    let startTime: number | null = null;

    const animate = (now: number) => {
      if (startTime === null) startTime = now;
      const t = ((now - startTime) % CYCLE) / CYCLE;

      let p: number;
      if (t < PAUSE_FRAC) {
        p = 0;
      } else if (t < MOVE_FRAC) {
        p = easeInOutCubic((t - PAUSE_FRAC) / (MOVE_FRAC - PAUSE_FRAC));
      } else {
        p = 1;
      }

      const x = pos.startX + (pos.endX - pos.startX) * p - W / 2;
      const y = pos.startY + (pos.endY - pos.startY) * p - H / 2;

      if (cardRef.current) {
        cardRef.current.style.left    = `${x}px`;
        cardRef.current.style.top     = `${y}px`;
        // ドラッグ中は少し傾ける
        const rotate = p > 0 && p < 1 ? 4 : 0;
        cardRef.current.style.transform = `rotate(${rotate}deg)`;
        cardRef.current.style.opacity = p === 1 ? '0.5' : '1';
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [pos.startX, pos.startY, pos.endX, pos.endY]);

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: pos.startX - W / 2,
        top:  pos.startY - H / 2,
        width: W,
        height: H,
        zIndex: 43,
        borderRadius: 10,
        background: stage.color.bg,
        border: `2px solid ${stage.color.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        transformOrigin: 'center center',
        transition: 'transform 0.15s, opacity 0.2s',
      }}
    >
      <span style={{ fontSize: 20 }}>{stage.emoji}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: stage.color.text }}>
        {stage.label}
      </span>
    </div>
  );
}

// ─── Animated swap cards (for reorder step) ──────────────────────────────────

function AnimatedSwapCards({
  speechRect,
  spotlightRect,
}: {
  speechRect: Rect4;
  spotlightRect: Rect4;
}) {
  const speechRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);

  const W = 140, H = 52;
  const speechColor  = DRAG_STAGES[0].color;
  const spotColor    = DRAG_STAGES[1].color;

  useEffect(() => {
    const CYCLE          = 3200;
    const FADE_IN_END    = 0.08;
    const PAUSE_END      = 0.18;
    const MOVE_END       = 0.72;
    const FADE_OUT_START = 0.82;
    const FADE_OUT_END   = 0.95;

    let startTime: number | null = null;

    const sX  = speechRect.left   + speechRect.width   / 2;
    const sY  = speechRect.top    + speechRect.height  / 2;
    const spX = spotlightRect.left + spotlightRect.width  / 2;
    const spY = spotlightRect.top  + spotlightRect.height / 2;

    const animate = (now: number) => {
      if (startTime === null) startTime = now;
      const t = ((now - startTime) % CYCLE) / CYCLE;

      // Position progress 0→1
      let p: number;
      if (t < PAUSE_END) {
        p = 0;
      } else if (t < MOVE_END) {
        p = easeInOutCubic((t - PAUSE_END) / (MOVE_END - PAUSE_END));
      } else {
        p = 1;
      }

      // Opacity
      let opacity: number;
      if (t < FADE_IN_END) {
        opacity = t / FADE_IN_END;
      } else if (t < FADE_OUT_START) {
        opacity = 1;
      } else if (t < FADE_OUT_END) {
        opacity = 1 - (t - FADE_OUT_START) / (FADE_OUT_END - FADE_OUT_START);
      } else {
        opacity = 0;
      }

      const rotate = p > 0 && p < 1 ? 4 : 0;

      if (speechRef.current) {
        const x = sX + (spX - sX) * p - W / 2;
        const y = sY + (spY - sY) * p - H / 2;
        speechRef.current.style.left      = `${x}px`;
        speechRef.current.style.top       = `${y}px`;
        speechRef.current.style.transform = `rotate(${rotate}deg)`;
        speechRef.current.style.opacity   = `${opacity}`;
      }

      if (spotlightRef.current) {
        const x = spX + (sX - spX) * p - W / 2;
        const y = spY + (sY - spY) * p - H / 2;
        spotlightRef.current.style.left      = `${x}px`;
        spotlightRef.current.style.top       = `${y}px`;
        spotlightRef.current.style.transform = `rotate(${-rotate}deg)`;
        spotlightRef.current.style.opacity   = `${opacity}`;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [speechRect.left, speechRect.top, speechRect.width, speechRect.height,
      spotlightRect.left, spotlightRect.top, spotlightRect.width, spotlightRect.height]);

  const baseStyle = (color: { bg: string; border: string; text: string }): CSSProperties => ({
    position: 'fixed',
    width: W,
    height: H,
    zIndex: 43,
    borderRadius: 10,
    background: color.bg,
    border: `2px solid ${color.border}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 12px',
    transformOrigin: 'center center',
    opacity: 0,
  });

  return (
    <>
      <div
        ref={speechRef}
        style={{
          ...baseStyle(speechColor),
          left: speechRect.left + speechRect.width  / 2 - W / 2,
          top:  speechRect.top  + speechRect.height / 2 - H / 2,
        }}
      >
        <span style={{ fontSize: 20 }}>💬</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: speechColor.text }}>吹き出し</span>
      </div>
      <div
        ref={spotlightRef}
        style={{
          ...baseStyle(spotColor),
          left: spotlightRect.left + spotlightRect.width  / 2 - W / 2,
          top:  spotlightRect.top  + spotlightRect.height / 2 - H / 2,
        }}
      >
        <span style={{ fontSize: 20 }}>✏️</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: spotColor.text }}>スポットライト</span>
      </div>
    </>
  );
}

// ─── Interactive reorder step ─────────────────────────────────────────────────

function InteractiveReorderStep({ onSkip }: { onSkip: () => void }) {
  const blocks = useEditorStore((s) => s.scenario?.blocks ?? []);
  const [speechRect,    setSpeechRect]    = useState<Rect4 | null>(null);
  const [spotlightRect, setSpotlightRect] = useState<Rect4 | null>(null);
  const [canvasRect,    setCanvasRect]    = useState<Rect4 | null>(null);
  const retryRef = useRef(0);

  const speechBlock    = blocks.find((b) => b.type === 'speech');
  const spotlightBlock = blocks.find((b) => b.type === 'input-spotlight');

  const measure = useCallback(() => {
    if (!speechBlock || !spotlightBlock) return;

    const speechEl    = document.querySelector(`[data-block-id="${speechBlock.id}"]`)    as HTMLElement | null;
    const spotlightEl = document.querySelector(`[data-block-id="${spotlightBlock.id}"]`) as HTMLElement | null;
    const canvasEl    = document.getElementById('editor-canvas')                          as HTMLElement | null;

    if (!speechEl || !spotlightEl || !canvasEl) {
      if (retryRef.current < 15) {
        retryRef.current += 1;
        setTimeout(measure, 200);
      }
      return;
    }

    const sr  = speechEl.getBoundingClientRect();
    const spr = spotlightEl.getBoundingClientRect();
    const cr  = canvasEl.getBoundingClientRect();

    setSpeechRect({    left: sr.left,  top: sr.top,  width: sr.width,  height: sr.height  });
    setSpotlightRect({ left: spr.left, top: spr.top, width: spr.width, height: spr.height });
    setCanvasRect({    left: cr.left,  top: cr.top,  width: cr.width,  height: cr.height  });
  }, [speechBlock?.id, spotlightBlock?.id]);

  useEffect(() => {
    retryRef.current = 0;
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
  }, [measure]);

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

  // Canvas-only blockers
  const blockers = canvasRect
    ? buildBlockers(canvasRect, canvasRect, vw, vh)
    : [];

  return createPortal(
    <>
      {/* Overlay with hole for canvas */}
      <svg
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 40, pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <mask id="tour-reorder-mask">
            <rect width="100%" height="100%" fill="white" />
            {canvasRect && (
              <rect
                x={canvasRect.left - 6} y={canvasRect.top - 6}
                width={canvasRect.width + 12} height={canvasRect.height + 12}
                fill="black" rx="10"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-reorder-mask)" />

        {/* Crossing dashed trajectory lines */}
        {speechRect && spotlightRect && (() => {
          const sx  = speechRect.left    + speechRect.width    / 2;
          const sy  = speechRect.top     + speechRect.height   / 2;
          const spx = spotlightRect.left + spotlightRect.width  / 2;
          const spy = spotlightRect.top  + spotlightRect.height / 2;
          const offset = 18; // horizontal offset so lines don't overlap perfectly
          return (
            <>
              <line x1={sx - offset} y1={sy} x2={spx - offset} y2={spy}
                style={{ stroke: 'var(--tour-dash-1)' }} strokeWidth="2.5"
                strokeDasharray="9 6" strokeLinecap="round" />
              <line x1={spx + offset} y1={spy} x2={sx + offset} y2={sy}
                style={{ stroke: 'var(--tour-dash-2)' }} strokeWidth="2.5"
                strokeDasharray="9 6" strokeLinecap="round" />
            </>
          );
        })()}
      </svg>

      {/* Pointer-event blockers outside canvas */}
      {blockers.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: b.top, left: b.left,
            width: b.width, height: b.height,
            zIndex: 41,
            pointerEvents: 'all',
          }}
        />
      ))}

      {/* Animated swap cards */}
      {speechRect && spotlightRect && (
        <AnimatedSwapCards speechRect={speechRect} spotlightRect={spotlightRect} />
      )}

      {/* Instruction tooltip */}
      <DraggableTourPanel stepLabel={`${REORDER_STEP_INDEX + 1} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>💬 吹き出し</span>と
          <span style={{ fontWeight: 600 }}>✏️ スポットライト</span>の順序を入れ替えてみましょう
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          ドラッグ＆ドロップでキャンバス内のブロックを並び替えられます
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              fontSize: 12, color: '#9ca3af', background: 'none',
              border: 'none', cursor: 'pointer', padding: '2px 4px',
            }}
          >
            スキップ
          </button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive drag step ─────────────────────────────────────────────────

// ─── Interactive menu step (step 4) ───────────────────────────────────────────

type MenuSubPhase = 'button' | 'panel';

function InteractiveMenuStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const selectedBlockId    = useEditorStore((s) => s.selectedBlockId);
  const setSelectedBlockId = useEditorStore((s) => s.setSelectedBlockId);
  const [subPhase,   setSubPhase]   = useState<MenuSubPhase>('button');
  const [btnRect,     setBtnRect]    = useState<Rect4 | null>(null);
  const [panelRect,   setPanelRect]  = useState<Rect4 | null>(null);
  const [previewRect, setPreviewRect] = useState<Rect4 | null>(null);
  const targetBlockIdRef = useRef<string | null>(null);

  // マウント時に選択をリセット（reorder ステップ中に選択されていた場合に備えて）
  useEffect(() => {
    setSelectedBlockId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2番目のブロック全体の位置を計測
  const measureBtn = useCallback(() => {
    const blockEls    = document.querySelectorAll<HTMLElement>('[data-block-id]');
    const secondBlock = blockEls[1];
    if (!secondBlock) { setTimeout(measureBtn, 200); return; }
    targetBlockIdRef.current = secondBlock.dataset.blockId ?? null;
    const r = secondBlock.getBoundingClientRect();
    setBtnRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measureBtn);
    window.addEventListener('resize', measureBtn);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measureBtn); };
  }, [measureBtn]);

  // ⋮ クリック検出 → panel フェーズへ
  useEffect(() => {
    if (subPhase !== 'button') return;
    if (!selectedBlockId) return;
    if (targetBlockIdRef.current && selectedBlockId !== targetBlockIdRef.current) return;
    setSubPhase('panel');
  }, [selectedBlockId, subPhase]);

  // block-editor パネルとプレビューペインの位置を計測（panel フェーズ遷移後）
  const measurePanel = useCallback(() => {
    const el = document.getElementById('block-editor');
    if (!el) { setTimeout(measurePanel, 100); return; }
    const r = el.getBoundingClientRect();
    setPanelRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    const el2 = document.getElementById('preview-iframe');
    if (el2) {
      const r2 = el2.getBoundingClientRect();
      setPreviewRect({ left: r2.left, top: r2.top, width: r2.width, height: r2.height });
    }
  }, []);

  useEffect(() => {
    if (subPhase !== 'panel') return;
    // ダブル rAF: block-editor の React 再レンダリング完了を待つ
    let inner = 0;
    const outer = requestAnimationFrame(() => { inner = requestAnimationFrame(measurePanel); });
    window.addEventListener('resize', measurePanel);
    return () => { cancelAnimationFrame(outer); cancelAnimationFrame(inner); window.removeEventListener('resize', measurePanel); };
  }, [subPhase, measurePanel]);


  const vw = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

  // ── phase: button ──────────────────────────────────────────────────────────
  if (subPhase === 'button') {
    const MASK_PAD = 6;
    const blockers  = btnRect ? buildBlockers(btnRect, btnRect, vw, vh) : [];

    return createPortal(
      <>
        {/* Overlay: 2番目のブロック全体を露出 */}
        <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <mask id="tour-menu-btn-mask">
              <rect width="100%" height="100%" fill="white" />
              {btnRect && (
                <rect
                  x={btnRect.left - MASK_PAD} y={btnRect.top - MASK_PAD}
                  width={btnRect.width + MASK_PAD * 2} height={btnRect.height + MASK_PAD * 2}
                  fill="black" rx="10"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-menu-btn-mask)" />
        </svg>

        {/* ブロック以外をブロック */}
        {blockers.map((b, i) => (
          <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
        ))}

        {/* パルスリング */}
        {btnRect && (
          <div
            className="animate-tour-pulse"
            style={{
              position: 'fixed',
              top:    btnRect.top    - MASK_PAD,
              left:   btnRect.left   - MASK_PAD,
              width:  btnRect.width  + MASK_PAD * 2,
              height: btnRect.height + MASK_PAD * 2,
              borderRadius: 10,
              border: '2px solid rgba(59,130,246,0.9)',
              zIndex: 42,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* 説明ツールチップ */}
        <DraggableTourPanel stepLabel={`${MENU_STEP_INDEX + 1} / ${TOTAL_STEPS}`}>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
            右上の <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 16 }}>⋮</span> をクリック、またはブロックをダブルクリックして設定を開いてみましょう
          </p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
            ブロックのテキストや表示設定を変更できます
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
          </div>
        </DraggableTourPanel>
      </>,
      document.body
    );
  }

  // ── phase: panel ──────────────────────────────────────────────────────────
  const PANEL_PAD  = 8;
  const panelBlockers = (panelRect && previewRect)
    ? buildBlockers(panelRect, previewRect, vw, vh)
    : panelRect
    ? buildBlockers(panelRect, panelRect, vw, vh)
    : [];

  return createPortal(
    <>
      {/* Overlay: block-editor パネルとプレビューを露出 */}
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <mask id="tour-panel-mask">
            <rect width="100%" height="100%" fill="white" />
            {panelRect && (
              <rect
                x={panelRect.left - PANEL_PAD} y={panelRect.top - PANEL_PAD}
                width={panelRect.width + PANEL_PAD * 2} height={panelRect.height + PANEL_PAD * 2}
                fill="black" rx="10"
              />
            )}
            {previewRect && (
              <rect
                x={previewRect.left - PANEL_PAD} y={previewRect.top - PANEL_PAD}
                width={previewRect.width + PANEL_PAD * 2} height={previewRect.height + PANEL_PAD * 2}
                fill="black" rx="10"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-panel-mask)" />
      </svg>

      {/* パネル・プレビュー以外をブロック */}
      {panelBlockers.map((b, i) => (
        <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
      ))}

      {/* パルスリング（ブロック設定） */}
      {panelRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top:    panelRect.top    - PANEL_PAD,
            left:   panelRect.left   - PANEL_PAD,
            width:  panelRect.width  + PANEL_PAD * 2,
            height: panelRect.height + PANEL_PAD * 2,
            borderRadius: 10,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* パルスリング（プレビュー） */}
      {previewRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top:    previewRect.top    - PANEL_PAD,
            left:   previewRect.left   - PANEL_PAD,
            width:  previewRect.width  + PANEL_PAD * 2,
            height: previewRect.height + PANEL_PAD * 2,
            borderRadius: 10,
            border: '2px solid rgba(99,102,241,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 説明ツールチップ */}
      <DraggableTourPanel stepLabel={`${MENU_STEP_INDEX + 1} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
          ブロックの<span style={{ fontWeight: 600 }}>テキストや設定</span>をここで編集できます
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          ブロックで設定した内容はプレビュー画面で確認できます
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
            <button onClick={onNext} style={{ fontSize: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '4px 12px' }}>次へ →</button>
          </div>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive block fill step (steps 5 & 6) ───────────────────────────────

function InteractiveBlockFillStep({
  domIndex,      // DOM 上の [data-block-id] 要素のインデックス（0-based）
  stepDisplay,   // 表示するステップ番号
  onNext,
  onSkip,
}: {
  domIndex: number;
  stepDisplay: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const blocks          = useEditorStore((s) => s.scenario?.blocks ?? []);
  const setSelectedBlockId = useEditorStore((s) => s.setSelectedBlockId);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const [fieldRect,  setFieldRect]  = useState<Rect4 | null>(null);
  const [secondRect, setSecondRect] = useState<Rect4 | null>(null);
  const onNextRef   = useRef(onNext);
  const advancedRef = useRef(false);
  const initialTargetIdRef = useRef<string | null>(null);

  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  // マウント時に対象ブロックを選択
  useEffect(() => {
    const blockEls = document.querySelectorAll<HTMLElement>('[data-block-id]');
    const el = blockEls[domIndex];
    if (!el) return;
    const id = el.dataset.blockId ?? null;
    if (id) setSelectedBlockId(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domIndex]);

  const block  = blocks.find((b) => b.id === selectedBlockId);
  const config = block ? FIELD_CONFIG[block.type] : null;

  // ブロック切り替わり時にリセット
  useEffect(() => {
    advancedRef.current = false;
    initialTargetIdRef.current = null;
  }, [block?.id]);

  // 吹き出し: blur / Enter で自動進行（MutationObserver でリトライ）
  useEffect(() => {
    if (block?.type !== 'speech') return;
    let cleanup: (() => void) | null = null;
    const attach = (el: HTMLTextAreaElement) => {
      const tryAdvance = () => {
        if (advancedRef.current) return;
        if (!el.value.trim()) return;
        advancedRef.current = true;
        onNextRef.current();
      };
      const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Enter') tryAdvance(); };
      el.addEventListener('blur', tryAdvance);
      el.addEventListener('keydown', onKeydown);
      cleanup = () => { el.removeEventListener('blur', tryAdvance); el.removeEventListener('keydown', onKeydown); };
    };
    const el = document.getElementById('speech-editor-message') as HTMLTextAreaElement | null;
    if (el) {
      attach(el);
    } else {
      const observer = new MutationObserver(() => {
        const found = document.getElementById('speech-editor-message') as HTMLTextAreaElement | null;
        if (found) { observer.disconnect(); attach(found); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      cleanup = () => observer.disconnect();
    }
    return () => cleanup?.();
  }, [block?.type]);

  // スポットライト: 初期 targetId を記録
  useEffect(() => {
    if (block?.type !== 'input-spotlight') return;
    if (initialTargetIdRef.current === null) {
      initialTargetIdRef.current = (block as { targetId: string }).targetId ?? '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block?.id]);

  // スポットライト: targetId が空 → 非空で自動進行
  useEffect(() => {
    if (block?.type !== 'input-spotlight') return;
    if (advancedRef.current) return;
    if (initialTargetIdRef.current === null) return;
    const currentTargetId = (block as { targetId: string }).targetId;
    if (!initialTargetIdRef.current && currentTargetId) {
      advancedRef.current = true;
      onNextRef.current();
    }
  }, [blocks, block?.type]);

  // フィールド位置計測
  const measure = useCallback(() => {
    if (!config) return;
    const el = document.getElementById(config.targetId);
    if (!el) {
      setTimeout(measure, 100);
      return;
    }
    const r = el.getBoundingClientRect();
    setFieldRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    if (config.secondTargetId) {
      const el2 = document.getElementById(config.secondTargetId);
      if (el2) {
        const r2 = el2.getBoundingClientRect();
        setSecondRect({ left: r2.left, top: r2.top, width: r2.width, height: r2.height });
      }
    }
  }, [config?.targetId, config?.secondTargetId]);

  useEffect(() => {
    setFieldRect(null);
    setSecondRect(null);
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    // ResizeDivider はウィンドウリサイズを発火しないため ResizeObserver で補完
    // ターゲット要素 (内部 ResizeDivider) と preview-iframe (外部 ResizeDivider) の両方を監視
    const ro = new ResizeObserver(measure);
    const targetEl  = config?.targetId       ? document.getElementById(config.targetId)       : null;
    const secondEl  = config?.secondTargetId ? document.getElementById(config.secondTargetId) : null;
    const iframeEl  = document.getElementById('preview-iframe');
    targetEl  && ro.observe(targetEl);
    secondEl  && secondEl !== iframeEl && ro.observe(secondEl);
    iframeEl  && ro.observe(iframeEl);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); ro.disconnect(); };
  }, [measure, config?.targetId, config?.secondTargetId]);

  const PAD = 6;

  return createPortal(
    <>
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <mask id="tour-blockfill-mask">
            <rect width="100%" height="100%" fill="white" />
            {fieldRect && (
              <rect x={fieldRect.left - PAD} y={fieldRect.top - PAD} width={fieldRect.width + PAD * 2} height={fieldRect.height + PAD * 2} fill="black" rx="8" />
            )}
            {secondRect && (
              <rect x={secondRect.left - PAD} y={secondRect.top - PAD} width={secondRect.width + PAD * 2} height={secondRect.height + PAD * 2} fill="black" rx="10" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-blockfill-mask)" />
      </svg>

      {fieldRect && (
        <div className="animate-tour-pulse" style={{ position: 'fixed', top: fieldRect.top - PAD, left: fieldRect.left - PAD, width: fieldRect.width + PAD * 2, height: fieldRect.height + PAD * 2, borderRadius: 8, border: '2px solid rgba(59,130,246,0.9)', zIndex: 42, pointerEvents: 'none' }} />
      )}
      {secondRect && (
        <div className="animate-tour-pulse" style={{ position: 'fixed', top: secondRect.top - PAD, left: secondRect.left - PAD, width: secondRect.width + PAD * 2, height: secondRect.height + PAD * 2, borderRadius: 10, border: '2px solid rgba(99,102,241,0.9)', zIndex: 42, pointerEvents: 'none' }} />
      )}

      <DraggableTourPanel stepLabel={`${stepDisplay} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
          {config ? (config.fillMessage ?? config.message) : 'ブロックの設定を入力してください。'}
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          {config ? config.sub : '各フィールドを埋めてエラーを修正しましょう。'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive block hint step (step 6) ────────────────────────────────────

function InteractiveBlockHintStep({
  domIndex,
  onNext,
  onSkip,
}: {
  domIndex: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const [blockRect,      setBlockRect]      = useState<Rect4 | null>(null);
  const targetBlockIdRef = useRef<string | null>(null);
  const onNextRef        = useRef(onNext);
  const advancedRef      = useRef(false);

  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  const measure = useCallback(() => {
    const blockEls = document.querySelectorAll<HTMLElement>('[data-block-id]');
    const el = blockEls[domIndex];
    if (!el) return;
    targetBlockIdRef.current = el.dataset.blockId ?? null;
    const r = el.getBoundingClientRect();
    setBlockRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, [domIndex]);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    // ResizeDivider はウィンドウリサイズを発火しないため ResizeObserver で補完
    // ブロック要素 (内部 ResizeDivider) と preview-iframe (外部 ResizeDivider) を監視
    const ro = new ResizeObserver(measure);
    const blockEl  = document.querySelectorAll<HTMLElement>('[data-block-id]')[domIndex];
    const iframeEl = document.getElementById('preview-iframe');
    blockEl  && ro.observe(blockEl);
    iframeEl && ro.observe(iframeEl);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); ro.disconnect(); };
  }, [measure, domIndex]);

  // ブロックがクリック（⋮ or ダブルクリック）されたら自動進行
  useEffect(() => {
    if (!selectedBlockId) return;
    if (selectedBlockId !== targetBlockIdRef.current) return;
    if (advancedRef.current) return;
    advancedRef.current = true;
    onNextRef.current();
  }, [selectedBlockId]);

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const PAD = 6;
  const blockers = blockRect ? buildBlockers(blockRect, blockRect, vw, vh) : [];

  return createPortal(
    <>
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <mask id="tour-blockhint-mask">
            <rect width="100%" height="100%" fill="white" />
            {blockRect && (
              <rect
                x={blockRect.left - PAD} y={blockRect.top - PAD}
                width={blockRect.width + PAD * 2} height={blockRect.height + PAD * 2}
                fill="black" rx="10"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-blockhint-mask)" />
      </svg>

      {blockers.map((b, i) => (
        <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
      ))}

      {blockRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top: blockRect.top - PAD, left: blockRect.left - PAD,
            width: blockRect.width + PAD * 2, height: blockRect.height + PAD * 2,
            borderRadius: 10,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      <DraggableTourPanel stepLabel={`${MENU_STEP_INDEX + 3} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
          次はこちらのブロックを設定しましょう
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          右上の <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>⋮</span> をクリック、またはブロックをダブルクリックして設定を開いてください
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive ribbon step (step 8) ────────────────────────────────────────

const RIBBON_ITEMS = [
  {
    targetId: 'preview-run-btn',
    message: '▶ 実行ボタンを押すとシナリオが起動します。クリックしてプレビューで動作を確認してみましょう。',
    waitForClick: true,
    clickAdvances: false,
  },
  {
    targetId: 'preview-stop-btn',
    message: '実行中のシナリオを停止します。シナリオの確認が終わったら停止してみましょう。',
    waitForClick: false,
    clickAdvances: true,
  },
  {
    targetId: 'preview-open-btn',
    message: 'ローカルの HTML ファイルを開いてプレビューに表示できます。',
    waitForClick: false,
    clickAdvances: false,
  },
] as const;

function InteractiveRibbonStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [subIndex,    setSubIndex]    = useState(0);
  const [btnRect,     setBtnRect]     = useState<Rect4 | null>(null);
  const [iframeRect,  setIframeRect]  = useState<Rect4 | null>(null);
  const current = RIBBON_ITEMS[subIndex];

  const measure = useCallback(() => {
    const el = document.getElementById(current.targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBtnRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    const el2 = document.getElementById('preview-iframe');
    if (el2) {
      const r2 = el2.getBoundingClientRect();
      setIframeRect({ left: r2.left, top: r2.top, width: r2.width, height: r2.height });
    }
  }, [current.targetId]);

  useEffect(() => {
    setBtnRect(null);
    setIframeRect(null);
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
  }, [measure]);

  const handleNextRef = useRef<() => void>(() => {});
  const [previewDone, setPreviewDone] = useState(false);

  const handleNext = () => {
    if (subIndex < RIBBON_ITEMS.length - 1) {
      setSubIndex(s => s + 1);
    } else {
      onNext();
    }
  };
  handleNextRef.current = handleNext;

  // waitForClick / clickAdvances: 対象ボタンのクリックで自動進行
  useEffect(() => {
    if (!current.waitForClick && !current.clickAdvances) return;
    const el = document.getElementById(current.targetId);
    if (!el) return;
    const handler = () => handleNextRef.current();
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [subIndex, current.targetId, current.waitForClick, current.clickAdvances]);

  // 停止ステップ中にプレビューのシナリオ完了を検知して「次へ」ボタンを表示
  const STOP_INDEX = 1; // RIBBON_ITEMS内の停止ボタンのindex
  useEffect(() => {
    if (subIndex !== STOP_INDEX) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TEBIKI_CHART_FINISHED') setPreviewDone(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [subIndex]);

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const PAD = 6;
  const TW  = 260;

  const blockers = (btnRect && iframeRect)
    ? buildBlockers(
        { left: btnRect.left - PAD, top: btnRect.top - PAD, width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2 },
        { left: iframeRect.left - PAD, top: iframeRect.top - PAD, width: iframeRect.width + PAD * 2, height: iframeRect.height + PAD * 2 },
        vw, vh,
      )
    : btnRect
    ? buildBlockers(
        { left: btnRect.left - PAD, top: btnRect.top - PAD, width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2 },
        { left: btnRect.left - PAD, top: btnRect.top - PAD, width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2 },
        vw, vh,
      )
    : [];

  // ツールチップをボタンの真下に配置
  const tTop  = btnRect ? btnRect.top + btnRect.height + 12 : undefined;
  const tLeft = btnRect ? Math.max(8, Math.min(btnRect.left + btnRect.width / 2 - TW / 2, vw - TW - 8)) : undefined;

  return createPortal(
    <>
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <mask id="tour-ribbon-mask">
            <rect width="100%" height="100%" fill="white" />
            {btnRect && (
              <rect
                x={btnRect.left - PAD} y={btnRect.top - PAD}
                width={btnRect.width + PAD * 2} height={btnRect.height + PAD * 2}
                fill="black" rx="6"
              />
            )}
            {iframeRect && (
              <rect
                x={iframeRect.left - PAD} y={iframeRect.top - PAD}
                width={iframeRect.width + PAD * 2} height={iframeRect.height + PAD * 2}
                fill="black" rx="10"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-ribbon-mask)" />
      </svg>

      {blockers.map((b, i) => (
        <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
      ))}

      {/* パルスリング（ボタン） */}
      {btnRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top: btnRect.top - PAD, left: btnRect.left - PAD,
            width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2,
            borderRadius: 6,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* パルスリング（プレビュー） */}
      {iframeRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top: iframeRect.top - PAD, left: iframeRect.left - PAD,
            width: iframeRect.width + PAD * 2, height: iframeRect.height + PAD * 2,
            borderRadius: 10,
            border: '2px solid rgba(99,102,241,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      <DraggableTourPanel initialTop={tTop} initialLeft={tLeft} width={TW} stepLabel={`${RIBBON_STEP_DISPLAY} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
          {current.message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
            {!current.waitForClick && (subIndex !== STOP_INDEX || previewDone) && (
              <button onClick={handleNext} style={{ fontSize: 12, background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '4px 12px' }}>
                次へ →
              </button>
            )}
          </div>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive speech-clear step ───────────────────────────────────────────

function InteractiveSpeechClearStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const blocks           = useEditorStore((s) => s.scenario?.blocks ?? []);
  const setSelectedBlockId = useEditorStore((s) => s.setSelectedBlockId);
  const [fieldRect, setFieldRect] = useState<Rect4 | null>(null);
  const advancedRef = useRef(false);

  // speech ブロックを選択して editor を開く
  useEffect(() => {
    const speechBlock = blocks.find((b: Block) => b.type === 'speech');
    if (speechBlock) setSelectedBlockId(speechBlock.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const measure = useCallback(() => {
    const el = document.getElementById('speech-editor-message');
    if (!el) return;
    const r = el.getBoundingClientRect();
    setFieldRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, []);

  // textarea が DOM に現れるのを待って測定
  useEffect(() => {
    if (document.getElementById('speech-editor-message')) {
      const id = requestAnimationFrame(measure);
      window.addEventListener('resize', measure);
      return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
    }
    const observer = new MutationObserver(() => {
      if (document.getElementById('speech-editor-message')) {
        observer.disconnect();
        requestAnimationFrame(measure);
        window.addEventListener('resize', measure);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure]);

  // speech ブロックの message が空になったら次へ
  useEffect(() => {
    if (advancedRef.current) return;
    const speechBlock = blocks.find((b: Block) => b.type === 'speech');
    if (speechBlock && (speechBlock as { message: string }).message === '') {
      advancedRef.current = true;
      onNext();
    }
  }, [blocks, onNext]);

  const vw  = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh  = typeof window !== 'undefined' ? window.innerHeight : 0;
  const PAD = 6;
  const TW  = 260;

  const blockers = fieldRect
    ? buildBlockers(
        { left: fieldRect.left - PAD, top: fieldRect.top - PAD, width: fieldRect.width + PAD * 2, height: fieldRect.height + PAD * 2 },
        { left: fieldRect.left - PAD, top: fieldRect.top - PAD, width: fieldRect.width + PAD * 2, height: fieldRect.height + PAD * 2 },
        vw, vh,
      )
    : [];

  const tTop  = fieldRect ? fieldRect.top + fieldRect.height + 12 : 200;
  const tLeft = fieldRect ? Math.max(8, Math.min(fieldRect.left + fieldRect.width / 2 - TW / 2, vw - TW - 8)) : Math.max(8, (vw - TW) / 2);

  return createPortal(
    <>
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <mask id="tour-speech-clear-mask">
            <rect width="100%" height="100%" fill="white" />
            {fieldRect && (
              <rect
                x={fieldRect.left - PAD} y={fieldRect.top - PAD}
                width={fieldRect.width + PAD * 2} height={fieldRect.height + PAD * 2}
                fill="black" rx="6"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-speech-clear-mask)" />
      </svg>

      {blockers.map((b, i) => (
        <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
      ))}

      {fieldRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top: fieldRect.top - PAD, left: fieldRect.left - PAD,
            width: fieldRect.width + PAD * 2, height: fieldRect.height + PAD * 2,
            borderRadius: 6,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      <DraggableTourPanel initialTop={tTop} initialLeft={tLeft} width={TW} stepLabel={`${SPEECH_CLEAR_STEP_DISPLAY} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
          次に、吹き出しのセリフを全て削除してみましょう。
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive run-preview step ────────────────────────────────────────────

function InteractiveRunPreviewStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [btnRect, setBtnRect] = useState<Rect4 | null>(null);
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  const measure = useCallback(() => {
    const el = document.getElementById('preview-run-btn');
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBtnRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
  }, [measure]);

  // 実行ボタンのクリックで次へ
  useEffect(() => {
    const el = document.getElementById('preview-run-btn');
    if (!el) return;
    const handler = () => onNextRef.current();
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, []);

  const vw  = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh  = typeof window !== 'undefined' ? window.innerHeight : 0;
  const PAD = 6;
  const TW  = 260;

  const blockers = btnRect
    ? buildBlockers(
        { left: btnRect.left - PAD, top: btnRect.top - PAD, width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2 },
        { left: btnRect.left - PAD, top: btnRect.top - PAD, width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2 },
        vw, vh,
      )
    : [];

  const tTop  = btnRect ? btnRect.top + btnRect.height + 12 : 200;
  const tLeft = btnRect ? Math.max(8, Math.min(btnRect.left + btnRect.width / 2 - TW / 2, vw - TW - 8)) : Math.max(8, (vw - TW) / 2);

  return createPortal(
    <>
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <mask id="tour-run-preview-mask">
            <rect width="100%" height="100%" fill="white" />
            {btnRect && (
              <rect
                x={btnRect.left - PAD} y={btnRect.top - PAD}
                width={btnRect.width + PAD * 2} height={btnRect.height + PAD * 2}
                fill="black" rx="6"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-run-preview-mask)" />
      </svg>

      {blockers.map((b, i) => (
        <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
      ))}

      {btnRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top: btnRect.top - PAD, left: btnRect.left - PAD,
            width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2,
            borderRadius: 6,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      <DraggableTourPanel initialTop={tTop} initialLeft={tLeft} width={TW} stepLabel={`${RUN_PREVIEW_STEP_DISPLAY} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
          セリフが欠けた状態で実行してみましょう。
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive theme step (step 10) ────────────────────────────────────────

type ThemeSubPhase = 'first' | 'second';

function InteractiveThemeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const [subPhase, setSubPhase] = useState<ThemeSubPhase>('first');
  const [btnRect, setBtnRect]   = useState<Rect4 | null>(null);
  const advancedRef = useRef(false);
  const { isDark } = useTheme();

  const measure = useCallback(() => {
    const el = document.getElementById('theme-toggle-btn');
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBtnRect({ left: r.left, top: r.top, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); };
  }, [measure]);

  useEffect(() => {
    const el = document.getElementById('theme-toggle-btn');
    if (!el) return;
    const handleClick = () => {
      if (subPhase === 'first') {
        setSubPhase('second');
        requestAnimationFrame(measure);
      } else {
        if (advancedRef.current) return;
        advancedRef.current = true;
        onNext();
      }
    };
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [subPhase, onNext, measure]);

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const PAD = 6;
  const TW  = 240;

  const blockers = btnRect
    ? buildBlockers(
        { left: btnRect.left - PAD, top: btnRect.top - PAD, width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2 },
        { left: btnRect.left - PAD, top: btnRect.top - PAD, width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2 },
        vw, vh,
      )
    : [];

  // ツールチップをボタンの真下・右揃えで表示
  const tTop  = btnRect ? btnRect.top + btnRect.height + 12 : undefined;
  const tLeft = btnRect ? Math.max(8, btnRect.left + btnRect.width - TW) : undefined;

  return createPortal(
    <>
      {/* step14: 画面全体の明度を保つためオーバーレイなし、ボタン以外のクリックのみブロック */}
      {blockers.map((b, i) => (
        <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
      ))}

      {btnRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top: btnRect.top - PAD, left: btnRect.left - PAD,
            width: btnRect.width + PAD * 2, height: btnRect.height + PAD * 2,
            borderRadius: 6,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      <DraggableTourPanel initialTop={tTop} initialLeft={tLeft} width={TW} stepLabel={`${THEME_STEP_DISPLAY} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
          {subPhase === 'first'
            ? isDark
              ? <>このボタンはライトモードに変更するボタンです。☀️ クリックして<span style={{ fontWeight: 600 }}>ライトモード</span>に切り替えてみましょう</>
              : <>このボタンはダークモードに変更するボタンです。🌙 クリックして<span style={{ fontWeight: 600 }}>ダークモード</span>に切り替えてみましょう</>
            : isDark
              ? <>☀️ もう一度クリックすると元の画面に戻ります</>
              : <>🌙 もう一度クリックすると元の画面に戻ります</>
          }
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          画面右上のボタンでいつでも切り替えられます
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive field step (step 7) ──────────────────────────────────────────

const FIELD_CONFIG: Record<string, { targetId: string; secondTargetId?: string; message: string; fillMessage?: string; sub: string }> = {
  speech: {
    targetId: 'speech-editor-message',
    message: '再びセリフを入力してみましょう。',
    fillMessage: 'セリフを入力してみましょう。',
    sub: 'メッセージはプレビューで吹き出しとして表示されます。',
  },
  'input-spotlight': {
    targetId: 'spotlight-editor-target',
    secondTargetId: 'preview-iframe',
    message: 'プレビューから対象要素を選択してください。',
    sub: '選択した要素がスポットライトで強調表示されます。',
  },
};

function InteractiveFieldStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const blocks          = useEditorStore((s) => s.scenario?.blocks ?? []);
  const [fieldRect,  setFieldRect]  = useState<Rect4 | null>(null);
  const [secondRect, setSecondRect] = useState<Rect4 | null>(null);
  const retryRef = useRef(0);
  const onNextRef = useRef(onNext);
  const advancedRef = useRef(false);
  const initialTargetIdRef = useRef<string | null>(null);

  useEffect(() => { onNextRef.current = onNext; }, [onNext]);

  const block  = blocks.find((b) => b.id === selectedBlockId);
  const config = block ? FIELD_CONFIG[block.type] : null;

  // ブロックが切り替わったら状態リセット
  useEffect(() => {
    advancedRef.current = false;
    initialTargetIdRef.current = null;
  }, [block?.id]);

  // 吹き出し: blur / Enter で入力済みなら自動進行
  useEffect(() => {
    if (block?.type !== 'speech') return;
    let cleanup: (() => void) | null = null;

    const attach = (el: HTMLTextAreaElement): void => {
      const tryAdvance = () => {
        if (advancedRef.current) return;
        if (!el.value.trim()) return;
        advancedRef.current = true;
        onNextRef.current();
      };
      const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Enter') tryAdvance(); };
      el.addEventListener('blur', tryAdvance);
      el.addEventListener('keydown', onKeydown);
      cleanup = () => {
        el.removeEventListener('blur', tryAdvance);
        el.removeEventListener('keydown', onKeydown);
      };
    };

    const el = document.getElementById('speech-editor-message') as HTMLTextAreaElement | null;
    if (el) {
      attach(el);
    } else {
      // 要素がまだ DOM にない場合は出現を待つ
      const observer = new MutationObserver(() => {
        const found = document.getElementById('speech-editor-message') as HTMLTextAreaElement | null;
        if (found) { observer.disconnect(); attach(found); }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      cleanup = () => observer.disconnect();
    }

    return () => cleanup?.();
  }, [block?.type]);

  // スポットライト: 初期 targetId を記録
  useEffect(() => {
    if (block?.type !== 'input-spotlight') return;
    if (initialTargetIdRef.current === null) {
      initialTargetIdRef.current = (block as { targetId: string }).targetId ?? '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block?.id]);

  // スポットライト: targetId が空 → 非空に変わったら自動進行
  useEffect(() => {
    if (block?.type !== 'input-spotlight') return;
    if (advancedRef.current) return;
    if (initialTargetIdRef.current === null) return;
    const currentTargetId = (block as { targetId: string }).targetId;
    if (!initialTargetIdRef.current && currentTargetId) {
      advancedRef.current = true;
      onNextRef.current();
    }
  }, [blocks, block?.type]);

  const measure = useCallback(() => {
    if (!config) return;
    const el = document.getElementById(config.targetId);
    if (!el) {
      if (retryRef.current < 20) { retryRef.current++; setTimeout(measure, 100); }
      return;
    }
    const r = el.getBoundingClientRect();
    setFieldRect({ left: r.left, top: r.top, width: r.width, height: r.height });

    if (config.secondTargetId) {
      const el2 = document.getElementById(config.secondTargetId);
      if (el2) {
        const r2 = el2.getBoundingClientRect();
        setSecondRect({ left: r2.left, top: r2.top, width: r2.width, height: r2.height });
      }
    }
  }, [config?.targetId, config?.secondTargetId]);

  useEffect(() => {
    retryRef.current = 0;
    setFieldRect(null);
    setSecondRect(null);
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    // ResizeDivider はウィンドウリサイズを発火しないため ResizeObserver で補完
    // ターゲット要素 (内部 ResizeDivider) と preview-iframe (外部 ResizeDivider) の両方を監視
    const ro = new ResizeObserver(measure);
    const targetEl  = config?.targetId       ? document.getElementById(config.targetId)       : null;
    const secondEl  = config?.secondTargetId ? document.getElementById(config.secondTargetId) : null;
    const iframeEl  = document.getElementById('preview-iframe');
    targetEl  && ro.observe(targetEl);
    secondEl  && secondEl !== iframeEl && ro.observe(secondEl);
    iframeEl  && ro.observe(iframeEl);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); ro.disconnect(); };
  }, [measure, config?.targetId, config?.secondTargetId]);

  const PAD = 6;

  return createPortal(
    <>
      {/* Spotlight: フィールド（＋オプションでプレビュー）を露出 */}
      <svg style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 40, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <mask id="tour-field-mask">
            <rect width="100%" height="100%" fill="white" />
            {fieldRect && (
              <rect
                x={fieldRect.left - PAD} y={fieldRect.top - PAD}
                width={fieldRect.width + PAD * 2} height={fieldRect.height + PAD * 2}
                fill="black" rx="8"
              />
            )}
            {secondRect && (
              <rect
                x={secondRect.left - PAD} y={secondRect.top - PAD}
                width={secondRect.width + PAD * 2} height={secondRect.height + PAD * 2}
                fill="black" rx="10"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-field-mask)" />
      </svg>

      {/* パルスリング（メイン） */}
      {fieldRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top:    fieldRect.top    - PAD,
            left:   fieldRect.left   - PAD,
            width:  fieldRect.width  + PAD * 2,
            height: fieldRect.height + PAD * 2,
            borderRadius: 8,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* パルスリング（プレビュー） */}
      {secondRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top:    secondRect.top    - PAD,
            left:   secondRect.left   - PAD,
            width:  secondRect.width  + PAD * 2,
            height: secondRect.height + PAD * 2,
            borderRadius: 10,
            border: '2px solid rgba(99,102,241,0.9)',
            zIndex: 42,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* 説明ツールチップ */}
      <DraggableTourPanel stepLabel={`${FIELD_STEP_INDEX + 1} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
          {config ? config.message : 'ブロックの設定を確認して入力してください。'}
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          {config ? config.sub : '各フィールドを埋めてエラーを修正しましょう。'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onSkip} style={{ fontSize: 12, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>スキップ</button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Interactive drag step ─────────────────────────────────────────────────

function InteractiveDragStep({
  stageIndex,
  onSkip,
}: {
  stageIndex: number;
  onSkip: () => void;
}) {
  const [dragPos, setDragPos] = useState<DragPos | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const stage = DRAG_STAGES[stageIndex];

  const measure = useCallback((): boolean => {
    // data-block-type で各パレットアイテムを特定（dnd-kit の id は DOM id ではないため）
    const paletteItem     = document.querySelector(`[data-block-type="${stage.paletteType}"]`) as HTMLElement | null;
    const paletteContainer = document.getElementById('block-palette') as HTMLElement | null;
    const canvas           = document.getElementById('editor-canvas')  as HTMLElement | null;

    if (!paletteItem || !paletteContainer || !canvas) return false;

    const ir = paletteItem.getBoundingClientRect();
    const pr = paletteContainer.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();

    // 対象外パレットアイテムの rect を収集（個別ブロッカー用）
    const otherPaletteRects: Rect4[] = [];
    document.querySelectorAll<HTMLElement>('[data-block-type]').forEach((el) => {
      if (el.dataset.blockType === stage.paletteType) return;
      const r = el.getBoundingClientRect();
      otherPaletteRects.push({ left: r.left, top: r.top, width: r.width, height: r.height });
    });

    setDragPos({
      startX: ir.left + ir.width  / 2,
      startY: ir.top  + ir.height / 2,
      endX:   cr.left + cr.width  / 2,
      endY:   cr.top  + Math.min(160, cr.height * 0.3),
      paletteRect:          { left: ir.left, top: ir.top, width: ir.width, height: ir.height },
      paletteContainerRect: { left: pr.left, top: pr.top, width: pr.width, height: pr.height },
      canvasRect:           { left: cr.left, top: cr.top, width: cr.width, height: cr.height },
      otherPaletteRects,
    });
    return true;
  }, [stage.paletteType]);

  useEffect(() => {
    setDragPos(null);
    observerRef.current?.disconnect();

    const rafId = requestAnimationFrame(() => {
      if (measure()) return;
      // 要素がまだ DOM にない場合は MutationObserver で出現を待つ
      const observer = new MutationObserver(() => {
        if (measure()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      observerRef.current = observer;
    });

    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(rafId);
      observerRef.current?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, stageIndex]);

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;

  // パレットはコンテナ全体をドラッグ可能エリアとしてブロッカーから除外
  const blockers = dragPos
    ? buildBlockers(dragPos.paletteContainerRect, dragPos.canvasRect, vw, vh)
    : [];

  return createPortal(
    <>
      {/* Visual overlay – SVG mask with holes for palette + canvas */}
      <svg
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 40, pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {dragPos && (
              <>
                <rect
                  x={dragPos.paletteRect.left - 6} y={dragPos.paletteRect.top - 6}
                  width={dragPos.paletteRect.width + 12} height={dragPos.paletteRect.height + 12}
                  fill="black" rx="10"
                />
                <rect
                  x={dragPos.canvasRect.left - 6} y={dragPos.canvasRect.top - 6}
                  width={dragPos.canvasRect.width + 12} height={dragPos.canvasRect.height + 12}
                  fill="black" rx="10"
                />
              </>
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#tour-spotlight-mask)" />

        {/* Dashed trajectory line */}
        {dragPos && (
          <line
            x1={dragPos.startX} y1={dragPos.startY}
            x2={dragPos.endX}   y2={dragPos.endY}
            style={{ stroke: 'var(--tour-drag-dash)' }}
            strokeWidth="2.5"
            strokeDasharray="9 6"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Pointer-event blockers for dark areas */}
      {blockers.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            top: b.top, left: b.left,
            width: b.width, height: b.height,
            zIndex: 41,
            pointerEvents: 'all',
          }}
        />
      ))}

      {/* 対象外パレットアイテムの個別ブロッカー（ドラッグ不可にする） */}
      {dragPos && dragPos.otherPaletteRects.map((r, i) => (
        <div
          key={`other-${i}`}
          style={{
            position: 'fixed',
            top: r.top, left: r.left,
            width: r.width, height: r.height,
            zIndex: 42,
            pointerEvents: 'all',
            cursor: 'not-allowed',
          }}
        />
      ))}

      {/* Animated block card */}
      {dragPos && <DragBlockCard pos={dragPos} stage={stage} />}

      {/* Instruction tooltip */}
      <DraggableTourPanel key={stageIndex} stepLabel={`${stageIndex + 1} / ${TOTAL_STEPS}`}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>{stage.emoji} {stage.label}</span>をキャンバスへドラッグして配置してみましょう
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>
          ブロックパレットからドラッグ＆ドロップで追加できます
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
          </span>
          <button
            onClick={onSkip}
            style={{
              fontSize: 12, color: '#9ca3af', background: 'none',
              border: 'none', cursor: 'pointer', padding: '2px 4px',
            }}
          >
            スキップ
          </button>
        </div>
      </DraggableTourPanel>
    </>,
    document.body
  );
}

// ─── Tour state persistence ────────────────────────────────────────────────

export const TOUR_STATE_KEY = 'tebiki-chart_tour_state';

type TourPersistedState = {
  phase: Phase;
  dragStageIndex: number;
  tooltipStep: number;
  fillPhaseIndex: number;
  fillDoneCount: number;
  hintStepDone: boolean;
  fieldDone: boolean;
  ribbonStepDone: boolean;
  speechClearDone: boolean;
  runPreviewDone: boolean;
  themeStepDone: boolean;
  showCompletion: boolean;
};

function loadTourState(): Partial<TourPersistedState> | null {
  try {
    const raw = localStorage.getItem(TOUR_STATE_KEY);
    return raw ? (JSON.parse(raw) as TourPersistedState) : null;
  } catch {
    return null;
  }
}

function saveTourState(s: TourPersistedState): void {
  try {
    localStorage.setItem(TOUR_STATE_KEY, JSON.stringify(s));
  } catch { /* quota exceeded などを無視 */ }
}

// ─── Draggable tour panel ──────────────────────────────────────────────────

// ステップをまたいで位置を引き継ぐためのモジュールレベル変数
let _tourPanelPos: { left: number; top: number } | null = null;

/**
 * チュートリアル全フェーズで共有するドラッグ移動可能な指示パネル。
 * ドラッグ後の位置は次のステップでも引き継がれる。
 */
function DraggableTourPanel({
  children,
  initialBottom,
  initialLeft,
  initialTop,
  width = 300,
  stepLabel,
}: {
  children: React.ReactNode;
  initialBottom?: number;
  initialLeft?: number;
  initialTop?: number;
  width?: number;
  stepLabel?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // props をマウント時の値として ref に保持（再レンダー後も初期値を参照できるようにする）
  const initTopRef    = useRef(initialTop);
  const initLeftRef   = useRef(initialLeft);
  const initBottomRef = useRef(initialBottom);

  // マウント直後（ペイント前）に位置を確定させる
  // React の style prop には top/left/bottom/transform を含めないことで
  // 親コンポーネントの再レンダーによる上書きを防ぐ
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    if (_tourPanelPos && _tourPanelPos.top > 8) {
      // 前ステップでドラッグ済みの位置を引き継ぐ
      el.style.top       = `${_tourPanelPos.top}px`;
      el.style.left      = `${_tourPanelPos.left}px`;
    } else if (initTopRef.current !== undefined && initTopRef.current > 8) {
      // 計算済み top/left で配置
      el.style.top  = `${initTopRef.current}px`;
      el.style.left = `${initLeftRef.current ?? 0}px`;
    } else {
      // 画面下部中央に配置
      const bottom = initBottomRef.current ?? 32;
      el.style.top  = `${window.innerHeight - bottom - el.offsetHeight}px`;
      el.style.left = `${window.innerWidth  / 2 - width / 2}px`;
    }
    el.style.bottom    = 'auto';
    el.style.transform = 'none';

    // アンマウント時に現在位置を保存 → 次ステップで引き継ぐ
    return () => {
      const left = parseFloat(el.style.left);
      const top  = parseFloat(el.style.top);
      if (!isNaN(left) && !isNaN(top)) {
        _tourPanelPos = { left, top };
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const el = panelRef.current;
    if (!el) return;

    // 現在の実際の位置を取得して top/left に固定
    const rect = el.getBoundingClientRect();
    el.style.top       = `${rect.top}px`;
    el.style.left      = `${rect.left}px`;
    el.style.bottom    = 'auto';
    el.style.transform = 'none';

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startLeft   = rect.left;
    const startTop    = rect.top;

    el.style.transition = 'none';
    el.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      el.style.left = `${startLeft + ev.clientX - startMouseX}px`;
      el.style.top  = `${startTop  + ev.clientY - startMouseY}px`;
    };
    const onUp = () => {
      // ドラッグ終了時に位置を保存 → 次ステップへ引き継ぐ
      _tourPanelPos = {
        left: parseFloat(el.style.left),
        top:  parseFloat(el.style.top),
      };
      el.style.transition = '';
      el.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',  onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',  onUp);
  }, []);

  // 位置プロパティ（top/left/bottom/transform）は useLayoutEffect で設定するため
  // style prop には含めない（含めると親の再レンダーで上書きされる）
  const baseStyle: CSSProperties = {
    position: 'fixed',
    zIndex: 44,
    width,
    pointerEvents: 'auto',
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    padding: 16,
    cursor: 'grab',
  };

  return (
    <div ref={panelRef} style={baseStyle} onMouseDown={handleMouseDown}>
      {/* ドラッグハンドル＋ステップ番号 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, userSelect: 'none' }}>
        <span style={{ color: '#d1d5db', fontSize: 12 }}>⠿</span>
        {stepLabel && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 9999 }}>
            ステップ {stepLabel}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Build blocking divs that cover everything OUTSIDE the two highlight rects */
function buildBlockers(
  pr: { left: number; top: number; width: number; height: number },
  cr: { left: number; top: number; width: number; height: number },
  vw: number,
  vh: number,
) {
  const minTop    = Math.min(pr.top, cr.top);
  const maxBottom = Math.max(pr.top + pr.height, cr.top + cr.height);
  const minLeft   = Math.min(pr.left, cr.left);
  const maxRight  = Math.max(pr.left + pr.width, cr.left + cr.width);

  return [
    { top: 0,          left: 0,       width: vw,            height: minTop            }, // top
    { top: maxBottom,  left: 0,       width: vw,            height: vh - maxBottom    }, // bottom
    { top: minTop,     left: 0,       width: minLeft,       height: maxBottom - minTop }, // left
    { top: minTop,     left: maxRight, width: vw - maxRight, height: maxBottom - minTop }, // right
    // gap between palette-right and canvas-left (horizontal between panels)
    ...(pr.left + pr.width < cr.left
      ? [{
          top: minTop,
          left: pr.left + pr.width,
          width: cr.left - (pr.left + pr.width),
          height: maxBottom - minTop,
        }]
      : []),
  ].filter(b => b.width > 0 && b.height > 0);
}

// ─── Tooltip steps (2 onward) ──────────────────────────────────────────────

interface DOMRect2 { top: number; left: number; width: number; height: number }

function TooltipSteps({
  step, displayOffset = 0, onNext, onSkip, onComplete,
}: {
  step: number; displayOffset?: number; onNext: () => void; onSkip: () => void; onComplete: () => void;
}) {
  const [rect, setRect] = useState<DOMRect2 | null>(null);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const posAppliedRef = useRef(false); // 現ステップで位置を確定済みか
  const currentStep = TOUR_STEPS[step];
  const advance = step < TOUR_STEPS.length - 1 ? onNext : onComplete;

  const updateRect = useCallback(() => {
    const el = document.getElementById(currentStep.targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [currentStep.targetId]);

  // ステップ変化時: フラグをリセット
  useEffect(() => {
    posAppliedRef.current = false;
    setVisible(false);
    dragOffsetRef.current = { x: 0, y: 0 };
    const t = setTimeout(() => { updateRect(); setVisible(true); }, 50);
    return () => clearTimeout(t);
  }, [step, updateRect]);

  useEffect(() => {
    window.addEventListener('resize', updateRect);
    // ResizeDivider はウィンドウリサイズを発火しないため ResizeObserver で補完
    // ターゲット要素自体 (内部 ResizeDivider によるリサイズ) と
    // preview-iframe (外部 ResizeDivider によるリサイズ) の両方を監視する
    const ro = new ResizeObserver(updateRect);
    const targetEl = document.getElementById(currentStep.targetId);
    const iframeEl = document.getElementById('preview-iframe');
    targetEl && ro.observe(targetEl);
    iframeEl && ro.observe(iframeEl);
    return () => { window.removeEventListener('resize', updateRect); ro.disconnect(); };
  }, [updateRect, currentStep.targetId]);

  // waitForClick: ターゲット要素のクリックで自動進行
  useEffect(() => {
    if (!currentStep.waitForClick) return;
    const el = document.getElementById(currentStep.targetId);
    if (!el) return;
    el.addEventListener('click', advance);
    return () => el.removeEventListener('click', advance);
  }, [currentStep.waitForClick, currentStep.targetId, advance]);

  // waitForClickIn: 指定コンテナ内の子クリックで自動進行
  useEffect(() => {
    if (!currentStep.waitForClickIn) return;
    const el = document.getElementById(currentStep.waitForClickIn);
    if (!el) return;
    el.addEventListener('click', advance);
    return () => el.removeEventListener('click', advance);
  }, [currentStep.waitForClickIn, advance]);

  // waitForClickIn: パルスリング用の rect を計測
  const [clickInRect, setClickInRect] = useState<DOMRect2 | null>(null);
  useEffect(() => {
    if (!currentStep.waitForClickIn) { setClickInRect(null); return; }
    const measure = () => {
      const el = document.getElementById(currentStep.waitForClickIn!);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setClickInRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    // ResizeDivider はウィンドウリサイズを発火しないため ResizeObserver で補完
    const iframeEl = document.getElementById('preview-iframe');
    const ro = iframeEl ? new ResizeObserver(measure) : null;
    iframeEl && ro?.observe(iframeEl);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); ro?.disconnect(); };
  }, [step, currentStep.waitForClickIn]);

  // rect 確定後に位置を DOM に適用（_tourPanelPos 優先、なければターゲット相対位置）
  useLayoutEffect(() => {
    if (!rect || !tooltipRef.current || posAppliedRef.current) return;
    posAppliedRef.current = true;
    const el = tooltipRef.current;
    const TW2 = 256, TH2 = 140;
    if (_tourPanelPos) {
      el.style.top  = `${_tourPanelPos.top}px`;
      el.style.left = `${_tourPanelPos.left}px`;
    } else {
      let tT: number, tL: number;
      if (currentStep.position === 'bottom') {
        tT = rect.top + rect.height + 16;
        tL = rect.left + rect.width / 2 - TW2 / 2;
      } else {
        tT = rect.top;
        tL = currentStep.position === 'right'
          ? rect.left + rect.width + 16
          : rect.left - TW2 - 16;
      }
      if (tT + TH2 > window.innerHeight - 16) tT = window.innerHeight - TH2 - 16;
      if (tT < 8) tT = 8;
      el.style.top  = `${tT}px`;
      el.style.left = `${tL}px`;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect]);

  // Direct DOM drag — top/left を直接操作
  const handleDragStart = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    const el = tooltipRef.current;
    if (!el) return;
    const baseLeft = parseFloat(el.style.left) || 0;
    const baseTop  = parseFloat(el.style.top)  || 0;
    const mouseStartX = e.clientX;
    const mouseStartY = e.clientY;
    el.style.transition = 'none';
    el.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - mouseStartX;
      const dy = ev.clientY - mouseStartY;
      el.style.left = `${baseLeft + dx}px`;
      el.style.top  = `${baseTop  + dy}px`;
    };
    const onUp = () => {
      // ドラッグ終了時に位置を保存 → 次ステップへ引き継ぐ
      _tourPanelPos = {
        left: parseFloat(el.style.left),
        top:  parseFloat(el.style.top),
      };
      el.style.transition = '';
      el.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  if (!rect) return null;

  const PAD = 8, TW = 256;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const blockers = !currentStep.noSpotlight
    ? buildBlockers(
        { left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 },
        { left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 },
        vw, vh,
      )
    : [];

  return createPortal(
    <>
      {!currentStep.noSpotlight && (
        <div
          className="fixed z-40 rounded-lg pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }}
        />
      )}
      {/* ハイライト範囲外のポインターイベントをブロック */}
      {blockers.map((b, i) => (
        <div key={i} style={{ position: 'fixed', top: b.top, left: b.left, width: b.width, height: b.height, zIndex: 41, pointerEvents: 'all' }} />
      ))}
      {/* waitForClickIn: エラーリストなど子クリック待ちのパルスリング */}
      {clickInRect && (
        <div
          className="animate-tour-pulse"
          style={{
            position: 'fixed',
            top:    clickInRect.top    - 4,
            left:   clickInRect.left   - 4,
            width:  clickInRect.width  + 8,
            height: clickInRect.height + 8,
            borderRadius: 8,
            border: '2px solid rgba(59,130,246,0.9)',
            zIndex: 55,
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        ref={tooltipRef}
        onMouseDown={handleDragStart}
        className={`fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 cursor-grab select-none transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: TW }}
      >
        {/* ドラッグハンドルヘッダー */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-300 dark:text-gray-600 text-xs leading-none">⠿</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
            ステップ {MENU_STEP_INDEX + 1 + step + 1 + displayOffset} / {TOTAL_STEPS}
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-200 mb-3 leading-relaxed">
          {currentStep.message}
        </p>
        <div
          className="flex justify-end items-center gap-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-1 cursor-pointer select-auto"
          >
            スキップ
          </button>
          {!currentStep.waitForClick && !currentStep.waitForClickIn && (
            <button
              onClick={advance}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer select-auto"
            >
              {step < TOUR_STEPS.length - 1 ? '次へ →' : '完了'}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── Completion overlay ────────────────────────────────────────────────────

function CompletionOverlay({ onDismiss }: { onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 30); return () => clearTimeout(t); }, []);

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        transition: 'opacity 0.3s',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          padding: '36px 32px',
          width: 340,
          textAlign: 'center',
          transform: visible ? 'scale(1)' : 'scale(0.92)',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s',
          opacity: visible ? 1 : 0,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          チュートリアル完了！
        </p>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 8 }}>
          すべてのステップをお疲れ様でした。<br />
          基本操作はバッチリです！
        </p>
        <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 24 }}>
          あとは自由にブロックを組み合わせて、<br />
          あなただけのチュートリアルを作ってみましょう。<br />
          応援しています 🚀
        </p>
        <button
          onClick={onDismiss}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '10px 32px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          はじめる
        </button>
      </div>
    </div>,
    document.body
  );
}

// ─── Orchestrator ──────────────────────────────────────────────────────────

interface Props {
  active: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onPhaseChange?: (phase: string) => void;
}

type Phase = 'drag' | 'reorder' | 'menu' | 'fill' | 'block-hint' | 'ribbon' | 'speech-clear' | 'run-preview' | 'tooltip' | 'field' | 'theme';

function TourOrchestrator({ onComplete, onSkip, onPhaseChange }: Omit<Props, 'active'>) {
  const blockCount = useEditorStore((s) => s.scenario?.blocks.length ?? 0);
  const blocks     = useEditorStore((s) => s.scenario?.blocks ?? []);

  // localStorage から保存済み状態を復元（lazy initializer により初回マウント時のみ読み込む）
  const [phase, setPhase]               = useState<Phase>          (() => { const s = loadTourState(); return s?.phase          ?? 'drag';  });
  const [dragStageIndex, setDragStageIndex] = useState<number>     (() => { const s = loadTourState(); return s?.dragStageIndex ?? 0;       });
  const [tooltipStep, setTooltipStep]   = useState<number>         (() => { const s = loadTourState(); return s?.tooltipStep    ?? 0;       });
  const [fillPhaseIndex,  setFillPhaseIndex]  = useState<number>   (() => { const s = loadTourState(); return s?.fillPhaseIndex  ?? 0;      });
  const [fillDoneCount,   setFillDoneCount]   = useState<number>   (() => { const s = loadTourState(); return s?.fillDoneCount   ?? 0;      });
  const [hintStepDone,    setHintStepDone]    = useState<boolean>  (() => { const s = loadTourState(); return s?.hintStepDone    ?? false;  });
  const [fieldDone,       setFieldDone]       = useState<boolean>  (() => { const s = loadTourState(); return s?.fieldDone       ?? false;  });
  const [ribbonStepDone,  setRibbonStepDone]  = useState<boolean>  (() => { const s = loadTourState(); return s?.ribbonStepDone  ?? false;  });
  const [speechClearDone, setSpeechClearDone] = useState<boolean>  (() => { const s = loadTourState(); return s?.speechClearDone ?? false;  });
  const [runPreviewDone,  setRunPreviewDone]  = useState<boolean>  (() => { const s = loadTourState(); return s?.runPreviewDone  ?? false;  });
  const [themeStepDone,   setThemeStepDone]   = useState<boolean>  (() => { const s = loadTourState(); return s?.themeStepDone   ?? false;  });
  const [showCompletion,  setShowCompletion]  = useState<boolean>  (() => { const s = loadTourState(); return s?.showCompletion  ?? false;  });
  const prevBlockCountRef = useRef(blockCount);

  // 状態が変化するたびに localStorage へ保存
  useEffect(() => {
    saveTourState({
      phase, dragStageIndex, tooltipStep, fillPhaseIndex, fillDoneCount,
      hintStepDone, fieldDone, ribbonStepDone, speechClearDone, runPreviewDone,
      themeStepDone, showCompletion,
    });
  }, [phase, dragStageIndex, tooltipStep, fillPhaseIndex, fillDoneCount,
      hintStepDone, fieldDone, ribbonStepDone, speechClearDone, runPreviewDone,
      themeStepDone, showCompletion]);

  useEffect(() => { onPhaseChange?.(phase); }, [phase, onPhaseChange]);
  // 並び替えステップ開始時の speech / spotlight の相対順序を記録
  const initialOrderRef = useRef<{ speechFirst: boolean } | null>(null);

  // ─ ドラッグフェーズ: ブロックが追加されたら次のステージへ ─
  useEffect(() => {
    const prev = prevBlockCountRef.current;
    prevBlockCountRef.current = blockCount;

    if (phase !== 'drag') return;
    if (blockCount > prev) {
      setDragStageIndex((s) => {
        if (s + 1 >= DRAG_STAGES.length) {
          setPhase('reorder');
          return s;
        }
        return s + 1;
      });
    }
  }, [blockCount, phase]);

  // ─ 並び替えフェーズ開始時: 初期順序を記録 ─
  useEffect(() => {
    if (phase !== 'reorder') return;
    const si  = blocks.findIndex((b: Block) => b.type === 'speech');
    const spi = blocks.findIndex((b: Block) => b.type === 'input-spotlight');
    if (si !== -1 && spi !== -1) {
      initialOrderRef.current = { speechFirst: si < spi };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─ 並び替えフェーズ: 順序が入れ替わったらツールチップフェーズへ ─
  useEffect(() => {
    if (phase !== 'reorder' || !initialOrderRef.current) return;
    const si  = blocks.findIndex((b: Block) => b.type === 'speech');
    const spi = blocks.findIndex((b: Block) => b.type === 'input-spotlight');
    if (si === -1 || spi === -1) return;

    const currentSpeechFirst = si < spi;
    if (currentSpeechFirst !== initialOrderRef.current.speechFirst) {
      setPhase('menu');
    }
  }, [blocks, phase]);

  if (phase === 'drag') {
    return <InteractiveDragStep stageIndex={dragStageIndex} onSkip={onSkip} />;
  }

  if (phase === 'reorder') {
    return <InteractiveReorderStep onSkip={onSkip} />;
  }

  if (phase === 'menu') {
    return <InteractiveMenuStep onNext={() => { setFillPhaseIndex(0); setPhase('fill'); }} onSkip={onSkip} />;
  }

  if (phase === 'fill') {
    const domIndex = fillPhaseIndex + 1; // 2nd block = DOM index 1, 3rd = 2
    // fill 0 = step 5, fill 1 = step 7 (hint takes step 6)
    const stepDisplay = fillPhaseIndex === 0 ? MENU_STEP_INDEX + 2 : MENU_STEP_INDEX + 4;
    return (
      <InteractiveBlockFillStep
        domIndex={domIndex}
        stepDisplay={stepDisplay}
        onNext={() => {
          const next = fillPhaseIndex + 1;
          setFillDoneCount(next);
          if (next < 2) {
            setPhase('block-hint'); // fill 0 完了 → ヒント表示
          } else {
            setPhase('ribbon');     // fill 1 完了 → リボンへ
          }
        }}
        onSkip={onSkip}
      />
    );
  }

  if (phase === 'block-hint') {
    return (
      <InteractiveBlockHintStep
        domIndex={2} // 3番目のブロック
        onNext={() => { setHintStepDone(true); setFillPhaseIndex(1); setPhase('fill'); }}
        onSkip={onSkip}
      />
    );
  }

  if (phase === 'ribbon') {
    return (
      <InteractiveRibbonStep
        onNext={() => { setRibbonStepDone(true); setPhase('speech-clear'); }}
        onSkip={onSkip}
      />
    );
  }

  if (phase === 'speech-clear') {
    return (
      <InteractiveSpeechClearStep
        onNext={() => { setSpeechClearDone(true); setPhase('run-preview'); }}
        onSkip={onSkip}
      />
    );
  }

  if (phase === 'run-preview') {
    return (
      <InteractiveRunPreviewStep
        onNext={() => { setRunPreviewDone(true); setPhase('tooltip'); }}
        onSkip={onSkip}
      />
    );
  }

  if (phase === 'field') {
    return (
      <InteractiveFieldStep
        onNext={() => { setFieldDone(true); setTooltipStep(s => s + 1); setPhase('tooltip'); }}
        onSkip={onSkip}
      />
    );
  }

  if (phase === 'theme') {
    return (
      <InteractiveThemeStep
        onNext={() => { setThemeStepDone(true); setTooltipStep(s => s + 1); setPhase('tooltip'); }}
        onSkip={onSkip}
      />
    );
  }

  if (showCompletion) {
    return <CompletionOverlay onDismiss={onComplete} />;
  }

  return (
    <TooltipSteps
      step={tooltipStep}
      displayOffset={fillDoneCount + (hintStepDone ? 1 : 0) + (ribbonStepDone ? 1 : 0) + (speechClearDone ? 1 : 0) + (runPreviewDone ? 1 : 0) + (fieldDone ? 1 : 0) + (themeStepDone ? 1 : 0)}
      onNext={() => {
        if (TOUR_STEPS[tooltipStep]?.transitionToField) {
          setPhase('field');
        } else if (TOUR_STEPS[tooltipStep]?.transitionToTheme) {
          setPhase('theme');
        } else {
          setTooltipStep(s => s + 1);
        }
      }}
      onSkip={onSkip}
      onComplete={() => setShowCompletion(true)}
    />
  );
}


export default function EditorTour({ active, onComplete, onSkip, onPhaseChange }: Props) {
  if (!active || typeof document === 'undefined') return null;
  const handleComplete = () => {
    _tourPanelPos = null;
    localStorage.removeItem(TOUR_STATE_KEY);
    onComplete();
  };
  const handleSkip = () => {
    _tourPanelPos = null;
    localStorage.removeItem(TOUR_STATE_KEY);
    onSkip();
  };
  return <TourOrchestrator onComplete={handleComplete} onSkip={handleSkip} onPhaseChange={onPhaseChange} />;
}

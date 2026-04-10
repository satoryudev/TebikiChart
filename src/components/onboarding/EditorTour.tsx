'use client';

import { useEffect, useState, useCallback, useRef, MouseEvent as ReactMouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/store/editorStore';
import { SpeechBlock, InputSpotlightBlock } from '@/types/scenario';

type WaitFor =
  | 'add-speech'
  | 'speech-has-text'
  | 'add-spotlight'
  | 'spotlight-block-selected'
  | 'spotlight-has-target'
  | 'is-playing';

interface TourStep {
  targetId: string;
  additionalTargetIds?: string[];
  title: string;
  message: string;
  instruction: string;
  position: 'left' | 'right' | 'bottom';
  waitFor: WaitFor;
  requireBlur?: boolean;
  /** パレットで操作可能にするブロックタイプ（null=全て無効） */
  allowedPaletteTypes: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'palette-item-speech',
    title: 'ステップ 1：ブロックを追加',
    message: '💬 吹き出しブロックでキャラクターのセリフや説明文を表示できます。',
    instruction: 'クリックするか、右のキャンバスにドラッグして追加してみましょう',
    position: 'right',
    waitFor: 'add-speech',
    allowedPaletteTypes: ['speech'],
  },
  {
    targetId: 'editor-canvas',
    additionalTargetIds: ['block-editor'],
    title: 'ステップ 2：テキストを入力',
    message: '✏️ 追加したブロックにセリフを入力しましょう。',
    instruction: 'ブロック右上の「⋮」をクリック → テキストを入力 → 外をクリックか「次へ」を押してください',
    position: 'right',
    waitFor: 'speech-has-text',
    requireBlur: true,
    allowedPaletteTypes: [],
  },
  {
    targetId: 'palette-item-input-spotlight',
    title: 'ステップ 3：スポットライトブロックを追加',
    message: '🎯 HTMLのボタンや入力フォームを強調してユーザーを誘導できます。',
    instruction: 'スポットライトブロックをクリックまたはドラッグして追加してください',
    position: 'right',
    waitFor: 'add-spotlight',
    allowedPaletteTypes: ['input-spotlight'],
  },
  {
    targetId: 'editor-canvas',
    title: 'ステップ 4：ブロック設定を開く',
    message: '⚙️ 追加したスポットライトブロックの設定を開きましょう。',
    instruction: 'キャンバス上のスポットライトブロック右上の「⋮」をクリックしてください',
    position: 'right',
    waitFor: 'spotlight-block-selected',
    allowedPaletteTypes: [],
  },
  {
    targetId: 'preview-pane',
    additionalTargetIds: ['block-editor'],
    title: 'ステップ 5：HTML要素を指定',
    message: '🖱️ プレビュー上の要素をクリックして、スポットライトの対象を指定できます。',
    instruction: 'ブロック設定の「🎯 要素を選択」を押し、プレビューの要素をクリックしてください',
    position: 'left',
    waitFor: 'spotlight-has-target',
    allowedPaletteTypes: [],
  },
  {
    targetId: 'preview-play-btn',
    title: 'ステップ 6：再生して確認',
    message: '▶ 作成したシナリオを実際に動かして確認しましょう。',
    instruction: '「▶ 実行」ボタンを押してシナリオを確認してください',
    position: 'bottom',
    waitFor: 'is-playing',
    allowedPaletteTypes: [],
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  active: boolean;
  isPlaying: boolean;
  onLockBlock?: (blockId: string | null) => void;
  onComplete: () => void;
  onSkip: () => void;
}

function getElementRect(id: string, pad: number): Rect | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
}

function TourOverlay({ isPlaying, onLockBlock, onComplete, onSkip }: Omit<Props, 'active'>) {
  const [step, setStep] = useState(0);
  const [primaryRect, setPrimaryRect] = useState<Rect | null>(null);
  const [additionalRects, setAdditionalRects] = useState<Rect[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [doneFlash, setDoneFlash] = useState(false);
  const advancingRef = useRef(false);
  // Drag: use ref + direct DOM to avoid React re-renders on every mousemove
  const tooltipRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const scenario = useEditorStore((s) => s.scenario);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const currentStep = TOUR_STEPS[step];
  const PAD = 10;

  const updateRects = useCallback(() => {
    setPrimaryRect(getElementRect(currentStep.targetId, PAD));
    const extras = (currentStep.additionalTargetIds ?? [])
      .map((id) => getElementRect(id, PAD))
      .filter((r): r is Rect => r !== null);
    setAdditionalRects(extras);
  }, [currentStep.targetId, currentStep.additionalTargetIds]);

  useEffect(() => {
    advancingRef.current = false;
    // Reset drag offset on step change
    dragOffsetRef.current = { x: 0, y: 0 };
    if (tooltipRef.current) tooltipRef.current.style.transform = '';
    setTooltipVisible(false);
    setDoneFlash(false);
    const t = setTimeout(() => {
      updateRects();
      setTooltipVisible(true);
    }, 150);
    return () => clearTimeout(t);
  }, [step, updateRects]);

  // パレットフィルターイベントを発火（ステップ変化 & アンマウント時にリセット）
  useEffect(() => {
    document.dispatchEvent(
      new CustomEvent('tebiki-chart:tour-palette-filter', {
        detail: { allowedTypes: currentStep.allowedPaletteTypes },
      })
    );
    return () => {
      document.dispatchEvent(
        new CustomEvent('tebiki-chart:tour-palette-filter', { detail: { allowedTypes: null } })
      );
    };
  }, [step, currentStep.allowedPaletteTypes]);

  useEffect(() => {
    window.addEventListener('resize', updateRects);
    return () => window.removeEventListener('resize', updateRects);
  }, [updateRects]);

  const advance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    const isLast = step === TOUR_STEPS.length - 1;
    if (isLast) {
      onComplete();
      return;
    }
    setDoneFlash(true);
    setTimeout(() => {
      setDoneFlash(false);
      setStep((s) => s + 1);
    }, 600);
  }, [step, onComplete]);

  // Direct DOM drag — zero React re-renders during move
  const handleDragStart = useCallback((e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.clientX - dragOffsetRef.current.x;
    const startY = e.clientY - dragOffsetRef.current.y;
    const onMove = (ev: MouseEvent) => {
      const x = ev.clientX - startX;
      const y = ev.clientY - startY;
      dragOffsetRef.current = { x, y };
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  // Store-based action detection (skip if requireBlur)
  useEffect(() => {
    if (!scenario || currentStep.requireBlur) return;
    const blocks = scenario.blocks;
    const wf = currentStep.waitFor;

    if (wf === 'add-speech' && blocks.some((b) => b.type === 'speech')) {
      advance();
    } else if (wf === 'add-spotlight' && blocks.some((b) => b.type === 'input-spotlight')) {
      advance();
    } else if (
      wf === 'spotlight-has-target' &&
      blocks.some((b) => b.type === 'input-spotlight' && (b as InputSpotlightBlock).targetId?.trim())
    ) {
      advance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, step]);

  // Detect when spotlight block settings are opened (selectedBlockId → input-spotlight)
  useEffect(() => {
    if (currentStep.waitFor !== 'spotlight-block-selected') return;
    if (!selectedBlockId) return;
    const blocks = useEditorStore.getState().scenario?.blocks ?? [];
    if (blocks.some((b) => b.id === selectedBlockId && b.type === 'input-spotlight')) {
      onLockBlock?.(selectedBlockId);
      advance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlockId, step]);

  // Blur-based detection for steps with requireBlur
  useEffect(() => {
    if (!currentStep.requireBlur) return;
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return;
      const blocks = useEditorStore.getState().scenario?.blocks ?? [];
      if (
        currentStep.waitFor === 'speech-has-text' &&
        blocks.some((b) => b.type === 'speech' && (b as SpeechBlock).message?.trim())
      ) {
        advance();
      }
    };
    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // isPlaying detection for last step
  useEffect(() => {
    if (currentStep.waitFor === 'is-playing' && isPlaying) {
      advance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, step]);

  if (!primaryRect) return null;

  const allRects = [primaryRect, ...additionalRects];

  const TOOLTIP_W = 300;
  const TOOLTIP_H = 190;
  let tooltipTop: number;
  let tooltipLeft: number;

  // ツールチップ位置は PAD なしの実寸で計算（PAD はリング描画のみに使う）
  const anchorEl = document.getElementById(currentStep.targetId);
  const anchor = anchorEl?.getBoundingClientRect() ?? {
    top: primaryRect.top + PAD,
    left: primaryRect.left + PAD,
    width: primaryRect.width - PAD * 2,
    height: primaryRect.height - PAD * 2,
    right: primaryRect.left + primaryRect.width - PAD,
    bottom: primaryRect.top + primaryRect.height - PAD,
  };

  const GAP = 20;
  if (currentStep.position === 'bottom') {
    tooltipTop = anchor.bottom + GAP;
    tooltipLeft = anchor.left + anchor.width / 2 - TOOLTIP_W / 2;
  } else if (currentStep.position === 'right') {
    tooltipTop = anchor.top;
    tooltipLeft = anchor.right + GAP;
  } else {
    tooltipTop = anchor.top;
    tooltipLeft = anchor.left - TOOLTIP_W - GAP;
  }

  if (tooltipTop + TOOLTIP_H > window.innerHeight - 16) tooltipTop = window.innerHeight - TOOLTIP_H - 16;
  if (tooltipTop < 8) tooltipTop = 8;
  if (tooltipLeft < 8) tooltipLeft = 8;
  if (tooltipLeft + TOOLTIP_W > window.innerWidth - 8) tooltipLeft = window.innerWidth - TOOLTIP_W - 8;

  return (
    <>
      {/* SVG overlay with multiple spotlight holes */}
      <svg
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 40, width: '100%', height: '100%' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {allRects.map((r, i) => (
              <rect key={i} x={r.left} y={r.top} width={r.width} height={r.height} rx="10" fill="black" />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.58)" mask="url(#tour-spotlight-mask)" />
      </svg>

      {/* Pulsing rings on all highlighted elements */}
      {allRects.map((r, i) => (
        <div
          key={i}
          className="fixed pointer-events-none"
          style={{ zIndex: 41, top: r.top, left: r.left, width: r.width, height: r.height }}
        >
          <span
            className="absolute inset-0 rounded-xl animate-ping"
            style={{ border: '2px solid rgba(96,165,250,0.7)', animationDuration: '1.4s' }}
          />
          <span className="absolute inset-0 rounded-xl" style={{ border: '2px solid rgba(96,165,250,0.9)' }} />
        </div>
      ))}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-4 transition-opacity duration-200 ${
          tooltipVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: 50, top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W, willChange: 'transform' }}
      >
        {/* Drag handle header */}
        <div
          className="flex items-center gap-2 mb-2 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleDragStart}
          title="ドラッグして移動"
        >
          <span className="text-gray-300 dark:text-gray-600 text-xs leading-none">⠿</span>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
            {step + 1} / {TOUR_STEPS.length}
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {currentStep.title}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
          {currentStep.message}
        </p>

        {/* Instruction box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
            👆 {currentStep.instruction}
          </p>
        </div>

        {/* Done flash */}
        {doneFlash && (
          <div className="absolute inset-0 rounded-2xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400 font-bold text-base">✓ 完了！</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between items-center">
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors px-1"
          >
            スキップ
          </button>
          <button
            onClick={advance}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            {step < TOUR_STEPS.length - 1 ? '次へ →' : '完了'}
          </button>
        </div>
      </div>
    </>
  );
}

export default function EditorTour({ active, isPlaying, onLockBlock, onComplete, onSkip }: Props) {
  if (!active || typeof document === 'undefined') return null;
  const handleComplete = () => { onLockBlock?.(null); onComplete(); };
  const handleSkip = () => { onLockBlock?.(null); onSkip(); };
  return createPortal(
    <TourOverlay isPlaying={isPlaying} onLockBlock={onLockBlock} onComplete={handleComplete} onSkip={handleSkip} />,
    document.body
  );
}

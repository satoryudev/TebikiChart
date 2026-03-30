'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TourStep {
  targetId: string;
  message: string;
  position: 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'block-palette',
    message: 'ここからブロックを追加します。ドラッグまたはクリックでキャンバスに追加できます。',
    position: 'right',
  },
  {
    targetId: 'editor-canvas',
    message: '追加したブロックをここで並べ替えられます。ドラッグ＆ドロップで順序を変更できます。',
    position: 'right',
  },
  {
    targetId: 'preview-pane',
    message: 'リアルタイムでシナリオのプレビューが確認できます。',
    position: 'left',
  },
  {
    targetId: 'block-editor',
    message: 'ブロックを選択すると、ここでテキストや設定を編集できます。',
    position: 'left',
  },
  {
    targetId: 'preview-toolbar',
    message: '完成したらここから実行・エクスポートできます。',
    position: 'left',
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
  onComplete: () => void;
  onSkip: () => void;
}

function TourOverlay({ onComplete, onSkip }: Omit<Props, 'active'>) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const currentStep = TOUR_STEPS[step];

  const updateRect = useCallback(() => {
    const el = document.getElementById(currentStep.targetId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [currentStep.targetId]);

  useEffect(() => {
    setTooltipVisible(false);
    const t = setTimeout(() => {
      updateRect();
      setTooltipVisible(true);
    }, 150);
    return () => clearTimeout(t);
  }, [step, updateRect]);

  useEffect(() => {
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [updateRect]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  if (!rect) return null;

  const PAD = 8;
  const TOOLTIP_W = 256;
  const TOOLTIP_H = 140;

  let tooltipTop = rect.top;
  let tooltipLeft = currentStep.position === 'right'
    ? rect.left + rect.width + 16
    : rect.left - TOOLTIP_W - 16;

  // clamp vertical
  if (tooltipTop + TOOLTIP_H > window.innerHeight - 16) {
    tooltipTop = window.innerHeight - TOOLTIP_H - 16;
  }
  if (tooltipTop < 8) tooltipTop = 8;

  return (
    <>
      {/* Backdrop with spotlight hole */}
      <div
        className="fixed z-40 rounded-lg pointer-events-none transition-all duration-300"
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
        }}
      />

      {/* Tooltip */}
      <div
        className={`fixed z-50 bg-white rounded-xl shadow-2xl p-4 transition-all duration-200 ${
          tooltipVisible ? 'opacity-100 translate-x-0' : currentStep.position === 'right' ? 'opacity-0 translate-x-2' : 'opacity-0 -translate-x-2'
        }`}
        style={{ top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W }}
      >
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">{currentStep.message}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {step + 1} / {TOUR_STEPS.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
            >
              スキップ
            </button>
            <button
              onClick={handleNext}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors"
            >
              {step < TOUR_STEPS.length - 1 ? '次へ →' : '完了'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function EditorTour({ active, onComplete, onSkip }: Props) {
  if (!active || typeof document === 'undefined') return null;
  return createPortal(<TourOverlay onComplete={onComplete} onSkip={onSkip} />, document.body);
}

'use client';

import { useEffect, useRef, useState } from 'react';

const CATEGORIES = [
  { value: 'moving', label: '引越し手続き', emoji: '🏠', desc: '転居届・住所変更の手続き' },
  { value: 'mynumber', label: 'マイナンバー', emoji: '🪪', desc: 'マイナンバーカードの申請・更新' },
  { value: 'tax', label: '税金・確定申告', emoji: '💴', desc: '確定申告・税金の納付手続き' },
  { value: 'childcare', label: '子育て支援', emoji: '👶', desc: '保育所・児童手当の申請' },
] as const;

type Category = (typeof CATEGORIES)[number]['value'];

const DEFAULT_TITLES: Record<Category, string> = {
  moving: '引越し手続きシナリオ',
  mynumber: 'マイナンバー手続きシナリオ',
  tax: '税金・確定申告シナリオ',
  childcare: '子育て支援手続きシナリオ',
};

const STEP_LABELS = ['カテゴリ選択', 'シナリオ名', 'テンプレート']

function WizardStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="px-8 pt-6 pb-4 bg-slate-50 border-b border-gray-100">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        タスクの詳細を設定
      </p>
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
              i < currentStep
                ? 'bg-emerald-500 text-white'
                : i === currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className={`text-xs ml-1 hidden sm:block truncate ${
              i < currentStep ? 'text-emerald-600' : i === currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
            }`}>{label}</span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < currentStep ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface Props {
  onComplete: (data: { category: Category; title: string; useTemplate: boolean }) => void;
  onCancel: () => void;
}

export default function ScenarioWizard({ onComplete, onCancel }: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [useTemplate, setUseTemplate] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [step]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(onCancel);
      if (e.key === 'Enter') {
        if (step === 0 && category) setStep(1);
        else if (step === 1 && title.trim()) setStep(2);
        else if (step === 2) handleFinish();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [step, category, title, useTemplate]);

  const handleClose = (action: () => void) => {
    setMounted(false);
    setTimeout(action, 300);
  };

  const handleCategorySelect = (cat: Category) => {
    setCategory(cat);
    if (!title || Object.values(DEFAULT_TITLES).includes(title)) {
      setTitle(DEFAULT_TITLES[cat]);
    }
  };

  const handleFinish = () => {
    if (!category || !title.trim()) return;
    handleClose(() => onComplete({ category, title: title.trim(), useTemplate }));
  };

  const canNext = step === 0 ? !!category : step === 1 ? !!title.trim() : true;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(onCancel); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transition-all duration-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <WizardStepIndicator currentStep={step} />

        <div className="px-8 pb-6 min-h-[280px]">
          {step === 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">カテゴリを選択</h2>
              <p className="text-sm text-gray-500 mb-4">手続きの種類を選んでください</p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategorySelect(cat.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      category === cat.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <p className="text-sm font-semibold text-gray-800">{cat.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">シナリオ名を入力</h2>
              <p className="text-sm text-gray-500 mb-4">わかりやすい名前をつけましょう</p>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 50))}
                placeholder="例：引越し手続きシナリオ"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-2 text-right">{title.length} / 50</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">テンプレートを選択</h2>
              <p className="text-sm text-gray-500 mb-4">デモシナリオで始めると素早く完成イメージを掴めます</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setUseTemplate(false)}
                  className={`text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    !useTemplate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl">✏️</span>
                  <div>
                    <p className="font-semibold text-gray-800">空白から始める</p>
                    <p className="text-xs text-gray-500 mt-0.5">ゼロからシナリオを作成します</p>
                  </div>
                </button>
                <button
                  onClick={() => setUseTemplate(true)}
                  className={`text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    useTemplate ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-3xl">📋</span>
                  <div>
                    <p className="font-semibold text-gray-800">
                      デモシナリオを使う
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">8ブロック付き</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">サンプルを編集してすぐに始められます</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-8 pb-8 flex justify-between items-center">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : handleClose(onCancel)}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-3 py-2"
          >
            {step === 0 ? 'キャンセル' : '← 戻る'}
          </button>
          <button
            onClick={() => step < 2 ? setStep(step + 1) : handleFinish()}
            disabled={!canNext}
            className={`disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              step < 2
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
            }`}
          >
            {step < 2 ? '次へ →' : '✓ 作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}

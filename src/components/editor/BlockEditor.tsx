'use client'

import { useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import {
  Block,
  StartBlock,
  EndBlock,
  SpeechBlock,
  InputSpotlightBlock,
  BranchBlock,
  BranchOptionColor,
  BRANCH_OPTION_COLOR_CLASSES,
} from '@/types/scenario'
import {
  loadCustomDocTypes,
  saveCustomDocType,
  deleteCustomDocType,
  fileToBase64,
  type CustomDocType,
} from '@/lib/customDocTypes'

/** セレクタ入力欄 + 🎯 ピックボタン */

const VALIDATION_PRESETS = [
  { key: 'name',             label: '氏名（ひらがな・漢字）',       pattern: '^[\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FAF\\u3400-\\u4DBF\\s\\u3000]+$', error: '氏名を入力してください' },
  { key: 'furigana-hira',    label: 'ふりがな（ひらがな）',          pattern: '^[\\u3041-\\u3096\\s\\u3000]+$',                                                   error: 'ひらがなで入力してください' },
  { key: 'furigana-kata',    label: 'ふりがな（カタカナ）',          pattern: '^[\\u30A1-\\u30F6\\s\\u3000]+$',                                                   error: 'カタカナで入力してください' },
  { key: 'email',            label: 'メールアドレス',                pattern: '^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$',                          error: 'メールアドレスを正しく入力してください' },
  { key: 'tel-hyphen',       label: '電話番号（ハイフンあり）',      pattern: '^\\d{2,4}-\\d{2,4}-\\d{4}$',                                                      error: 'ハイフン付きで入力してください（例：03-1234-5678）' },
  { key: 'tel-nohyphen',     label: '電話番号（ハイフンなし）',      pattern: '^\\d{10,11}$',                                                                     error: '10〜11桁の数字で入力してください' },
  { key: 'zip-hyphen',       label: '郵便番号（ハイフンあり）',      pattern: '^\\d{3}-\\d{4}$',                                                                  error: 'ハイフン付きで入力してください（例：123-4567）' },
  { key: 'zip-nohyphen',     label: '郵便番号（ハイフンなし）',      pattern: '^\\d{7}$',                                                                         error: '7桁の数字で入力してください' },
  { key: 'password-alphanum',label: 'パスワード（英数字混合）',      pattern: '^(?=.*[a-zA-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$',                                        error: '英字と数字を含む8文字以上で入力してください' },
  { key: 'password-special', label: 'パスワード（英数字記号混合）',  pattern: '^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=])[a-zA-Z\\d!@#$%^&*()_+\\-=]{8,}$', error: '英字・数字・記号を含む8文字以上で入力してください' },
] as const

function getPresetKey(pattern: string): string {
  if (/^\^\\d\{(\d+)\}\$$/.test(pattern)) return 'digits'
  return VALIDATION_PRESETS.find((p) => p.pattern === pattern)?.key ?? 'custom'
}

function getDigitCount(pattern: string): number {
  const m = pattern.match(/^\^\\d\{(\d+)\}\$$/)
  return m ? parseInt(m[1]) : 4
}

function ValidationPatternSelector({
  pattern,
  errorMessage,
  onChange,
}: {
  pattern: string
  errorMessage: string
  onChange: (pattern: string, errorMessage: string) => void
}) {
  const presetKey = getPresetKey(pattern)
  const [digitCount, setDigitCount] = useState(() => getDigitCount(pattern))

  const handleSelect = (key: string) => {
    if (key === 'digits') {
      onChange(`^\\d{${digitCount}}$`, `${digitCount}桁の数字で入力してください`)
    } else if (key === 'custom') {
      onChange('', '')
    } else {
      const preset = VALIDATION_PRESETS.find((p) => p.key === key)
      if (preset) onChange(preset.pattern, preset.error)
    }
  }

  const handleDigitCount = (n: number) => {
    setDigitCount(n)
    onChange(`^\\d{${n}}$`, `${n}桁の数字で入力してください`)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">パターン</label>
        <select
          className="input"
          value={presetKey}
          onChange={(e) => handleSelect(e.target.value)}
        >
          <optgroup label="氏名・ふりがな">
            <option value="name">氏名（ひらがな・漢字）</option>
            <option value="furigana-hira">ふりがな（ひらがな）</option>
            <option value="furigana-kata">ふりがな（カタカナ）</option>
          </optgroup>
          <optgroup label="連絡先">
            <option value="email">メールアドレス</option>
            <option value="tel-hyphen">電話番号（ハイフンあり）</option>
            <option value="tel-nohyphen">電話番号（ハイフンなし）</option>
          </optgroup>
          <optgroup label="住所">
            <option value="zip-hyphen">郵便番号（ハイフンあり）</option>
            <option value="zip-nohyphen">郵便番号（ハイフンなし）</option>
          </optgroup>
          <optgroup label="パスワード">
            <option value="password-alphanum">パスワード（英数字混合）</option>
            <option value="password-special">パスワード（英数字記号混合）</option>
          </optgroup>
          <optgroup label="その他">
            <option value="digits">番号入力（桁数指定）</option>
            <option value="custom">カスタム</option>
          </optgroup>
        </select>
      </div>
      {presetKey === 'digits' && (
        <div>
          <label className="label">桁数</label>
          <input
            type="number"
            className="input w-24"
            min={1}
            max={20}
            value={digitCount}
            onChange={(e) => handleDigitCount(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      )}
      <div>
        <label className="label">正規表現パターン（オプション）</label>
        <input
          className="input font-mono"
          value={pattern}
          onChange={(e) => onChange(e.target.value, errorMessage)}
          placeholder="^\d{7}$"
        />
      </div>
      <div>
        <label className="label">エラーメッセージ</label>
        <input
          className="input"
          value={errorMessage}
          onChange={(e) => onChange(pattern, e.target.value)}
          placeholder="入力内容が正しくありません"
        />
      </div>
    </div>
  )
}

/** 🎯 ピックボタンのみ（テキスト入力欄なし） */
function PickOnlyInput({
  value,
  onChange,
  blockId,
  field,
  hint,
  withHash = false,
}: {
  value: string
  onChange: (v: string) => void
  blockId: string
  field: string
  hint?: string
  withHash?: boolean
}) {
  const { startPick, pickRequest } = useEditorStore()
  const isPicking = pickRequest?.blockId === blockId && pickRequest?.field === field
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title="プレビューで要素をクリックして選択"
        onClick={() => startPick({ blockId, field, withHash })}
        className={`px-2 py-1 rounded border text-sm transition-colors ${
          isPicking
            ? 'bg-amber-400 border-amber-400 text-white'
            : 'border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-500'
        }`}
      >
        🎯
      </button>
      {value && (
        <span className="text-xs font-mono text-gray-500 truncate">{value}</span>
      )}
      {!value && (
        <span className="text-xs text-gray-400">{hint ?? 'プレビューで input をクリック'}</span>
      )}
    </div>
  )
}

const TYPE_EMOJI: Record<Block['type'], string> = {
  start: '▶',
  end: '⏹',
  speech: '💬',
  spotlight: '🔦',
  'input-spotlight': '✏️',
  branch: '🔀',
}

function blockLabel(b: Block): string {
  const emoji = TYPE_EMOJI[b.type]
  switch (b.type) {
    case 'start': return `${emoji} 開始ブロック`
    case 'end': return `${emoji} 終了ブロック`
    case 'speech': return `${emoji} ${b.message.slice(0, 20)}`
    case 'spotlight': return `${emoji} ${b.targetLabel}`
    case 'input-spotlight': return `${emoji} ${b.targetLabel}`
    case 'branch': return `${emoji} ${b.question.slice(0, 20)}`
  }
}

function nextOptions(blocks: Block[], currentId: string) {
  return blocks.filter((b) => b.id !== currentId && b.type !== 'start')
}

function StartBlockEditor({ block }: { block: StartBlock }) {
  const { updateBlock } = useEditorStore()
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-center">
        <div className="text-2xl mb-1">▶</div>
        <p className="text-xs font-semibold text-green-800 dark:text-green-300">チュートリアルはここから始まります</p>
      </div>
      <div>
        <label className="label">セリフ（省略可）</label>
        <textarea
          className="input min-h-[60px] resize-y"
          value={block.message ?? ''}
          onChange={(e) => updateBlock({ ...block, message: e.target.value || undefined })}
          placeholder="例：ようこそ！手続きをご案内します。"
        />
      </div>
      <div>
        <label className="label">気分</label>
        <select
          className="input"
          value={block.characterMood ?? 'normal'}
          onChange={(e) => updateBlock({ ...block, characterMood: e.target.value as StartBlock['characterMood'] })}
        >
          <option value="normal">普通 😐</option>
          <option value="happy">うれしい 😊</option>
          <option value="thinking">考え中 🤔</option>
        </select>
      </div>
    </div>
  )
}

function EndBlockEditor({ block }: { block: EndBlock }) {
  const { updateBlock } = useEditorStore()
  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 text-center">
        <div className="text-2xl mb-1">⏹</div>
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">チュートリアルはここで終了します</p>
      </div>
      <div>
        <label className="label">セリフ（省略可）</label>
        <textarea
          className="input min-h-[60px] resize-y"
          value={block.message ?? ''}
          onChange={(e) => updateBlock({ ...block, message: e.target.value || undefined })}
          placeholder="例：お疲れさまでした！手続きが完了しました。"
        />
      </div>
      <div>
        <label className="label">気分</label>
        <select
          className="input"
          value={block.characterMood ?? 'normal'}
          onChange={(e) => updateBlock({ ...block, characterMood: e.target.value as EndBlock['characterMood'] })}
        >
          <option value="normal">普通 😐</option>
          <option value="happy">うれしい 😊</option>
          <option value="thinking">考え中 🤔</option>
        </select>
      </div>
    </div>
  )
}

function SpeechEditor({ block }: { block: SpeechBlock }) {
  const { updateBlock } = useEditorStore()
  return (
    <div className="space-y-3">
      <div>
        <label className="label">セリフ</label>
        <textarea
          id="speech-editor-message"
          className="input min-h-[80px] resize-y"
          value={block.message}
          onChange={(e) => updateBlock({ ...block, message: e.target.value })}
          placeholder="例：こんにちは！次のステップを案内します。"
        />
      </div>
      <div>
        <label className="label">気分</label>
        <select
          className="input"
          value={block.characterMood ?? 'normal'}
          onChange={(e) =>
            updateBlock({ ...block, characterMood: e.target.value as SpeechBlock['characterMood'] })
          }
        >
          <option value="normal">普通 😐</option>
          <option value="happy">うれしい 😊</option>
          <option value="thinking">考え中 🤔</option>
        </select>
      </div>
    </div>
  )
}


function InputSpotlightEditor({ block }: { block: InputSpotlightBlock }) {
  const { updateBlock } = useEditorStore()
  const targetType = block.targetType ?? 'input'
  const isButton = targetType === 'button'
  const isElement = targetType === 'element'
  const validationEnabled = block.validationPattern !== undefined
  const previewEnabled = block.documentType !== undefined

  const setTargetType = (t: 'input' | 'button' | 'element') => {
    // input以外のモードに切り替え時はバリデーション設定を削除
    if (t === 'button' || t === 'element') {
      const { validationPattern: _, errorMessage: __, ...rest } = block
      updateBlock({ ...rest, targetType: t } as InputSpotlightBlock)
    } else {
      updateBlock({ ...block, targetType: 'input' })
    }
  }

  const toggleValidation = (enabled: boolean) => {
    if (enabled) {
      updateBlock({ ...block, validationPattern: '', errorMessage: '入力内容が正しくありません' })
    } else {
      const { validationPattern: _, errorMessage: __, ...rest } = block
      updateBlock(rest as InputSpotlightBlock)
    }
  }

  const togglePreview = (enabled: boolean) => {
    if (enabled) {
      updateBlock({ ...block, documentType: 'mynumber-card', buttonLabel: '見本を確認' })
    } else {
      const { documentType: _, buttonLabel: __, ...rest } = block
      updateBlock(rest as InputSpotlightBlock)
    }
  }

  return (
    <div className="space-y-3">
      {/* 対象種別切り替え */}
      <div>
        <label className="label">強調方法</label>
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <button
            type="button"
            onClick={() => setTargetType('input')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              !isButton && !isElement ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            ✏️ 入力フォーム
          </button>
          <button
            type="button"
            onClick={() => setTargetType('button')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              isButton ? 'bg-white dark:bg-gray-600 text-amber-700 dark:text-amber-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            🔦 ボタン
          </button>
          <button
            type="button"
            onClick={() => setTargetType('element')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              isElement ? 'bg-white dark:bg-gray-600 text-emerald-700 dark:text-emerald-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            📌 エリア
          </button>
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          {isButton ? 'パルスリング強調＋クリックで次へ進みます' : isElement ? 'パルスリング強調＋「次へ」ボタンで進みます' : 'フォーカス強調＋入力確認後に次へ進みます'}
        </p>
      </div>

      <div>
        <label className="label">説明文</label>
        <textarea
          className="input min-h-[60px] resize-y"
          value={block.message}
          onChange={(e) => updateBlock({ ...block, message: e.target.value })}
          placeholder={isButton ? '例：「申請する」ボタンをクリックしてください。' : isElement ? '例：こちらの枠が申請フォームです。' : '例：郵便番号を入力してください。'}
        />
      </div>
      <div id="spotlight-editor-target">
        <label className="label">対象ラベル</label>
        <PickOnlyInput
          value={block.targetId}
          onChange={(v) => updateBlock({ ...block, targetId: v })}
          blockId={block.id}
          field="targetId"
          hint={isButton ? 'プレビューでボタンをクリック' : isElement ? 'プレビューで強調したい領域をクリック' : 'プレビューで input をクリック'}
          withHash={isElement}
        />
      </div>
      <div>
        <label className="label">ラベル名</label>
        <input
          className="input"
          value={block.targetLabel}
          onChange={(e) => updateBlock({ ...block, targetLabel: e.target.value })}
          placeholder={isButton ? '例：申請するボタン' : isElement ? '例：申請フォームの枠' : '例：郵便番号入力欄'}
        />
      </div>

      {/* バリデーション設定（入力フォームのみ） */}
      {!isButton && !isElement && (
        <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={validationEnabled} onChange={(e) => toggleValidation(e.target.checked)} className="w-4 h-4 accent-blue-500" />
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">バリデーションを有効にする</span>
          </label>
          {validationEnabled && (
            <div className="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
              <ValidationPatternSelector
                pattern={block.validationPattern ?? ''}
                errorMessage={block.errorMessage ?? ''}
                onChange={(p, e) => updateBlock({ ...block, validationPattern: p, errorMessage: e })}
              />
            </div>
          )}
        </div>
      )}

      {/* 書類プレビュー設定 */}
      <div className="border-t border-gray-100 pt-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={previewEnabled} onChange={(e) => togglePreview(e.target.checked)} className="w-4 h-4 accent-teal-500" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">書類プレビューを追加する</span>
        </label>
        {previewEnabled && (
          <div className="mt-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 p-3">
            <DocTypeSelector
              value={block.documentType ?? 'mynumber-card'}
              onChange={(v) => updateBlock({ ...block, documentType: v })}
              buttonLabel={block.buttonLabel ?? ''}
              onButtonLabelChange={(v) => updateBlock({ ...block, buttonLabel: v })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/** 書類種別セレクター＋カスタムアップロード（DocumentPreview と InputSpotlight で共用） */
function DocTypeSelector({
  value,
  onChange,
  buttonLabel,
  onButtonLabelChange,
}: {
  value: string
  onChange: (v: string) => void
  buttonLabel: string
  onButtonLabelChange: (v: string) => void
}) {
  const [customTypes, setCustomTypes] = useState<CustomDocType[]>(() => loadCustomDocTypes())
  const [uploading, setUploading] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const refresh = useCallback(() => setCustomTypes(loadCustomDocTypes()), [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !newLabel.trim()) return
    setUploading(true)
    try {
      const imageBase64 = await fileToBase64(file)
      const id = `cdoc-${Math.random().toString(36).slice(2, 7)}`
      saveCustomDocType({ id, label: newLabel.trim(), imageBase64 })
      refresh()
      onChange(id)
      setNewLabel('')
      setShowUpload(false)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = (id: string) => {
    if (!confirm('この書類種別を削除しますか？')) return
    deleteCustomDocType(id)
    refresh()
    if (value === id) onChange('mynumber-card')
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">書類種別</label>
        <div className="flex gap-1">
          <select className="input flex-1" value={value} onChange={(e) => onChange(e.target.value)}>
            <optgroup label="内蔵">
              <option value="mynumber-card">マイナンバーカード</option>
              <option value="receipt">領収書</option>
              <option value="residence-certificate">住民票の写し</option>
            </optgroup>
            {customTypes.length > 0 && (
              <optgroup label="カスタム">
                {customTypes.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </optgroup>
            )}
          </select>
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="px-2.5 rounded border border-teal-400 text-teal-600 text-sm hover:bg-teal-50 transition-colors"
            title="書類画像を追加"
          >+</button>
        </div>
      </div>

      {showUpload && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-teal-700">書類画像を追加</p>
          <input className="input text-xs" placeholder="書類名（例: パスポート）" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={!newLabel.trim() || uploading}
            onChange={handleUpload}
            className="block w-full text-xs text-gray-500
              file:mr-2 file:py-1 file:px-3 file:rounded file:border-0
              file:text-xs file:font-semibold file:bg-teal-100 file:text-teal-700
              hover:file:bg-teal-200 disabled:opacity-50 cursor-pointer"
          />
          <p className="text-xs text-teal-600">※ 書類名を入力してから画像を選択してください</p>
        </div>
      )}

      {customTypes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">カスタム書類</p>
          {customTypes.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600">
              <img src={c.imageBase64} alt={c.label} className="w-8 h-8 object-cover rounded" />
              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{c.label}</span>
              <button onClick={() => handleDelete(c.id)} className="text-gray-300 hover:text-red-500 transition-colors text-base leading-none" title="削除">×</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="label">ボタン文言</label>
        <input className="input" value={buttonLabel} onChange={(e) => onButtonLabelChange(e.target.value)} placeholder="見本を確認" />
      </div>
    </div>
  )
}

const OPTION_DEFAULT_COLORS: BranchOptionColor[] = [
  'orange', 'amber', 'yellow', 'lime', 'cyan', 'indigo', 'purple', 'pink', 'white',
]

function BranchEditor({ block }: { block: BranchBlock }) {
  const { updateBlock, addBranchOption, removeBranchOption } = useEditorStore()

  const handleLabelChange = (optionId: string, label: string) => {
    updateBlock({ ...block, options: block.options.map((o) => o.id === optionId ? { ...o, label } : o) })
  }

  const handleColorChange = (optionId: string, color: BranchOptionColor) => {
    updateBlock({ ...block, options: block.options.map((o) => o.id === optionId ? { ...o, color } : o) })
  }

  const handleAddOption = () => {
    if (block.options.length >= 5) return
    const usedColors = new Set(block.options.map((o) => o.color))
    const color = OPTION_DEFAULT_COLORS.find((c) => !usedColors.has(c)) ?? 'blue'
    const id = `opt-${Math.random().toString(36).slice(2, 7)}`
    addBranchOption(block.id, { id, label: `選択肢${block.options.length + 1}`, color, nextId: null })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">質問文</label>
        <textarea
          className="input min-h-[60px] resize-y"
          value={block.question}
          onChange={(e) => updateBlock({ ...block, question: e.target.value })}
          placeholder="例：同じ市区町村内への引越しですか？"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">選択肢（{block.options.length}/5）</label>
          {block.options.length < 5 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold transition-colors"
            >
              ＋ 追加
            </button>
          )}
        </div>
        <div className="space-y-2">
          {block.options.map((opt) => (
            <div key={opt.id} className="rounded-lg border border-gray-200 dark:border-gray-600 p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1 py-1 text-sm"
                  value={opt.label}
                  onChange={(e) => handleLabelChange(opt.id, e.target.value)}
                  placeholder="選択肢名"
                />
                {block.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeBranchOption(block.id, opt.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
                    title="削除"
                  >×</button>
                )}
              </div>
              {/* 12色カラーピッカー */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {(Object.keys(BRANCH_OPTION_COLOR_CLASSES) as BranchOptionColor[]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(opt.id, color)}
                    title={BRANCH_OPTION_COLOR_CLASSES[color].label}
                    className={`w-5 h-5 rounded-full transition-all flex-shrink-0 ${
                      color === 'white' ? 'bg-white border border-gray-300' : BRANCH_OPTION_COLOR_CLASSES[color].swatch
                    } ${
                      opt.color === color
                        ? 'ring-2 ring-offset-1 ring-gray-500 scale-110'
                        : 'hover:ring-1 hover:ring-offset-1 hover:ring-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BlockEditor() {
  const { scenario, selectedBlockId } = useEditorStore()
  const block = scenario?.blocks.find((b) => b.id === selectedBlockId)

  if (!block) {
    return (
      <div className="bg-white dark:bg-gray-900 flex items-center justify-center h-full w-full">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center px-4">
          ブロックを選択すると<br />設定フォームが表示されます
        </p>
      </div>
    )
  }

  return (
    <div id="block-editor" className="bg-white dark:bg-gray-900 flex flex-col h-full w-full">
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">{block.id}</p>
      </div>
      <div className="p-3 flex-1 overflow-y-auto">
        {block.type === 'start' && <StartBlockEditor block={block} />}
        {block.type === 'end' && <EndBlockEditor block={block} />}
        {block.type === 'speech' && <SpeechEditor block={block} />}
        {block.type === 'input-spotlight' && <InputSpotlightEditor block={block} />}
        {block.type === 'branch' && <BranchEditor block={block} />}
      </div>
    </div>
  )
}

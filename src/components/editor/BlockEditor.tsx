'use client'

import { useRef, useState, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import {
  Block,
  SpeechBlock,
  SpotlightBlock,
  InputSpotlightBlock,
  DocumentPreviewBlock,
  ValidationBlock,
  BranchBlock,
} from '@/types/scenario'
import {
  loadCustomDocTypes,
  saveCustomDocType,
  deleteCustomDocType,
  fileToBase64,
  type CustomDocType,
} from '@/lib/customDocTypes'

/** セレクタ入力欄 + 🎯 ピックボタン */
function SelectorInput({
  label,
  value,
  onChange,
  blockId,
  field,
  withHash,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  blockId: string
  field: string
  withHash: boolean
  placeholder?: string
}) {
  const { startPick, pickRequest } = useEditorStore()
  const isPicking = pickRequest?.blockId === blockId && pickRequest?.field === field
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-1">
        <input
          className={`input flex-1 ${isPicking ? 'ring-2 ring-amber-400 border-amber-400' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          title="プレビューで要素をクリックして選択"
          onClick={() => startPick({ blockId, field, withHash })}
          className={`px-2 rounded border text-sm transition-colors ${
            isPicking
              ? 'bg-amber-400 border-amber-400 text-white'
              : 'border-gray-200 text-gray-400 hover:border-amber-400 hover:text-amber-500'
          }`}
        >
          🎯
        </button>
      </div>
    </div>
  )
}

const TYPE_EMOJI: Record<Block['type'], string> = {
  speech: '💬',
  spotlight: '🔦',
  'input-spotlight': '✏️',
  'document-preview': '📄',
  validation: '✅',
  branch: '🔀',
}

function blockLabel(b: Block): string {
  const emoji = TYPE_EMOJI[b.type]
  switch (b.type) {
    case 'speech': return `${emoji} ${b.message.slice(0, 20)}`
    case 'spotlight': return `${emoji} ${b.targetLabel}`
    case 'input-spotlight': return `${emoji} ${b.targetLabel}`
    case 'document-preview': return `${emoji} ${b.targetLabel}`
    case 'validation': return `${emoji} ${b.targetLabel}`
    case 'branch': return `${emoji} ${b.question.slice(0, 20)}`
  }
}

function nextOptions(blocks: Block[], currentId: string) {
  return blocks.filter((b) => b.id !== currentId)
}

function NextSelect({
  value,
  onChange,
  blocks,
  currentId,
}: {
  value: string | null
  onChange: (v: string | null) => void
  blocks: Block[]
  currentId: string
}) {
  return (
    <div>
      <label className="label">次のブロック</label>
      <select
        className="input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">（終了）</option>
        {nextOptions(blocks, currentId).map((b) => (
          <option key={b.id} value={b.id}>
            {blockLabel(b)}
          </option>
        ))}
      </select>
    </div>
  )
}

function SpeechEditor({ block }: { block: SpeechBlock }) {
  const { updateBlock, scenario } = useEditorStore()
  const blocks = scenario?.blocks ?? []
  return (
    <div className="space-y-3">
      <div>
        <label className="label">セリフ</label>
        <textarea
          className="input min-h-[80px] resize-y"
          value={block.message}
          onChange={(e) => updateBlock({ ...block, message: e.target.value })}
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
      <NextSelect value={block.nextId} onChange={(v) => updateBlock({ ...block, nextId: v })} blocks={blocks} currentId={block.id} />
    </div>
  )
}

function SpotlightEditor({ block }: { block: SpotlightBlock }) {
  const { updateBlock, scenario } = useEditorStore()
  const blocks = scenario?.blocks ?? []
  return (
    <div className="space-y-3">
      <div>
        <label className="label">説明文</label>
        <textarea className="input min-h-[60px] resize-y" value={block.message} onChange={(e) => updateBlock({ ...block, message: e.target.value })} />
      </div>
      <SelectorInput
        label="CSSセレクタ"
        value={block.targetSelector}
        onChange={(v) => updateBlock({ ...block, targetSelector: v })}
        blockId={block.id}
        field="targetSelector"
        withHash={true}
        placeholder="#submit-btn"
      />
      <div>
        <label className="label">ラベル名</label>
        <input className="input" value={block.targetLabel} onChange={(e) => updateBlock({ ...block, targetLabel: e.target.value })} />
      </div>
      <NextSelect value={block.nextId} onChange={(v) => updateBlock({ ...block, nextId: v })} blocks={blocks} currentId={block.id} />
    </div>
  )
}

function InputSpotlightEditor({ block }: { block: InputSpotlightBlock }) {
  const { updateBlock, scenario } = useEditorStore()
  const blocks = scenario?.blocks ?? []
  return (
    <div className="space-y-3">
      <div>
        <label className="label">説明文</label>
        <textarea className="input min-h-[60px] resize-y" value={block.message} onChange={(e) => updateBlock({ ...block, message: e.target.value })} />
      </div>
      <SelectorInput
        label="対象 input の ID"
        value={block.targetId}
        onChange={(v) => updateBlock({ ...block, targetId: v })}
        blockId={block.id}
        field="targetId"
        withHash={false}
        placeholder="postal-code"
      />
      <div>
        <label className="label">ラベル名</label>
        <input className="input" value={block.targetLabel} onChange={(e) => updateBlock({ ...block, targetLabel: e.target.value })} />
      </div>
      <NextSelect value={block.nextId} onChange={(v) => updateBlock({ ...block, nextId: v })} blocks={blocks} currentId={block.id} />
    </div>
  )
}

function DocumentPreviewEditor({ block }: { block: DocumentPreviewBlock }) {
  const { updateBlock, scenario } = useEditorStore()
  const blocks = scenario?.blocks ?? []

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
      updateBlock({ ...block, documentType: id })
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
    if (block.documentType === id) updateBlock({ ...block, documentType: 'mynumber-card' })
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="label">説明文</label>
        <textarea className="input min-h-[60px] resize-y" value={block.message} onChange={(e) => updateBlock({ ...block, message: e.target.value })} />
      </div>
      <SelectorInput
        label="対象 input の ID"
        value={block.targetId}
        onChange={(v) => updateBlock({ ...block, targetId: v })}
        blockId={block.id}
        field="targetId"
        withHash={false}
        placeholder="mynumber-input"
      />
      <div>
        <label className="label">ラベル名</label>
        <input className="input" value={block.targetLabel} onChange={(e) => updateBlock({ ...block, targetLabel: e.target.value })} />
      </div>

      {/* 書類種別セレクト + 追加ボタン */}
      <div>
        <label className="label">書類種別</label>
        <div className="flex gap-1">
          <select
            className="input flex-1"
            value={block.documentType}
            onChange={(e) => updateBlock({ ...block, documentType: e.target.value })}
          >
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
            className="px-2.5 rounded border border-teal-400 text-teal-600 text-sm
              hover:bg-teal-50 transition-colors"
            title="書類画像を追加"
          >
            +
          </button>
        </div>
      </div>

      {/* アップロードパネル */}
      {showUpload && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-teal-700">書類画像を追加</p>
          <input
            className="input text-xs"
            placeholder="書類名（例: パスポート）"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
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

      {/* カスタム書類の管理リスト */}
      {customTypes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-400">カスタム書類</p>
          {customTypes.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-gray-50 border border-gray-100">
              <img src={c.imageBase64} alt={c.label} className="w-8 h-8 object-cover rounded" />
              <span className="text-xs text-gray-700 flex-1 truncate">{c.label}</span>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-gray-300 hover:text-red-500 transition-colors text-base leading-none"
                title="削除"
              >×</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="label">ボタン文言</label>
        <input className="input" value={block.buttonLabel ?? ''} onChange={(e) => updateBlock({ ...block, buttonLabel: e.target.value })} placeholder="見本を確認" />
      </div>
      <NextSelect value={block.nextId} onChange={(v) => updateBlock({ ...block, nextId: v })} blocks={blocks} currentId={block.id} />
    </div>
  )
}

function ValidationEditor({ block }: { block: ValidationBlock }) {
  const { updateBlock, scenario } = useEditorStore()
  const blocks = scenario?.blocks ?? []
  return (
    <div className="space-y-3">
      <div>
        <label className="label">説明文</label>
        <textarea className="input min-h-[60px] resize-y" value={block.message} onChange={(e) => updateBlock({ ...block, message: e.target.value })} />
      </div>
      <SelectorInput
        label="CSSセレクタ"
        value={block.targetSelector}
        onChange={(v) => updateBlock({ ...block, targetSelector: v })}
        blockId={block.id}
        field="targetSelector"
        withHash={true}
        placeholder="#postal-code"
      />
      <div>
        <label className="label">ラベル名</label>
        <input className="input" value={block.targetLabel} onChange={(e) => updateBlock({ ...block, targetLabel: e.target.value })} />
      </div>
      <div>
        <label className="label">正規表現パターン</label>
        <input className="input font-mono" value={block.validationPattern} onChange={(e) => updateBlock({ ...block, validationPattern: e.target.value })} placeholder="^\d{7}$" />
      </div>
      <div>
        <label className="label">エラーメッセージ</label>
        <input className="input" value={block.errorMessage} onChange={(e) => updateBlock({ ...block, errorMessage: e.target.value })} />
      </div>
      <NextSelect value={block.nextId} onChange={(v) => updateBlock({ ...block, nextId: v })} blocks={blocks} currentId={block.id} />
    </div>
  )
}

function BranchEditor({ block }: { block: BranchBlock }) {
  const { updateBlock, scenario } = useEditorStore()
  const blocks = scenario?.blocks ?? []
  return (
    <div className="space-y-3">
      <div>
        <label className="label">質問文</label>
        <textarea className="input min-h-[60px] resize-y" value={block.question} onChange={(e) => updateBlock({ ...block, question: e.target.value })} />
      </div>
      <div>
        <label className="label">はい → 次のブロック</label>
        <select className="input" value={block.yesNextId ?? ''} onChange={(e) => updateBlock({ ...block, yesNextId: e.target.value || null })}>
          <option value="">（終了）</option>
          {nextOptions(blocks, block.id).map((b) => <option key={b.id} value={b.id}>{blockLabel(b)}</option>)}
        </select>
      </div>
      <div>
        <label className="label">いいえ → 次のブロック</label>
        <select className="input" value={block.noNextId ?? ''} onChange={(e) => updateBlock({ ...block, noNextId: e.target.value || null })}>
          <option value="">（終了）</option>
          {nextOptions(blocks, block.id).map((b) => <option key={b.id} value={b.id}>{blockLabel(b)}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function BlockEditor() {
  const { scenario, selectedBlockId } = useEditorStore()
  const block = scenario?.blocks.find((b) => b.id === selectedBlockId)

  if (!block) {
    return (
      <div className="bg-white flex items-center justify-center h-full w-full">
        <p className="text-sm text-gray-400 text-center px-4">
          ブロックを選択すると<br />設定フォームが表示されます
        </p>
      </div>
    )
  }

  return (
    <div id="block-editor" className="bg-white flex flex-col h-full w-full">
      <div className="px-3 py-2 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-mono truncate">{block.id}</p>
      </div>
      <div className="p-3 flex-1 overflow-y-auto">
        {block.type === 'speech' && <SpeechEditor block={block} />}
        {block.type === 'spotlight' && <SpotlightEditor block={block} />}
        {block.type === 'input-spotlight' && <InputSpotlightEditor block={block} />}
        {block.type === 'document-preview' && <DocumentPreviewEditor block={block} />}
        {block.type === 'validation' && <ValidationEditor block={block} />}
        {block.type === 'branch' && <BranchEditor block={block} />}
      </div>
    </div>
  )
}

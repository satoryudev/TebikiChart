export type BlockType = 'start' | 'end' | 'speech' | 'input-spotlight' | 'branch'

export interface StartBlock {
  id: string
  type: 'start'
  message?: string
  characterMood?: 'normal' | 'happy' | 'thinking'
  nextId: string | null
}

export interface EndBlock {
  id: string
  type: 'end'
  message?: string
  characterMood?: 'normal' | 'happy' | 'thinking'
}

export interface SpeechBlock {
  id: string
  type: 'speech'
  message: string
  characterMood?: 'normal' | 'happy' | 'thinking'
  nextId: string | null
}

export interface InputSpotlightBlock {
  id: string
  type: 'input-spotlight'
  message: string
  targetId: string
  targetLabel: string
  nextId: string | null
  /** 対象要素の種別: 'input'（入力フォーム強調）| 'button'（スポットライト強調）| 'element'（汎用要素強調）。省略時は 'input' */
  targetType?: 'input' | 'button' | 'element'
  validationPattern?: string
  errorMessage?: string
  /** 書類プレビュー設定（省略時はプレビューなし） */
  documentType?: string
  buttonLabel?: string
}

export interface DocumentPreviewBlock {
  id: string
  type: 'document-preview'
  message: string
  targetId: string
  targetLabel: string
  documentType: 'mynumber-card' | 'receipt' | 'residence-certificate' | 'custom' | (string & {})
  previewImageUrl?: string
  buttonLabel?: string
  nextId: string | null
}

export interface BranchOption {
  id: string
  label: string
  color: string
  nextId: string | null
}

export interface BranchBlock {
  id: string
  type: 'branch'
  question: string
  options: BranchOption[]
  nextId: string | null
}

export type Block =
  | StartBlock
  | EndBlock
  | SpeechBlock
  | InputSpotlightBlock
  | BranchBlock

export interface Scenario {
  id: string
  title: string
  category: 'moving' | 'mynumber' | 'tax' | 'childcare'
  blocks: Block[]
  startBlockId: string | null
  totalSteps?: number
  createdAt: string
  updatedAt: string
}

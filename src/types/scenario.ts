export type BlockType = 'start' | 'end' | 'speech' | 'spotlight' | 'input-spotlight' | 'branch'

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

export interface SpotlightBlock {
  id: string
  type: 'spotlight'
  message: string
  targetSelector: string
  targetLabel: string
  nextId: string | null
}

/** 機能1: 画面暗転＋スポットライト（入力フォーム／ボタン共用） */
export interface InputSpotlightBlock {
  id: string
  type: 'input-spotlight'
  message: string
  targetId: string
  targetLabel: string
  nextId: string | null
  targetType?: 'input' | 'button' | 'element'
  validationPattern?: string
  errorMessage?: string
  documentType?: string
  buttonLabel?: string
}

export type BranchOptionColor =
  | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' | 'green'
  | 'cyan' | 'blue' | 'indigo' | 'purple' | 'pink' | 'white'

export interface BranchOption {
  id: string
  label: string
  color: BranchOptionColor
  nextId: string | null
}

export interface BranchBlock {
  id: string
  type: 'branch'
  question: string
  options: BranchOption[]
  /** 分岐後の合流先（どちらのパスも終わったら進むメインフローのブロック） */
  nextId: string | null
}

export type Block =
  | StartBlock
  | EndBlock
  | SpeechBlock
  | SpotlightBlock
  | InputSpotlightBlock
  | BranchBlock

export interface Scenario {
  id: string
  title: string
  category: 'moving' | 'mynumber' | 'tax' | 'childcare'
  blocks: Block[]
  startBlockId: string | null
  totalSteps?: number
  previewUrl?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

/** ボタン色スタイルのマッピング（スペクトル順） */
export const BRANCH_OPTION_COLOR_CLASSES: Record<BranchOptionColor, {
  bg: string; border: string; text: string; hover: string; active: string; swatch: string; label: string
}> = {
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-500',    hover: 'hover:bg-red-100',    active: 'active:bg-red-200',    swatch: 'bg-red-400',    label: '赤' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', hover: 'hover:bg-orange-100', active: 'active:bg-orange-200', swatch: 'bg-orange-400', label: 'オレンジ' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  hover: 'hover:bg-amber-100',  active: 'active:bg-amber-200',  swatch: 'bg-amber-400',  label: '茶' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', hover: 'hover:bg-yellow-100', active: 'active:bg-yellow-200', swatch: 'bg-yellow-400', label: '黄' },
  lime:   { bg: 'bg-lime-50',   border: 'border-lime-200',   text: 'text-lime-600',   hover: 'hover:bg-lime-100',   active: 'active:bg-lime-200',   swatch: 'bg-lime-400',   label: '黄緑' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600',  hover: 'hover:bg-green-100',  active: 'active:bg-green-200',  swatch: 'bg-green-400',  label: '緑' },
  cyan:   { bg: 'bg-cyan-50',   border: 'border-cyan-200',   text: 'text-cyan-600',   hover: 'hover:bg-cyan-100',   active: 'active:bg-cyan-200',   swatch: 'bg-cyan-400',   label: '水色' },
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600',   hover: 'hover:bg-blue-100',   active: 'active:bg-blue-200',   swatch: 'bg-blue-400',   label: '青' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', hover: 'hover:bg-indigo-100', active: 'active:bg-indigo-200', swatch: 'bg-indigo-400', label: '紺' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', hover: 'hover:bg-purple-100', active: 'active:bg-purple-200', swatch: 'bg-purple-400', label: '紫' },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-200',   text: 'text-pink-600',   hover: 'hover:bg-pink-100',   active: 'active:bg-pink-200',   swatch: 'bg-pink-400',   label: 'ピンク' },
  white:  { bg: 'bg-white',     border: 'border-gray-200',   text: 'text-gray-600',   hover: 'hover:bg-gray-50',    active: 'active:bg-gray-100',   swatch: 'bg-white border border-gray-300', label: '白' },
}

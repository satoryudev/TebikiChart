export type BlockType = 'speech' | 'spotlight' | 'input-spotlight' | 'document-preview' | 'validation' | 'branch'

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

export interface InputSpotlightBlock {
  id: string
  type: 'input-spotlight'
  message: string
  targetId: string
  targetLabel: string
  nextId: string | null
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

export interface ValidationBlock {
  id: string
  type: 'validation'
  message: string
  targetSelector: string
  targetLabel: string
  validationPattern: string
  errorMessage: string
  nextId: string | null
}

export interface BranchBlock {
  id: string
  type: 'branch'
  question: string
  yesNextId: string | null
  noNextId: string | null
}

export type Block =
  | SpeechBlock
  | SpotlightBlock
  | InputSpotlightBlock
  | DocumentPreviewBlock
  | ValidationBlock
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

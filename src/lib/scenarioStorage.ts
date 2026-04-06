import { Scenario, Block } from '@/types/scenario'

const STORAGE_KEY = 'tetsuzuki_quest_scenarios'

export const DEMO_SCENARIO: Scenario = {
  id: 'demo-moving',
  title: '引越し・転居届の手続き',
  category: 'moving',
  startBlockId: 'block-start',
  totalSteps: 8,
  blocks: [
    { id: 'block-start', type: 'start', nextId: 'block-1' },
    {
      id: 'block-1',
      type: 'speech',
      message: 'こんにちは！転居届のオンライン申請を一緒に進めましょう。フォームの入力をサポートします。',
      characterMood: 'happy',
      nextId: 'block-2',
    },
    {
      id: 'block-2',
      type: 'branch',
      question: '引越し前後の住所は同じ市区町村ですか？',
      yesNextId: 'block-3a',
      noNextId: 'block-3b',
      nextId: 'block-4',
    },
    {
      id: 'block-3a',
      type: 'speech',
      message: '同じ市区町村内の引越しなら「転居届」1枚で完了です！このページで手続きできます。',
      characterMood: 'happy',
      nextId: 'block-4',
    },
    {
      id: 'block-3b',
      type: 'speech',
      message: '市区町村をまたぐ引越しは、旧住所の役所で「転出届」、新住所の役所で「転入届」の2回手続きが必要です。まずこちらの申請から進めましょう。',
      characterMood: 'thinking',
      nextId: 'block-4',
    },
    {
      id: 'block-4',
      type: 'input-spotlight',
      message: 'まず氏名を入力してください。戸籍上の氏名をご記入ください。',
      targetId: 'name-input',
      targetLabel: '氏名入力欄',
      nextId: 'block-5',
    },
    {
      id: 'block-5',
      type: 'input-spotlight',
      message: '転居後の新しい郵便番号を入力してください。ハイフンなし7桁で入力します。',
      targetId: 'postal-code',
      targetLabel: '郵便番号入力欄（新住所）',
      validationPattern: '^\\d{7}$',
      errorMessage: '郵便番号はハイフンなし7桁の数字で入力してください',
      nextId: 'block-6',
    },
    {
      id: 'block-6',
      type: 'input-spotlight',
      message: '転居後の新しい住所を入力してください。',
      targetId: 'address-input',
      targetLabel: '住所入力欄（新住所）',
      nextId: 'block-7',
    },
    {
      id: 'block-7',
      type: 'input-spotlight',
      message: '本人確認のためマイナンバーを入力してください。マイナンバーカード表面の12桁の番号です。',
      targetId: 'mynumber-input',
      targetLabel: 'マイナンバー入力欄',
      validationPattern: '^\\d{12}$',
      errorMessage: 'マイナンバーは12桁の数字で入力してください',
      documentType: 'mynumber-card',
      buttonLabel: 'マイナンバーカードの見本を確認',
      nextId: 'block-9',
    },
    {
      id: 'block-9',
      type: 'input-spotlight',
      targetType: 'button',
      message: '注意事項を確認し、同意チェックボックスにチェックを入れてください。',
      targetId: 'consent-check',
      targetLabel: '同意チェックボックス',
      nextId: 'block-10',
    },
    {
      id: 'block-10',
      type: 'input-spotlight',
      targetType: 'button',
      message: '最後に「申請する」ボタンを押して申請を完了させてください！',
      targetId: 'submit-btn',
      targetLabel: '申請するボタン',
      nextId: 'block-end',
    },
    { id: 'block-end', type: 'end' },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Issue #4: LocalStorageデータのランタイムバリデーション（依存追加なし）
const VALID_BLOCK_TYPES = new Set(['start', 'end', 'speech', 'input-spotlight', 'branch'])
const VALID_CATEGORIES = new Set(['moving', 'mynumber', 'tax', 'childcare'])

function isValidBlock(b: unknown): b is Block {
  if (!b || typeof b !== 'object') return false
  const block = b as Record<string, unknown>
  return typeof block.id === 'string' && VALID_BLOCK_TYPES.has(block.type as string)
}

function isValidScenario(s: unknown): s is Scenario {
  if (!s || typeof s !== 'object') return false
  const sc = s as Record<string, unknown>
  return (
    typeof sc.id === 'string' &&
    typeof sc.title === 'string' &&
    VALID_CATEGORIES.has(sc.category as string) &&
    Array.isArray(sc.blocks) &&
    (sc.blocks as unknown[]).every(isValidBlock) &&
    typeof sc.createdAt === 'string' &&
    typeof sc.updatedAt === 'string'
  )
}

export function loadScenarios(): Scenario[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      saveScenarios([DEMO_SCENARIO])
      return [DEMO_SCENARIO]
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      console.error('[GovGuide] Invalid scenario storage format')
      return [DEMO_SCENARIO]
    }

    // Issue #4: 不正なシナリオをフィルタリング
    const valid = parsed.filter((s) => {
      if (!isValidScenario(s)) {
        console.warn('[GovGuide] Skipping invalid scenario:', s)
        return false
      }
      return true
    }) as Scenario[]

    if (valid.length === 0) return [DEMO_SCENARIO]

    // validationブロック型の移行
    const hasValidation = valid.some((s) => s.blocks.some((b) => (b.type as string) === 'validation'))
    if (hasValidation) {
      const migrated = valid.map((s) => ({
        ...s,
        blocks: s.blocks.filter((b) => (b.type as string) !== 'validation'),
      }))
      saveScenarios(migrated)
      return migrated
    }

    return valid
  } catch {
    return [DEMO_SCENARIO]
  }
}

export function saveScenarios(scenarios: Scenario[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios))
}

export function loadScenario(id: string): Scenario | null {
  const scenarios = loadScenarios()
  return scenarios.find((s) => s.id === id) ?? null
}

export function saveScenario(scenario: Scenario): void {
  const scenarios = loadScenarios()
  const idx = scenarios.findIndex((s) => s.id === scenario.id)
  if (idx >= 0) {
    scenarios[idx] = scenario
  } else {
    scenarios.push(scenario)
  }
  saveScenarios(scenarios)
}

export function deleteScenario(id: string): void {
  const scenarios = loadScenarios().filter((s) => s.id !== id)
  saveScenarios(scenarios)
}

// Issue #19: 複数タブ間のLocalStorage同期
// storage イベントを監視し、他タブでの変更を検知できるようにコールバックを登録する
type StorageChangeCallback = (scenarios: Scenario[]) => void

const storageListeners = new Set<StorageChangeCallback>()

export function onScenariosChange(callback: StorageChangeCallback): () => void {
  storageListeners.add(callback)
  return () => storageListeners.delete(callback)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      const updated = loadScenarios()
      storageListeners.forEach((cb) => cb(updated))
    } catch {
      // parse失敗時は無視
    }
  })
}

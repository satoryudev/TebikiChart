import { Scenario } from '@/types/scenario'

const STORAGE_KEY = 'tetsuzuki_quest_scenarios'

export const DEMO_SCENARIO: Scenario = {
  id: 'demo-moving',
  title: '引越し・転居届の手続き',
  category: 'moving',
  startBlockId: 'block-1',
  totalSteps: 8,
  blocks: [
    {
      id: 'block-1',
      type: 'speech',
      message: '引越しが決まったんですね！一緒に転居届の手続きを進めましょう。',
      characterMood: 'happy',
      nextId: 'block-2',
    },
    {
      id: 'block-2',
      type: 'branch',
      question: '引越し前後の住所は同じ市区町村ですか？',
      yesNextId: 'block-3a',
      noNextId: 'block-3b',
    },
    {
      id: 'block-3a',
      type: 'speech',
      message: '同じ市区町村内なら、転居届1枚で完了です！',
      characterMood: 'happy',
      nextId: 'block-4',
    },
    {
      id: 'block-3b',
      type: 'speech',
      message: '市区町村をまたぐ場合は、旧住所の役所で転出届、新住所の役所で転入届の2回手続きが必要です。',
      characterMood: 'thinking',
      nextId: 'block-4',
    },
    {
      id: 'block-4',
      type: 'input-spotlight',
      message: 'まず、新しい郵便番号を入力してください。',
      targetId: 'postal-code',
      targetLabel: '郵便番号入力欄',
      nextId: 'block-5',
    },
    {
      id: 'block-5',
      type: 'validation',
      message: '郵便番号は「1234567」のように7桁の数字で入力してください。',
      targetSelector: '#postal-code',
      targetLabel: '郵便番号入力欄',
      validationPattern: '^\\d{7}$',
      errorMessage: '！ 郵便番号は7桁の数字で入力してください',
      nextId: 'block-6',
    },
    {
      id: 'block-6',
      type: 'document-preview',
      message: '本人確認のため、マイナンバーカードが必要です。お手元のカードと見本を照合してください。',
      targetId: 'mynumber-input',
      targetLabel: 'マイナンバー入力欄',
      documentType: 'mynumber-card',
      buttonLabel: 'マイナンバーカードの見本を確認',
      nextId: 'block-7',
    },
    {
      id: 'block-7',
      type: 'spotlight',
      message: 'では、申請ボタンを押してください。',
      targetSelector: '#submit-btn',
      targetLabel: '申請するボタン',
      nextId: 'block-8',
    },
    {
      id: 'block-8',
      type: 'speech',
      message: '手続き完了です！お疲れさまでした。',
      characterMood: 'happy',
      nextId: null,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function loadScenarios(): Scenario[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      saveScenarios([DEMO_SCENARIO])
      return [DEMO_SCENARIO]
    }
    return JSON.parse(raw) as Scenario[]
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

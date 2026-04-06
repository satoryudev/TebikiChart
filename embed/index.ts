import { Scenario } from './types'
import { ScenarioEngine } from './engine'

let engine: ScenarioEngine | null = null

// ── Element Picker ──────────────────────────────────────────────
const PICK_HIGHLIGHT_ID = 'tq-pick-highlight'

// Issue #6 & #31: CSS.escape() でIDをエスケープ、再帰をイテレーティブに変換・深さ制限
function getCssSelector(el: Element): string {
  const path: string[] = []
  let current: Element | null = el
  let depth = 0
  const MAX_DEPTH = 50

  while (current && depth < MAX_DEPTH) {
    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`)
      break
    }
    const tag = current.tagName.toLowerCase()
    const parent: Element | null = current.parentElement
    if (!parent) {
      path.unshift(tag)
      break
    }
    const siblings = Array.from(parent.children).filter((c: Element) => c.tagName === current!.tagName)
    if (siblings.length === 1) {
      path.unshift(tag)
    } else {
      const idx = siblings.indexOf(current) + 1
      path.unshift(`${tag}:nth-of-type(${idx})`)
    }
    current = parent
    depth++
  }

  return path.join(' > ')
}

// Issue #10: エラー時のUI表示
function showErrorDialog(message: string): void {
  const overlay = document.createElement('div')
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;'
  const inner = document.createElement('div')
  inner.style.cssText = 'background:white;padding:24px;border-radius:8px;max-width:400px;'
  const heading = document.createElement('h3')
  heading.style.cssText = 'color:#ef4444;margin-bottom:12px;'
  heading.textContent = 'エラー'
  const text = document.createElement('p')
  text.textContent = message
  const closeBtn = document.createElement('button')
  closeBtn.style.cssText =
    'margin-top:16px;padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;'
  closeBtn.textContent = '閉じる'
  closeBtn.onclick = () => overlay.remove()
  inner.appendChild(heading)
  inner.appendChild(text)
  inner.appendChild(closeBtn)
  overlay.appendChild(inner)
  document.body.appendChild(overlay)
}

// Issue #1: XSS脆弱性対策 - innerHTML の代わりに textContent / createElement を使用
function showStartDialog(scenario: Scenario, onStart: () => void): void {
  const overlay = document.createElement('div')
  overlay.id = 'tq-start-dialog'
  overlay.style.cssText = `
    position:fixed;inset:0;
    background:rgba(0,0,0,0.45);
    z-index:100002;
    display:flex;align-items:center;justify-content:center;
  `

  const card = document.createElement('div')
  card.style.cssText = `
    background:white;border-radius:20px;
    padding:32px 28px;max-width:360px;width:90%;
    box-shadow:0 16px 48px rgba(0,0,0,0.22);
    text-align:center;
  `

  const icon = document.createElement('div')
  icon.style.cssText = 'font-size:48px;margin-bottom:12px;'
  icon.textContent = '🧭'

  const titleEl = document.createElement('div')
  titleEl.style.cssText = 'font-size:17px;font-weight:700;color:#1f2937;margin-bottom:6px;'
  titleEl.textContent = scenario.title

  const descLine1 = document.createElement('span')
  descLine1.textContent = 'このページの操作手順をガイドします。'
  const descLine2 = document.createElement('span')
  descLine2.textContent = 'チュートリアルを開始しますか？'
  const desc = document.createElement('p')
  desc.style.cssText = 'font-size:13px;color:#6b7280;margin-bottom:24px;line-height:1.6;'
  desc.appendChild(descLine1)
  desc.appendChild(document.createElement('br'))
  desc.appendChild(descLine2)

  const btnGroup = document.createElement('div')
  btnGroup.style.cssText = 'display:flex;flex-direction:column;gap:10px;'

  const startBtn = document.createElement('button')
  startBtn.id = 'tq-start-btn'
  startBtn.style.cssText = `
    background:#3b82f6;color:white;border:none;
    border-radius:10px;padding:12px;font-size:15px;
    font-weight:700;cursor:pointer;
  `
  startBtn.textContent = '▶ 開始する'

  const skipBtn = document.createElement('button')
  skipBtn.id = 'tq-skip-btn'
  skipBtn.style.cssText = `
    background:transparent;color:#9ca3af;
    border:1.5px solid #e5e7eb;border-radius:10px;
    padding:10px;font-size:14px;cursor:pointer;
  `
  skipBtn.textContent = 'スキップ'

  btnGroup.appendChild(startBtn)
  btnGroup.appendChild(skipBtn)
  card.appendChild(icon)
  card.appendChild(titleEl)
  card.appendChild(desc)
  card.appendChild(btnGroup)
  overlay.appendChild(card)
  document.body.appendChild(overlay)

  const close = () => overlay.remove()
  startBtn.onclick = () => { close(); onStart() }
  skipBtn.onclick = close
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
}

let pickCleanup: (() => void) | null = null

function startPickMode(): void {
  if (pickCleanup) pickCleanup()

  const highlight = document.createElement('div')
  highlight.id = PICK_HIGHLIGHT_ID
  highlight.style.cssText = `
    position:fixed;pointer-events:none;z-index:999999;
    border:2px solid #f59e0b;border-radius:4px;
    background:rgba(245,158,11,0.15);transition:all 0.05s;
    display:none;
  `
  document.body.appendChild(highlight)

  const tip = document.createElement('div')
  tip.style.cssText = `
    position:fixed;z-index:1000000;pointer-events:none;
    background:#1f2937;color:white;font-size:11px;font-family:monospace;
    padding:3px 8px;border-radius:4px;white-space:nowrap;display:none;
  `
  document.body.appendChild(tip)

  const onMove = (e: MouseEvent) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === highlight || el === tip) return
    const rect = el.getBoundingClientRect()
    highlight.style.display = 'block'
    highlight.style.left = `${rect.left - 2}px`
    highlight.style.top = `${rect.top - 2}px`
    highlight.style.width = `${rect.width + 4}px`
    highlight.style.height = `${rect.height + 4}px`
    const selector = getCssSelector(el)
    const idVal = (el as HTMLElement).id ?? ''
    const hasId = !!idVal
    tip.style.background = hasId ? '#1f2937' : '#b45309'
    tip.textContent = hasId ? `#${idVal}  (${el.tagName.toLowerCase()})` : `(IDなし) ${selector}`
    tip.style.display = 'block'
    tip.style.left = `${Math.min(e.clientX + 12, window.innerWidth - 200)}px`
    tip.style.top = `${e.clientY + 16}px`
  }

  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    let el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === highlight || el === tip) return

    // label をクリックした場合は関連する input/button を解決する
    if (el.tagName.toLowerCase() === 'label') {
      const labelEl = el as HTMLLabelElement
      const resolved = labelEl.htmlFor
        ? document.getElementById(labelEl.htmlFor)
        : labelEl.querySelector('input, select, textarea, button')
      if (resolved) el = resolved
    }

    const selector = getCssSelector(el)
    const id = (el as HTMLElement).id ?? ''

    if (!id) {
      tip.textContent = '⚠ IDなし — id属性を持つ要素を選択してください'
      tip.style.background = '#ef4444'
      tip.style.left = `${Math.min(e.clientX + 12, window.innerWidth - 220)}px`
      tip.style.top = `${e.clientY + 16}px`
      tip.style.display = 'block'
      return
    }

    window.parent.postMessage({ type: 'TETSUZUKI_QUEST_ELEMENT_PICKED', selector, id }, '*')
    stopPickMode()
  }

  document.addEventListener('mousemove', onMove, true)
  document.addEventListener('click', onClick, true)
  document.body.style.cursor = 'crosshair'

  pickCleanup = () => {
    document.removeEventListener('mousemove', onMove, true)
    document.removeEventListener('click', onClick, true)
    document.body.style.cursor = ''
    highlight.remove()
    tip.remove()
    pickCleanup = null
  }
}

function stopPickMode(): void {
  if (pickCleanup) pickCleanup()
}

const TetsuzukiQuest = {
  async start(jsonPath: string): Promise<void> {
    try {
      const res = await fetch(jsonPath)
      if (!res.ok) throw new Error(`Failed to fetch scenario: ${res.status}`)
      const scenario: Scenario = await res.json()
      TetsuzukiQuest.startWithScenario(scenario)
    } catch (err) {
      console.error('[TetsuzukiQuest] Failed to load scenario:', err)
      // Issue #10: ユーザーにエラーを通知
      showErrorDialog('シナリオの読み込みに失敗しました。')
    }
  },

  startWithScenario(scenario: Scenario): void {
    if (engine) {
      engine.destroy()
    }
    engine = new ScenarioEngine(scenario)
    engine.start()
  },

  stop(): void {
    if (engine) {
      engine.destroy()
      engine = null
    }
  },
}

// Issue #3: postMessage の origin 検証
// エディタのプレビューiframe内では同一オリジンからのメッセージのみ受け入れる
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) {
    console.warn('[TetsuzukiQuest] Untrusted origin:', event.origin)
    return
  }

  if (event.data?.type === 'TETSUZUKI_QUEST_START') {
    TetsuzukiQuest.startWithScenario(event.data.scenario as Scenario)
  }
  if (event.data?.type === 'TETSUZUKI_QUEST_STOP') {
    TetsuzukiQuest.stop()
  }
  if (event.data?.type === 'TETSUZUKI_QUEST_PICK_START') {
    startPickMode()
  }
  if (event.data?.type === 'TETSUZUKI_QUEST_PICK_CANCEL') {
    stopPickMode()
  }
})

function startWithPrompt(scenario: Scenario): void {
  const launch = () => {
    if (engine) engine.destroy()
    engine = new ScenarioEngine(scenario)
    engine.start()
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => showStartDialog(scenario, launch), { once: true })
  } else {
    showStartDialog(scenario, launch)
  }
}

export const { start, startWithScenario, stop } = TetsuzukiQuest
export { startWithPrompt }

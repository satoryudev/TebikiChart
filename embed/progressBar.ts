const BAR_ID = 'tq-progress-bar'

interface ProgressBarOptions {
  format?: 'steps' | 'percent'
}

let barEl: HTMLElement | null = null
let fillEl: HTMLElement | null = null
let labelEl: HTMLElement | null = null
let barFormat: 'steps' | 'percent' = 'steps'

export function initProgressBar(totalSteps: number, options?: ProgressBarOptions): void {
  removeProgressBar()
  barFormat = options?.format ?? 'steps'

  const container = document.createElement('div')
  container.id = BAR_ID
  container.style.cssText = `
    position:fixed;top:0;left:0;width:100%;height:48px;
    background:white;border-bottom:1px solid #e5e7eb;
    z-index:100001;display:flex;align-items:center;
    padding:0 16px;gap:12px;
    box-shadow:0 1px 4px rgba(0,0,0,0.05);
  `

  // Label
  const label = document.createElement('div')
  label.style.cssText = `
    font-size:13px;font-weight:600;color:#374151;white-space:nowrap;min-width:80px;
  `
  label.textContent = '0 / ' + totalSteps

  // Track
  const track = document.createElement('div')
  track.style.cssText = `
    flex:1;height:8px;background:#f3f4f6;border-radius:9999px;overflow:hidden;
  `

  const fill = document.createElement('div')
  fill.style.cssText = `
    height:100%;width:0%;background:#f97316;border-radius:9999px;
    transition:width 0.4s ease;
  `

  track.appendChild(fill)
  container.appendChild(label)
  container.appendChild(track)
  document.body.prepend(container)

  barEl = container
  fillEl = fill
  labelEl = label
}

export function updateProgressBar(current: number, total: number): void {
  if (!fillEl || !labelEl) return
  const pct = Math.min(100, Math.round((current / total) * 100))
  fillEl.style.width = pct + '%'
  if (barFormat === 'percent') {
    labelEl.textContent = pct + '%'
  } else {
    labelEl.textContent = `${current} / ${total}`
  }
}

export function completeProgressBar(total: number): void {
  if (!fillEl || !labelEl) return
  fillEl.style.width = '100%'
  if (barFormat === 'percent') {
    labelEl.textContent = '100%'
  } else {
    labelEl.textContent = `${total} / ${total}`
  }
  setTimeout(() => {
    if (barEl) {
      barEl.style.transition = 'opacity 0.4s ease'
      barEl.style.opacity = '0'
      setTimeout(removeProgressBar, 400)
    }
  }, 800)
}

export function removeProgressBar(): void {
  document.getElementById(BAR_ID)?.remove()
  barEl = null
  fillEl = null
  labelEl = null
}

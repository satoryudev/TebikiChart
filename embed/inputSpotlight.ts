import { InputSpotlightBlock } from './types'
import { showBubble, removeBubble } from './bubble'

const OVERLAY_ID = 'tq-input-overlay'

export function handleInputSpotlight(
  block: InputSpotlightBlock,
  onNext: () => void
): void {
  removeInputOverlay()

  const target = document.getElementById(block.targetId) as HTMLInputElement | null
  if (!target) {
    showBubble(block.message, onNext)
    return
  }

  const rect = target.getBoundingClientRect()
  const pad = 12
  const x1 = rect.left - pad
  const y1 = rect.top - pad
  const x2 = rect.right + pad
  const y2 = rect.bottom + pad

  const el = document.createElement('div')
  el.id = OVERLAY_ID
  el.style.cssText = `
    position:fixed;inset:0;
    background:transparent;
    z-index:99998;
    pointer-events:none;
  `

  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'

  const defs = document.createElementNS(svgNS, 'defs')
  const mask = document.createElementNS(svgNS, 'mask')
  mask.id = 'tq-input-mask'

  const fullRect = document.createElementNS(svgNS, 'rect')
  fullRect.setAttribute('x', '0')
  fullRect.setAttribute('y', '0')
  fullRect.setAttribute('width', '100%')
  fullRect.setAttribute('height', '100%')
  fullRect.setAttribute('fill', 'white')

  const hole = document.createElementNS(svgNS, 'rect')
  hole.setAttribute('x', String(x1))
  hole.setAttribute('y', String(y1))
  hole.setAttribute('width', String(x2 - x1))
  hole.setAttribute('height', String(y2 - y1))
  hole.setAttribute('rx', '4')
  hole.setAttribute('fill', 'black')

  mask.appendChild(fullRect)
  mask.appendChild(hole)
  defs.appendChild(mask)
  svg.appendChild(defs)

  const darken = document.createElementNS(svgNS, 'rect')
  darken.setAttribute('x', '0')
  darken.setAttribute('y', '0')
  darken.setAttribute('width', '100%')
  darken.setAttribute('height', '100%')
  darken.setAttribute('fill', 'rgba(0,0,0,0.75)')
  darken.setAttribute('mask', 'url(#tq-input-mask)')
  darken.style.pointerEvents = 'none'
  svg.appendChild(darken)

  el.appendChild(svg)
  document.body.appendChild(el)

  // Allow input
  const origPointerEvents = target.style.pointerEvents
  const origZIndex = target.style.zIndex
  target.style.pointerEvents = 'auto'
  target.style.zIndex = '99999'
  target.style.position = target.style.position || 'relative'
  target.focus()

  showBubble(block.message, () => {}, undefined, true)

  const handleBlur = () => {
    if (!target.value.trim()) {
      removeBubble()
      showBubble('入力してから次へ進んでください。', () => {}, 'thinking', true)
      target.focus()
      // { once: true } で消えたリスナーを再登録
      target.addEventListener('blur', handleBlur, { once: true })
      return
    }
    // cleanup
    target.style.pointerEvents = origPointerEvents
    target.style.zIndex = origZIndex
    removeInputOverlay()
    removeBubble()
    onNext()
  }

  target.addEventListener('blur', handleBlur, { once: true })
}

export function removeInputOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove()
}

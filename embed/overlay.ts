const OVERLAY_ID = 'tq-overlay'
const RING_ID = 'tq-ring'
const BLOCK_IDS = ['tq-block-top', 'tq-block-bottom', 'tq-block-left', 'tq-block-right'] as const

/**
 * ボタン周囲を4枚の div で囲んで暗転させる。
 * ボタン上には何も置かないため、スタッキングコンテキストに関わらずクリックが届く。
 */
export function showDarkenWithHole(x1: number, y1: number, x2: number, y2: number): void {
  removeDarkenWithHole()
  const bg = 'background:rgba(0,0,0,0.75);position:fixed;z-index:99998;pointer-events:all;'
  const specs: { id: string; style: string }[] = [
    { id: 'tq-block-top',    style: `${bg}left:0;top:0;right:0;height:${y1}px;` },
    { id: 'tq-block-bottom', style: `${bg}left:0;top:${y2}px;right:0;bottom:0;` },
    { id: 'tq-block-left',   style: `${bg}left:0;top:${y1}px;width:${x1}px;height:${y2 - y1}px;` },
    { id: 'tq-block-right',  style: `${bg}left:${x2}px;top:${y1}px;right:0;height:${y2 - y1}px;` },
  ]
  specs.forEach(({ id, style }) => {
    const d = document.createElement('div')
    d.id = id
    d.style.cssText = style
    document.body.appendChild(d)
  })
}

export function removeDarkenWithHole(): void {
  BLOCK_IDS.forEach(id => document.getElementById(id)?.remove())
}

let spotlightCleanup: (() => void) | null = null
let overlayResizeCleanup: (() => void) | null = null

let _origOverflow = ''
export function lockScroll(): void {
  _origOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
}
export function unlockScroll(): void {
  document.body.style.overflow = _origOverflow
}

/** SVG マスクを使って指定領域だけ暗転させる overlay SVG をコンテナ要素に追加する */
export function appendSvgMaskOverlay(
  container: HTMLElement,
  x1: number, y1: number, x2: number, y2: number,
  maskId: string,
  darkenPointerEvents = true,
): void {
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;'

  const defs = document.createElementNS(svgNS, 'defs')
  const mask = document.createElementNS(svgNS, 'mask')
  mask.id = maskId

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
  darken.setAttribute('mask', `url(#${maskId})`)
  if (!darkenPointerEvents) darken.style.pointerEvents = 'none'
  svg.appendChild(darken)

  container.appendChild(svg)
}

export function showOverlay(): void {
  removeOverlay()
  const el = document.createElement('div')
  el.id = OVERLAY_ID
  el.style.cssText = `
    position:fixed;inset:0;
    background:rgba(0,0,0,0.75);
    z-index:99998;
    pointer-events:all;
  `
  document.body.appendChild(el)
}

export function showSpotlightOverlay(selector: string, onTargetClick: () => void): void {
  removeOverlay()

  const target = document.querySelector(selector) as HTMLElement | null
  if (!target) {
    lockScroll()
    showOverlay()
    return
  }

  target.scrollIntoView({ block: 'center', inline: 'nearest' })
  lockScroll()

  const drawSpotlight = () => {
    removeDarkenWithHole()
    document.getElementById(RING_ID)?.remove()

    const r = target.getBoundingClientRect()
    const pad = 8
    const x1 = r.left - pad
    const y1 = r.top - pad
    const x2 = r.right + pad
    const y2 = r.bottom + pad

    showDarkenWithHole(x1, y1, x2, y2)

    const ring = document.createElement('div')
    ring.id = RING_ID
    ring.style.cssText = `
      position:fixed;
      left:${x1}px;top:${y1}px;
      width:${x2 - x1}px;height:${y2 - y1}px;
      border:3px solid #fbbf24;border-radius:6px;
      z-index:99999;pointer-events:none;
      animation:tq-pulse-ring 1.2s ease-out infinite;
    `
    document.body.appendChild(ring)
  }

  drawSpotlight()
  window.addEventListener('resize', drawSpotlight)
  overlayResizeCleanup = () => window.removeEventListener('resize', drawSpotlight)

  // Allow clicks on target only
  const origPointerEvents = target.style.pointerEvents
  const origPosition = target.style.position
  const origZIndex = target.style.zIndex
  target.style.pointerEvents = 'auto'
  target.style.position = target.style.position || 'relative'
  target.style.zIndex = '99999'

  const restoreTarget = () => {
    target.style.pointerEvents = origPointerEvents
    target.style.position = origPosition
    target.style.zIndex = origZIndex
    spotlightCleanup = null
  }

  spotlightCleanup = restoreTarget

  const handler = () => {
    restoreTarget()
    removeOverlay()
    onTargetClick()
  }
  target.addEventListener('click', handler, { once: true })
}

export function removeOverlay(): void {
  spotlightCleanup?.()
  overlayResizeCleanup?.()
  overlayResizeCleanup = null
  removeDarkenWithHole()
  document.getElementById(OVERLAY_ID)?.remove()
  document.getElementById(RING_ID)?.remove()
  unlockScroll()
}

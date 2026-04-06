import { Scenario, Block } from './types'
import { showBubble, showBranchBubble, removeBubble } from './bubble'
import { showOverlay, removeOverlay } from './overlay'
import { handleInputSpotlight, removeInputOverlay } from './inputSpotlight'
import { removeDocumentPreview } from './documentPreview'
import { initProgressBar, updateProgressBar, completeProgressBar, removeProgressBar } from './progressBar'

export class ScenarioEngine {
  private scenario: Scenario
  private currentBlockId: string | null
  private currentStep: number
  private totalSteps: number

  constructor(scenario: Scenario) {
    this.scenario = scenario
    this.currentBlockId = null
    this.currentStep = 0
    this.totalSteps = scenario.totalSteps ?? scenario.blocks.filter((b) => b.type !== 'start' && b.type !== 'end').length
  }

  start(): void {
    this.currentBlockId = this.scenario.startBlockId
    this.currentStep = 0
    initProgressBar(this.totalSteps)
    if (this.currentBlockId) {
      this.renderCurrentBlock()
    }
  }

  next(blockId: string | null): void {
    if (!blockId) {
      this.cleanup()
      return
    }
    this.currentBlockId = blockId
    this.renderCurrentBlock()
  }

  private renderCurrentBlock(): void {
    if (!this.currentBlockId) return
    const block = this.scenario.blocks.find((b) => b.id === this.currentBlockId)
    if (!block) {
      this.cleanup()
      return
    }
    this.currentStep++
    updateProgressBar(this.currentStep, this.totalSteps)
    window.parent.postMessage({ type: 'TETSUZUKI_QUEST_BLOCK_ACTIVE', blockId: block.id }, '*')
    this.render(block)
  }

  private render(block: Block): void {
    switch (block.type) {
      case 'start':
        this.currentStep--
        if (block.message) {
          showOverlay()
          showBubble(block.message, () => this.next(block.nextId), block.characterMood)
        } else {
          this.next(block.nextId)
        }
        break

      case 'end':
        this.finish(block.message)
        break

      case 'speech':
        showOverlay()
        showBubble(
          block.message,
          () => this.next(block.nextId),
          block.characterMood
        )
        break

      case 'input-spotlight':
        removeOverlay()
        handleInputSpotlight(block, () => this.next(block.nextId))
        break

      case 'branch':
        showOverlay()
        showBranchBubble(
          block.question,
          block.options.map((opt) => ({
            label: opt.label,
            color: opt.color,
            onSelect: () => this.next(opt.nextId),
          }))
        )
        break
    }
  }

  /** オーバーレイ等を除去するだけ（終了ブロックなしでチェーンが途切れた場合） */
  private cleanup(): void {
    completeProgressBar(this.totalSteps)
    removeBubble()
    removeOverlay()
    removeInputOverlay()
    removeDocumentPreview()
    window.parent.postMessage({ type: 'TETSUZUKI_QUEST_BLOCK_ACTIVE', blockId: null }, '*')
  }

  finish(message?: string): void {
    this.cleanup()
    const body = message ?? '手続きの流れを確認できました。'
    const toast = document.createElement('div')
    toast.id = 'tq-completion-toast'
    toast.style.cssText = `
      position:fixed;bottom:24px;right:24px;
      background:white;border-radius:16px;padding:20px 24px;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);
      z-index:100001;display:flex;align-items:center;gap:16px;
      animation:tq-slide-in 0.3s ease;
      pointer-events:auto;
    `
    toast.innerHTML = `
      <div style="font-size:36px;">🎉</div>
      <div>
        <div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:2px;">チュートリアル完了！</div>
        <div style="font-size:13px;color:#6b7280;">${body.replace(/</g, '&lt;')}</div>
      </div>
      <button id="tq-completion-close" style="
        background:transparent;border:none;color:#9ca3af;
        font-size:20px;cursor:pointer;padding:4px;line-height:1;
        margin-left:8px;
      ">✕</button>
    `
    document.body.appendChild(toast)
    document.getElementById('tq-completion-close')!.onclick = () => toast.remove()
    setTimeout(() => toast.remove(), 5000)

    window.parent.postMessage({ type: 'TETSUZUKI_QUEST_FINISHED' }, '*')
  }

  destroy(): void {
    removeBubble()
    removeOverlay()
    removeInputOverlay()
    removeDocumentPreview()
    removeProgressBar()
    // Remove completion toast if shown
    document.getElementById('tq-completion-toast')?.remove()
  }
}

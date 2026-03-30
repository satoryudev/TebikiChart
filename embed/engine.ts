import { Scenario, Block } from './types'
import { showBubble, showBranchBubble, removeBubble } from './bubble'
import { showOverlay, showSpotlightOverlay, removeOverlay } from './overlay'
import { handleInputSpotlight, removeInputOverlay } from './inputSpotlight'
import { handleDocumentPreview, removeDocumentPreview } from './documentPreview'
import { handleValidation, removeValidation } from './validation'
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
    this.totalSteps = scenario.totalSteps ?? scenario.blocks.length
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
      this.finish()
      return
    }
    this.currentBlockId = blockId
    this.renderCurrentBlock()
  }

  private renderCurrentBlock(): void {
    if (!this.currentBlockId) return
    const block = this.scenario.blocks.find((b) => b.id === this.currentBlockId)
    if (!block) {
      this.finish()
      return
    }
    this.currentStep++
    updateProgressBar(this.currentStep, this.totalSteps)
    this.render(block)
  }

  private render(block: Block): void {
    switch (block.type) {
      case 'speech':
        showOverlay()
        showBubble(
          block.message,
          () => this.next(block.nextId),
          block.characterMood
        )
        break

      case 'spotlight':
        showSpotlightOverlay(block.targetSelector, () => {
          removeBubble()
          this.next(block.nextId)
        })
        showBubble(block.message, () => {}, undefined, true)
        break

      case 'input-spotlight':
        removeOverlay()
        handleInputSpotlight(block, () => this.next(block.nextId))
        break

      case 'document-preview':
        removeOverlay()
        handleDocumentPreview(block, () => this.next(block.nextId))
        break

      case 'validation':
        removeOverlay()
        handleValidation(block, () => this.next(block.nextId))
        break

      case 'branch':
        showOverlay()
        showBranchBubble(
          block.question,
          () => this.next(block.yesNextId),
          () => this.next(block.noNextId)
        )
        break
    }
  }

  finish(): void {
    completeProgressBar(this.totalSteps)
    removeBubble()
    removeOverlay()
    removeInputOverlay()
    removeDocumentPreview()
    removeValidation()

    // Show completion message
    const msg = document.createElement('div')
    msg.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,0.7);
      z-index:100001;display:flex;align-items:center;justify-content:center;
      animation:tq-slide-in 0.3s ease;
    `
    msg.innerHTML = `
      <div style="
        background:white;border-radius:20px;padding:40px;text-align:center;
        max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="font-size:56px;margin-bottom:16px;">🎉</div>
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1f2937;">チュートリアル完了！</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">手続きの流れを確認できました。</p>
        <button onclick="this.closest('div[style]').remove()" style="
          background:#3b82f6;color:white;border:none;
          padding:10px 32px;border-radius:10px;font-size:14px;
          cursor:pointer;font-weight:600;
        ">閉じる</button>
      </div>
    `
    document.body.appendChild(msg)
  }

  destroy(): void {
    removeBubble()
    removeOverlay()
    removeInputOverlay()
    removeDocumentPreview()
    removeValidation()
    removeProgressBar()
    // Remove completion overlay if shown
    document.querySelectorAll('[style*="z-index:100001"]').forEach((el) => el.remove())
  }
}

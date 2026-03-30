import { DocumentPreviewBlock } from './types'
import { showBubble, removeBubble } from './bubble'

const PREVIEW_BTN_CLASS = 'tq-doc-preview-btn'
const MODAL_ID = 'tq-doc-modal'

// Simple placeholder SVG images (embedded)
function getDocumentPreviewContent(type: DocumentPreviewBlock['documentType'], customUrl?: string): string {
  // 旧 custom（URL直指定）
  if (type === 'custom' && customUrl) {
    return `<img src="${customUrl}" alt="書類の見本" style="max-width:100%;border-radius:8px;">`
  }

  // カスタムアップロード（LocalStorage から取得）
  if (type.startsWith('cdoc-')) {
    try {
      const list: { id: string; label: string; imageBase64: string }[] =
        JSON.parse(localStorage.getItem('tq_custom_doc_types') ?? '[]')
      const found = list.find((d) => d.id === type)
      if (found) {
        return `<img src="${found.imageBase64}" alt="${found.label}" style="max-width:100%;border-radius:8px;">`
      }
    } catch { /* ignore */ }
    return `<p style="color:#6b7280;text-align:center;">画像が見つかりません</p>`
  }

  const placeholders: Record<string, string> = {
    'mynumber-card': `
      <div style="
        width:340px;height:200px;background:linear-gradient(135deg,#1e40af,#3b82f6);
        border-radius:12px;padding:16px;color:white;
        display:flex;flex-direction:column;justify-content:space-between;
        box-shadow:0 4px 20px rgba(0,0,0,0.2);
      ">
        <div style="font-size:11px;opacity:0.8">個人番号カード (マイナンバーカード)</div>
        <div style="display:flex;gap:12px;align-items:center;">
          <div style="width:60px;height:80px;background:rgba(255,255,255,0.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:28px;">👤</div>
          <div>
            <div style="font-size:16px;font-weight:bold;margin-bottom:4px;">山田 太郎</div>
            <div style="font-size:11px;opacity:0.8">生年月日: 昭和60年1月1日</div>
            <div style="font-size:11px;opacity:0.8">性別: 男</div>
            <div style="font-size:11px;opacity:0.8;margin-top:8px;">住所: 東京都千代田区...</div>
          </div>
        </div>
        <div style="font-size:10px;opacity:0.7">有効期限: 令和15年1月1日まで有効</div>
      </div>
    `,
    receipt: `
      <div style="
        width:280px;background:white;border:1px solid #e5e7eb;
        border-radius:8px;padding:20px;
        font-family:monospace;font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
      ">
        <div style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:12px;border-bottom:2px solid #1f2937;padding-bottom:8px;">領 収 書</div>
        <div style="margin-bottom:8px;">山田 太郎 様</div>
        <div style="margin:12px 0;padding:8px;background:#f9fafb;border-radius:4px;">
          <div style="display:flex;justify-content:space-between;">
            <span>手数料</span><span>¥500</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;border-top:1px solid #e5e7eb;padding-top:8px;">
          <span>合計</span><span>¥500</span>
        </div>
        <div style="margin-top:16px;text-align:right;font-size:10px;color:#6b7280;">
          ○○市役所<br>令和6年1月1日
        </div>
      </div>
    `,
    'residence-certificate': `
      <div style="
        width:320px;background:white;border:2px solid #1f2937;
        border-radius:4px;padding:20px;
        font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
      ">
        <div style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:16px;">住 民 票 の 写 し</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;width:100px;">氏名</td><td style="padding:4px 8px;border:1px solid #d1d5db;">山田 太郎</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">生年月日</td><td style="padding:4px 8px;border:1px solid #d1d5db;">昭和60年1月1日生</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">性別</td><td style="padding:4px 8px;border:1px solid #d1d5db;">男</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">住所</td><td style="padding:4px 8px;border:1px solid #d1d5db;">東京都千代田区千代田1-1</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">世帯主</td><td style="padding:4px 8px;border:1px solid #d1d5db;">山田 太郎</td></tr>
        </table>
        <div style="margin-top:16px;text-align:right;font-size:10px;color:#6b7280;">
          発行日：令和6年1月1日<br>千代田区長
        </div>
      </div>
    `,
  }

  return placeholders[type] ?? placeholders['mynumber-card']
}

export function handleDocumentPreview(
  block: DocumentPreviewBlock,
  onNext: () => void
): void {
  const target = document.getElementById(block.targetId)

  // Insert preview button after the target input
  const existingBtn = document.querySelector(`.${PREVIEW_BTN_CLASS}`) as HTMLElement | null
  existingBtn?.remove()

  if (target) {
    const btn = document.createElement('button')
    btn.className = PREVIEW_BTN_CLASS
    btn.textContent = `🔍 ${block.buttonLabel ?? '見本を確認'}`
    btn.style.cssText = `
      display:inline-block;margin-top:6px;margin-left:8px;
      background:transparent;border:1.5px solid #0d9488;
      color:#0d9488;padding:4px 12px;border-radius:6px;
      font-size:13px;cursor:pointer;font-weight:600;
      transition:all 0.15s;
    `
    btn.onmouseover = () => {
      btn.style.background = '#0d9488'
      btn.style.color = 'white'
    }
    btn.onmouseout = () => {
      btn.style.background = 'transparent'
      btn.style.color = '#0d9488'
    }
    btn.onclick = () => showModal(block)

    // Insert after target
    target.insertAdjacentElement('afterend', btn)
  }

  showBubble(block.message, () => {
    document.querySelector(`.${PREVIEW_BTN_CLASS}`)?.remove()
    onNext()
  })
}

function showModal(block: DocumentPreviewBlock): void {
  document.getElementById(MODAL_ID)?.remove()

  const backdrop = document.createElement('div')
  backdrop.id = MODAL_ID
  backdrop.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.6);
    z-index:200000;display:flex;align-items:center;justify-content:center;
    animation:tq-slide-in 0.2s ease;
  `

  const card = document.createElement('div')
  card.style.cssText = `
    background:white;border-radius:16px;padding:24px;
    max-width:480px;width:90%;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);
  `

  const title = document.createElement('h3')
  title.textContent = '書類の見本'
  title.style.cssText = 'margin:0 0 16px;font-size:16px;font-weight:700;color:#1f2937;'

  const content = document.createElement('div')
  content.style.cssText = 'display:flex;justify-content:center;margin-bottom:20px;'
  content.innerHTML = getDocumentPreviewContent(block.documentType, block.previewImageUrl)

  const closeBtn = document.createElement('button')
  closeBtn.textContent = '閉じる'
  closeBtn.style.cssText = `
    width:100%;background:#f3f4f6;border:none;
    padding:10px;border-radius:8px;font-size:14px;
    cursor:pointer;font-weight:600;color:#374151;
    transition:background 0.15s;
  `
  closeBtn.onmouseover = () => { closeBtn.style.background = '#e5e7eb' }
  closeBtn.onmouseout = () => { closeBtn.style.background = '#f3f4f6' }
  closeBtn.onclick = () => backdrop.remove()
  backdrop.onclick = (e) => { if (e.target === backdrop) backdrop.remove() }

  card.appendChild(title)
  card.appendChild(content)
  card.appendChild(closeBtn)
  backdrop.appendChild(card)
  document.body.appendChild(backdrop)
}

export function removeDocumentPreview(): void {
  document.getElementById(MODAL_ID)?.remove()
  document.querySelector(`.${PREVIEW_BTN_CLASS}`)?.remove()
}

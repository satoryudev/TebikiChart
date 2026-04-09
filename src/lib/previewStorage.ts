// プレビューキャッシュ
// - window キャッシュ: セッション内の高速アクセス用（サイズ制限なし）
// - localStorage: リロード後も保持（元HTMLのみ保存してサイズを節約）

const LS_PREFIX = 'tebiki_preview_'

interface SessionData {
  fileName: string
  html: string // embed.js 注入済み HTML
}

interface StoredData {
  fileName: string
  originalHtml: string // 注入前の元 HTML
}

declare global {
  interface Window {
    __tebikiPreviewCache?: Map<string, SessionData>
  }
}

function getCache(): Map<string, SessionData> {
  if (typeof window === 'undefined') return new Map()
  if (!window.__tebikiPreviewCache) {
    window.__tebikiPreviewCache = new Map()
  }
  return window.__tebikiPreviewCache
}

export function savePreviewData(
  scenarioId: string,
  data: SessionData & { originalHtml: string },
): void {
  // window キャッシュに注入済み HTML を保存
  getCache().set(scenarioId, { fileName: data.fileName, html: data.html })
  // localStorage に元 HTML のみ保存（サイズ節約）
  try {
    const stored: StoredData = { fileName: data.fileName, originalHtml: data.originalHtml }
    localStorage.setItem(LS_PREFIX + scenarioId, JSON.stringify(stored))
  } catch {
    // localStorage 容量超過は無視（window キャッシュのみで継続）
  }
}

/** 注入済み HTML を window キャッシュから返す。なければ localStorage の元 HTML を返す */
export function loadPreviewData(scenarioId: string): SessionData | StoredData | null {
  // window キャッシュを優先（注入済みのため即座に Blob 化できる）
  const cached = getCache().get(scenarioId)
  if (cached) return cached

  // localStorage から元 HTML を復元
  try {
    const raw = localStorage.getItem(LS_PREFIX + scenarioId)
    if (raw) return JSON.parse(raw) as StoredData
  } catch {
    // ignore
  }
  return null
}

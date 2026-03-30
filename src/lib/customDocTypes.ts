const STORAGE_KEY = 'tq_custom_doc_types'

export interface CustomDocType {
  id: string         // 'cdoc-xxxxx'
  label: string      // エディタのセレクトに表示する名前
  imageBase64: string
}

export function loadCustomDocTypes(): CustomDocType[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveCustomDocType(doc: CustomDocType): void {
  const list = loadCustomDocTypes().filter((d) => d.id !== doc.id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...list, doc]))
}

export function deleteCustomDocType(id: string): void {
  const list = loadCustomDocTypes().filter((d) => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

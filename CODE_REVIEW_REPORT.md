# GovGuide コードレビュー報告書

**レビュー日時**: 2024年12月  
**対象プロジェクト**: GovGuide (TetsuzukiQuest)  
**レビュー範囲**: 全TypeScript/TSXファイル（30ファイル）

---

## 📊 エグゼクティブサマリー

### 重大度別集計
- 🔴 **緊急 (Critical)**: 8件
- 🟡 **高 (High)**: 12件
- 🟢 **中 (Medium)**: 15件
- ⚪ **低 (Low)**: 10件

### 主要な懸念事項
1. **セキュリティ**: XSS脆弱性、postMessageの不適切な検証、LocalStorageのクライアント側検証欠如
2. **型安全性**: 複数箇所での型アサーション、any型の使用
3. **エラーハンドリング**: try-catchの欠如、エラー時のフォールバック不足
4. **アクセシビリティ**: ARIA属性の欠如、キーボードナビゲーション不完全

---

## 🔴 緊急 (Critical) - 即座に修正が必要

### 1. XSS脆弱性 - innerHTML使用の危険性

**ファイル**: `embed/index.ts:130-137`

**問題**:
```typescript
card.innerHTML = `
  <div style="font-size:48px;margin-bottom:12px;">🧭</div>
  <div style="font-size:17px;font-weight:700;color:#1f2937;margin-bottom:6px;">
    ${scenario.title.replace(/</g, '&lt;')}
  </div>
```

ユーザー入力（scenario.title）を`innerHTML`で直接挿入しています。`replace(/</g, '&lt;')`のエスケープは不完全で、`>`、`"`、`'`、`&`などが対象外です。

**推奨修正**:
```typescript
function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// または
const title = document.createElement('div');
title.textContent = scenario.title;
card.appendChild(title);
```

**影響**: 悪意のあるシナリオタイトルを含むJSONファイルを読み込むとXSSが発生します。

---

### 2. XSS脆弱性 - メッセージ表示での不適切なエスケープ

**ファイル**: `embed/bubble.ts:86-99`, `embed/engine.ts:120`

**問題**:
```typescript
msgEl.textContent += message[i++]  // bubble.ts
toast.innerHTML = `... ${body.replace(/</g, '&lt;')}` // engine.ts
```

`bubble.ts`では`textContent`を使用しているため安全ですが、`engine.ts`では不完全なエスケープで`innerHTML`を使用しています。

**推奨修正**:
全てのユーザー入力は`textContent`または適切なエスケープ関数を使用してください。

---

### 3. postMessage検証の欠如

**ファイル**: `embed/index.ts:189-202`, `src/app/editor/[id]/page.tsx:226-244`

**問題**:
```typescript
window.addEventListener('message', (event) => {
  if (event.data?.type === 'TETSUZUKI_QUEST_START') {
    TetsuzukiQuest.startWithScenario(event.data.scenario as Scenario)
  }
  // origin チェックがない
})
```

postMessageの送信元（origin）を検証していないため、悪意のあるサイトから任意のシナリオを注入できます。

**推奨修正**:
```typescript
window.addEventListener('message', (event) => {
  // 信頼できるoriginのみ許可
  const allowedOrigins = [window.location.origin, 'https://trusted-domain.com'];
  if (!allowedOrigins.includes(event.origin)) {
    console.warn('Untrusted origin:', event.origin);
    return;
  }
  
  if (event.data?.type === 'TETSUZUKI_QUEST_START') {
    // さらにデータ検証を追加
    if (!isValidScenario(event.data.scenario)) {
      console.error('Invalid scenario data');
      return;
    }
    TetsuzukiQuest.startWithScenario(event.data.scenario as Scenario);
  }
})
```

---

### 4. LocalStorageのデータ検証欠如

**ファイル**: `src/lib/scenarioStorage.ts:104-126`, `src/lib/customDocTypes.ts:9-15`

**問題**:
```typescript
export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const scenarios = JSON.parse(raw) as Scenario[]
    // 型検証がない
    return scenarios
  } catch {
    return [DEMO_SCENARIO]
  }
}
```

LocalStorageから取得したデータを型アサーションのみで処理しており、実行時のバリデーションがありません。ユーザーがブラウザのDevToolsで悪意のあるデータを注入できます。

**推奨修正**:
```typescript
import { z } from 'zod';

const ScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['moving', 'mynumber', 'tax', 'childcare']),
  blocks: z.array(z.object({
    id: z.string(),
    type: z.enum(['start', 'end', 'speech', 'input-spotlight', 'branch']),
    // ... その他のフィールド
  })),
  // ...
});

export function loadScenarios(): Scenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [DEMO_SCENARIO];
    
    const data = JSON.parse(raw);
    const result = z.array(ScenarioSchema).safeParse(data);
    
    if (!result.success) {
      console.error('Invalid scenario data:', result.error);
      return [DEMO_SCENARIO];
    }
    
    return result.data;
  } catch {
    return [DEMO_SCENARIO];
  }
}
```

---

### 5. 正規表現インジェクション

**ファイル**: `embed/inputSpotlight.ts:72`, `src/components/editor/BlockEditor.tsx:23-34`

**問題**:
```typescript
const regex = block.validationPattern ? new RegExp(block.validationPattern) : null
```

ユーザーが入力した正規表現パターンを直接`new RegExp()`に渡しています。悪意のあるパターン（例：`(a+)+b`）でReDoS攻撃が可能です。

**推奨修正**:
```typescript
function createSafeRegex(pattern: string): RegExp | null {
  try {
    const regex = new RegExp(pattern);
    // タイムアウト付きでテスト
    const testStr = 'a'.repeat(100);
    const start = Date.now();
    regex.test(testStr);
    if (Date.now() - start > 100) {
      console.error('Regex pattern may cause ReDoS');
      return null;
    }
    return regex;
  } catch {
    return null;
  }
}
```

または、安全なバリデーションライブラリ（validator.js等）を使用してください。

---

### 6. CSS Selectorインジェクション

**ファイル**: `embed/index.ts:9-18`

**問題**:
```typescript
function getCssSelector(el: Element): string {
  if (el.id) return `#${el.id}`
  // ...
  return `${getCssSelector(parent)} > ${tag}:nth-of-type(${idx})`
}
```

IDに特殊文字（例：`test#id`、`test>id`）が含まれる場合、無効なセレクタが生成されます。

**推奨修正**:
```typescript
function getCssSelector(el: Element): string {
  if (el.id) {
    // CSS.escape() でIDをエスケープ
    return `#${CSS.escape(el.id)}`;
  }
  // ...
}
```

---

### 7. メモリリーク - イベントリスナーのクリーンアップ不足

**ファイル**: `embed/inputSpotlight.ts:46`, `embed/overlay.ts:123`

**問題**:
```typescript
window.addEventListener('resize', drawInputOverlay)
// クリーンアップが特定の条件でしか呼ばれない
```

複数のブロックを連続で実行するとresizeイベントリスナーが蓄積します。

**推奨修正**:
既存のクリーンアップ関数を確実に呼び出すか、AbortControllerを使用：
```typescript
const abortController = new AbortController();
window.addEventListener('resize', drawInputOverlay, { signal: abortController.signal });

// クリーンアップ時
abortController.abort();
```

---

### 8. 無制限のLocalStorage書き込み

**ファイル**: `src/lib/customDocTypes.ts:18-28`

**問題**:
```typescript
export function saveCustomDocType(doc: CustomDocType): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...list, doc]))
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert('画像のサイズが大きすぎて保存できませんでした。')
    }
  }
}
```

画像がBase64エンコードされたまま保存され、LocalStorageの容量（通常5-10MB）を圧迫します。複数回の保存試行でデータが失われる可能性があります。

**推奨修正**:
1. 画像サイズを事前チェック（例：最大1MB）
2. IndexedDBまたはサーバーストレージを使用
3. 画像圧縮を実装

```typescript
export async function saveCustomDocType(doc: CustomDocType): Promise<void> {
  // Base64のサイズをチェック（概算: 元のサイズ × 1.37）
  const sizeInBytes = (doc.imageBase64.length * 3) / 4;
  const MAX_SIZE = 1024 * 1024; // 1MB
  
  if (sizeInBytes > MAX_SIZE) {
    throw new Error(`画像サイズが大きすぎます（最大${MAX_SIZE / 1024 / 1024}MB）`);
  }
  
  // 既存のコード...
}
```

---

## 🟡 高 (High) - 早急に修正すべき

### 9. 型安全性の欠如 - 多数の型アサーション

**ファイル**: 複数箇所

**問題**:
```typescript
// embed/index.ts:165
const scenario: Scenario = await res.json()

// src/store/editorStore.ts:177
const branch = scenario.blocks.find((b) => b.id === branchId) as BranchBlock | undefined

// src/app/editor/[id]/page.tsx:114
const id = params.id as string
```

型アサーションが多用されており、実行時の型安全性が保証されていません。

**推奨修正**:
zodやio-tsなどのランタイムバリデーションライブラリを導入し、外部データの検証を実装してください。

---

### 10. エラーハンドリングの不足

**ファイル**: `embed/index.ts:161-169`

**問題**:
```typescript
async start(jsonPath: string): Promise<void> {
  try {
    const res = await fetch(jsonPath)
    if (!res.ok) throw new Error(`Failed to fetch scenario: ${res.status}`)
    const scenario: Scenario = await res.json()
    TetsuzukiQuest.startWithScenario(scenario)
  } catch (err) {
    console.error('[TetsuzukiQuest] Failed to load scenario:', err)
    // ユーザーへのフィードバックがない
  }
}
```

エラーが発生してもコンソールにログを出すだけで、UIでのエラー表示がありません。

**推奨修正**:
```typescript
async start(jsonPath: string): Promise<void> {
  try {
    const res = await fetch(jsonPath)
    if (!res.ok) throw new Error(`Failed to fetch scenario: ${res.status}`)
    const scenario: Scenario = await res.json()
    TetsuzukiQuest.startWithScenario(scenario)
  } catch (err) {
    console.error('[TetsuzukiQuest] Failed to load scenario:', err)
    
    // ユーザーに通知
    const errorDialog = document.createElement('div');
    errorDialog.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;">
        <div style="background:white;padding:24px;border-radius:8px;max-width:400px;">
          <h3 style="color:#ef4444;margin-bottom:12px;">エラー</h3>
          <p>シナリオの読み込みに失敗しました。</p>
          <button onclick="this.closest('div').remove()" style="margin-top:16px;padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;">閉じる</button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDialog);
  }
}
```

---

### 11. 無限ループの可能性

**ファイル**: `src/lib/branchChain.ts:16-33`

**問題**:
```typescript
export function getBranchChain(blocks: Block[], startId: string | null): Block[] {
  const result: Block[] = []
  let currentId = startId
  const visited = new Set<string>()
  while (currentId) {
    if (visited.has(currentId)) break  // 循環参照検出
    // ...
  }
  return result
}
```

`visited`による循環参照検出はありますが、ユーザーが意図的に作成できる循環参照をエディタUIで防いでいません。

**推奨修正**:
ブロック接続時に循環参照をチェックし、UIでエラーを表示：
```typescript
export function hasCycle(blocks: Block[], startId: string): boolean {
  const visited = new Set<string>();
  let current = startId;
  
  while (current) {
    if (visited.has(current)) return true;
    visited.add(current);
    
    const block = blocks.find(b => b.id === current);
    if (!block || block.type === 'end') break;
    
    current = 'nextId' in block ? block.nextId : null;
  }
  
  return false;
}

// editorStore.ts で使用
updateBlock: (block) => {
  const newBlocks = scenario.blocks.map((b) => (b.id === block.id ? block : b));
  if ('nextId' in block && block.nextId && hasCycle(newBlocks, block.id)) {
    alert('循環参照が検出されました。この接続はできません。');
    return;
  }
  // 既存の処理...
}
```

---

### 12. DOM要素の存在チェック不足

**ファイル**: `embed/bubble.ts:132`, `embed/engine.ts:129`

**問題**:
```typescript
btn.onclick = () => { removeBubble(); onNext() }
// 要素が既に削除されている可能性がある

document.getElementById('tq-completion-close')!.onclick = () => toast.remove()
// non-null assertion (!) で要素の存在を仮定
```

**推奨修正**:
```typescript
const closeBtn = document.getElementById('tq-completion-close');
if (closeBtn) {
  closeBtn.onclick = () => toast.remove();
}
```

---

### 13. Race Condition - 非同期処理の競合

**ファイル**: `src/app/editor/[id]/page.tsx:283-299`

**問題**:
```typescript
const handlePlay = () => {
  const iframe = iframeRef.current
  if (!iframe) return
  iframe.src = getPreviewSrc()
  iframe.onload = () => {
    iframe.onload = null
    iframe.contentWindow?.postMessage({ type: 'TETSUZUKI_QUEST_START', scenario }, '*')
    setIsPlaying(true)
  }
}
```

ユーザーが連続してPlay/Stopを押すと、iframeのonloadハンドラーが競合する可能性があります。

**推奨修正**:
```typescript
const loadingRef = useRef(false);

const handlePlay = () => {
  if (loadingRef.current) return; // 二重実行防止
  
  const iframe = iframeRef.current;
  if (!iframe) return;
  
  loadingRef.current = true;
  iframe.src = getPreviewSrc();
  iframe.onload = () => {
    iframe.onload = null;
    loadingRef.current = false;
    iframe.contentWindow?.postMessage({ type: 'TETSUZUKI_QUEST_START', scenario }, '*');
    setIsPlaying(true);
  };
}
```

---

### 14. undoスタックの制限不足

**ファイル**: `src/store/editorStore.ts:68`

**問題**:
```typescript
const UNDO_LIMIT = 50
```

各undo履歴はブロック配列全体のコピーを保持します。大規模なシナリオ（例：500ブロック）では、メモリ使用量が膨大になります。

**推奨修正**:
1. 差分のみを保存する（immutable.jsやimmerを使用）
2. LIMITを動的に調整（シナリオサイズに応じて）
3. 古い履歴を圧縮

---

### 15. querySelector/getElementById のNull安全性

**ファイル**: `embed/overlay.ts:82`

**問題**:
```typescript
const target = document.querySelector(selector) as HTMLElement | null
if (!target) {
  lockScroll()
  showOverlay()
  return
}
```

要素が見つからない場合にフォールバックしていますが、エラーメッセージがないため、ユーザーは問題に気づけません。

**推奨修正**:
```typescript
const target = document.querySelector(selector) as HTMLElement | null;
if (!target) {
  console.warn(`Target element not found: ${selector}`);
  showBubble('指定された要素が見つかりませんでした。ページを確認してください。', () => {});
  return;
}
```

---

### 16. ファイルアップロードのサイズ制限

**ファイル**: `src/components/editor/BlockEditor.tsx:456-472`

**問題**:
```typescript
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file || !newLabel.trim()) return
  // ファイルサイズのチェックがない
  const imageBase64 = await fileToBase64(file)
  saveCustomDocType({ id, label: newLabel.trim(), imageBase64 })
}
```

**推奨修正**:
```typescript
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !newLabel.trim()) return;
  
  if (file.size > MAX_FILE_SIZE) {
    alert(`ファイルサイズが大きすぎます（最大${MAX_FILE_SIZE / 1024 / 1024}MB）`);
    return;
  }
  
  if (!file.type.startsWith('image/')) {
    alert('画像ファイルのみアップロード可能です');
    return;
  }
  
  setUploading(true);
  try {
    const imageBase64 = await fileToBase64(file);
    saveCustomDocType({ id, label: newLabel.trim(), imageBase64 });
    // ...
  } catch (error) {
    alert('画像のアップロードに失敗しました');
  } finally {
    setUploading(false);
  }
}
```

---

### 17. ScenarioEngineの状態管理

**ファイル**: `embed/engine.ts:8-19`

**問題**:
```typescript
export class ScenarioEngine {
  private scenario: Scenario
  private currentBlockId: string | null
  private currentStep: number
  private totalSteps: number
  // 複数のシナリオを同時実行すると状態が混ざる可能性
}
```

グローバル変数`engine`で単一インスタンスを管理していますが、destroy()前に新しいシナリオを開始すると、前のシナリオのクリーンアップが不完全な可能性があります。

**推奨修正**:
```typescript
export class ScenarioEngine {
  private destroyed = false;
  
  start(): void {
    if (this.destroyed) {
      throw new Error('Cannot start destroyed engine');
    }
    // ...
  }
  
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    // クリーンアップ...
  }
}
```

---

### 18. 予期しない再レンダリング

**ファイル**: `src/app/editor/[id]/page.tsx:100-101`

**問題**:
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [activeBlockId, resetBranchView, setBranchView])
```

依存配列が不完全で、eslint-disableで無視しています。予期しない動作の原因になります。

**推奨修正**:
```typescript
// useCallbackでsetBranchViewとresetBranchViewをメモ化
const handleActiveBlockChange = useCallback(() => {
  if (!activeBlockId) return;
  const blocks = useEditorStore.getState().scenario?.blocks ?? [];
  const stack = findBranchStackForBlock(blocks, activeBlockId);
  if (stack.length === 0) {
    resetBranchView();
  } else {
    setBranchView(stack[stack.length - 1]);
  }
  // スクロール処理...
}, [activeBlockId, resetBranchView, setBranchView]);

useEffect(() => {
  handleActiveBlockChange();
}, [handleActiveBlockChange]);
```

---

### 19. LocalStorageの同期問題

**ファイル**: `src/lib/scenarioStorage.ts`

**問題**:
複数タブで同時編集すると、一方の変更が上書きされます。storage eventのリスニングがありません。

**推奨修正**:
```typescript
// グローバルでstorageイベントを監視
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      // Zustandストアを更新
      const scenarios = JSON.parse(e.newValue);
      useEditorStore.getState().setScenario(/* 現在のシナリオを再読込 */);
    }
  });
}
```

---

### 20. CSS-in-JSのパフォーマンス問題

**ファイル**: `embed/bubble.ts`, `embed/overlay.ts` 等

**問題**:
スタイルが文字列として毎回生成されています。頻繁な再描画でパフォーマンスに影響します。

**推奨修正**:
スタイルシートを一度だけ注入：
```typescript
function injectStyles() {
  if (document.getElementById('tq-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'tq-styles';
  style.textContent = `
    .tq-bubble { position:fixed; bottom:24px; left:24px; /* ... */ }
    .tq-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); /* ... */ }
    /* ... */
  `;
  document.head.appendChild(style);
}
```

---

## 🟢 中 (Medium) - 改善を推奨

### 21. マジックナンバーの多用

**ファイル**: `src/app/editor/[id]/page.tsx:23-26`

**問題**:
```typescript
const PANEL_MIN = 160
const COLLAPSED_W = 32
const CANVAS_MIN = 320
const DIVIDERS_W = 12
```

定数として定義されていますが、意味が不明確です。

**推奨修正**:
```typescript
const LAYOUT_CONSTANTS = {
  PANEL_MIN_WIDTH: 160,        // パネルの最小幅（px）
  COLLAPSED_TAB_WIDTH: 32,     // 最小化タブの幅（px）
  CANVAS_MIN_WIDTH: 320,       // キャンバスの最小幅（px）
  DIVIDER_TOTAL_WIDTH: 12,     // 全ディバイダーの合計幅（3本 × 4px）
} as const;
```

---

### 22. コンポーネントの責務過多

**ファイル**: `src/app/editor/[id]/page.tsx`

**問題**:
470行の巨大なコンポーネントで、レイアウト管理、状態管理、イベント処理が混在しています。

**推奨修正**:
以下のように分割：
- `EditorLayout.tsx`: レイアウト管理
- `EditorToolbar.tsx`: ツールバー
- `useEditorPanels.ts`: パネル幅管理のカスタムフック
- `useEditorKeyboard.ts`: キーボードショートカット

---

### 23. 不要な状態管理

**ファイル**: `src/components/editor/BlockItem.tsx:40-46`

**問題**:
```typescript
const [pendingDelete, setPendingDelete] = useState(false)
const pendingDeleteRef = useRef(false)

useEffect(() => {
  pendingDeleteRef.current = pendingDelete
}, [pendingDelete])
```

状態とrefが重複しています。

**推奨修正**:
```typescript
const pendingDeleteRef = useRef(false);

// UIの更新が必要な場合のみ状態を使用
const [pendingDelete, setPendingDelete] = useState(false);

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Backspace') {
    e.preventDefault();
    if (pendingDeleteRef.current) {
      removeBlock(block.id);
      setPendingDelete(false);
    } else {
      setPendingDelete(true);
      pendingDeleteRef.current = true;
    }
  }
};
```

---

### 24. 型定義の重複

**ファイル**: `src/types/scenario.ts` と `embed/types.ts`

**問題**:
同じ型定義が2箇所に存在し、微妙に異なります（DocumentPreviewBlockの有無など）。

**推奨修正**:
共通の型定義ファイルを作成し、embedとsrcの両方から参照：
```
common/
  types/
    scenario.ts  # 共通型定義
```

---

### 25. アクセシビリティ - ARIA属性の欠如

**ファイル**: 複数のコンポーネント

**問題**:
モーダル、ボタン、フォーム要素に適切なARIA属性がありません。

**推奨修正**:
```typescript
// モーダル
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">タイトル</h2>
  {/* ... */}
</div>

// 削除ボタン
<button
  aria-label={`${block.type}ブロックを削除`}
  onClick={handleDelete}
>
  ×
</button>
```

---

### 26. キーボードナビゲーションの不完全性

**ファイル**: `src/components/editor/BlockPalette.tsx`

**問題**:
ドラッグ可能な要素に`tabIndex={0}`がありますが、Enterキーでのドロップができません。

**推奨修正**:
```typescript
<div
  {...attributes}
  {...listeners}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // ドラッグ開始処理
    }
  }}
>
```

---

### 27. console.log/errorの本番環境への漏洩

**ファイル**: 複数箇所

**問題**:
```typescript
console.error('[TetsuzukiQuest] Failed to load scenario:', err)
```

本番環境でも詳細なエラーログが出力されます。

**推奨修正**:
```typescript
const isDev = process.env.NODE_ENV === 'development';

function logger(level: 'log' | 'error' | 'warn', ...args: any[]) {
  if (isDev) {
    console[level]('[TetsuzukiQuest]', ...args);
  }
}

logger('error', 'Failed to load scenario:', err);
```

---

### 28. Hard-coded文字列のi18n対応なし

**ファイル**: 全体

**問題**:
UIテキストがすべて日本語でハードコードされており、国際化対応がありません。

**推奨修正**:
next-i18nextやreact-i18nextを導入：
```typescript
import { useTranslation } from 'next-i18next';

function Component() {
  const { t } = useTranslation('common');
  return <button>{t('button.delete')}</button>;
}
```

---

### 29. useEffectの依存配列警告の無視

**ファイル**: `src/app/editor/[id]/page.tsx:100`, 他複数箇所

**問題**:
```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
```

警告を無視するのではなく、適切に修正すべきです。

---

### 30. トランジションのブロッキング

**ファイル**: `embed/bubble.ts:96-98`

**問題**:
```typescript
const type = () => {
  if (i < message.length) {
    msgEl.textContent += message[i++]
    setTimeout(type, 16)
  }
}
```

長いメッセージでsetTimeoutが多数キューに入り、パフォーマンスに影響します。

**推奨修正**:
```typescript
const type = () => {
  const charsPerFrame = Math.max(1, Math.floor(message.length / 30)); // 最大30フレーム
  const end = Math.min(i + charsPerFrame, message.length);
  msgEl.textContent += message.slice(i, end);
  i = end;
  if (i < message.length) {
    requestAnimationFrame(type);
  }
};
```

---

### 31. 再帰的なスタイル計算

**ファイル**: `embed/index.ts:9-18`

**問題**:
`getCssSelector`が深い階層で呼ばれるとスタックオーバーフローの可能性があります。

**推奨修正**:
```typescript
function getCssSelector(el: Element): string {
  const path: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  const MAX_DEPTH = 50;
  
  while (current && depth < MAX_DEPTH) {
    if (current.id) {
      path.unshift(`#${CSS.escape(current.id)}`);
      break;
    }
    
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (!parent) {
      path.unshift(tag);
      break;
    }
    
    const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
    if (siblings.length === 1) {
      path.unshift(tag);
    } else {
      const idx = siblings.indexOf(current) + 1;
      path.unshift(`${tag}:nth-of-type(${idx})`);
    }
    
    current = parent;
    depth++;
  }
  
  return path.join(' > ');
}
```

---

### 32. Date処理のタイムゾーン考慮なし

**ファイル**: `src/lib/scenarioStorage.ts:7, 101`

**問題**:
```typescript
createdAt: new Date().toISOString()
```

toISOString()はUTCで返しますが、UIでの表示時にタイムゾーン変換がありません。

**推奨修正**:
date-fnsやday.jsを使用して、ユーザーのタイムゾーンで表示：
```typescript
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const createdAt = format(new Date(scenario.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja });
```

---

### 33. 条件分岐の簡素化

**ファイル**: `src/components/editor/BlockEditor.tsx:310-317`

**問題**:
```typescript
const setTargetType = (t: 'input' | 'button') => {
  if (t === 'button') {
    const { validationPattern: _, errorMessage: __, ...rest } = block
    updateBlock({ ...rest, targetType: 'button' } as InputSpotlightBlock)
  } else {
    updateBlock({ ...block, targetType: 'input' })
  }
}
```

分解代入で不要なプロパティを削除していますが、可読性が低いです。

**推奨修正**:
```typescript
const setTargetType = (t: 'input' | 'button') => {
  if (t === 'button') {
    // ボタンモードではバリデーション設定を削除
    const updatedBlock: InputSpotlightBlock = {
      ...block,
      targetType: 'button',
    };
    delete updatedBlock.validationPattern;
    delete updatedBlock.errorMessage;
    updateBlock(updatedBlock);
  } else {
    updateBlock({ ...block, targetType: 'input' });
  }
}
```

---

### 34. イベントハンドラーの肥大化

**ファイル**: `src/components/editor/EditorDndProvider.tsx:67-135`

**問題**:
`handleDragEnd`が70行近くあり、複雑です。

**推奨修正**:
サブ関数に分割：
```typescript
const handleDragEnd = (e: DragEndEvent) => {
  const { active, over } = e;
  setActivePaletteType(null);
  setOverBlockId(null);
  
  if (!over) return;
  
  if (branchView) {
    handleBranchViewDrop(active, over, branchView);
  } else {
    handleMainCanvasDrop(active, over);
  }
}

const handleBranchViewDrop = (active, over, branchView) => {
  // ブランチビュー内の処理
}

const handleMainCanvasDrop = (active, over) => {
  // メインキャンバスの処理
}
```

---

### 35. プログレスバーの精度

**ファイル**: `embed/engine.ts:46`

**問題**:
```typescript
this.currentStep++
updateProgressBar(this.currentStep, this.totalSteps)
```

start/endブロックをカウントから除外していますが、branchブロックでの分岐を考慮していないため、進捗が正確ではありません。

**推奨修正**:
実際に実行されたブロック数をカウントする、または動的に総ステップ数を計算します。

---

## ⚪ 低 (Low) - 改善の余地あり

### 36. コメントの不足

**ファイル**: 全体

**問題**:
複雑なロジック（特にautoLink、getBranchChain等）にコメントが少なく、理解しづらいです。

**推奨修正**:
JSDocコメントを追加：
```typescript
/**
 * ブロック配列から分岐チェーンを辿り、指定したIDから始まるチェーンを返す。
 * 合流先（branch.nextId）に達した時点で停止する。
 * 
 * @param blocks - 全ブロックの配列
 * @param startId - チェーンの開始ブロックID
 * @returns チェーン内のブロック配列（合流先は含まない）
 */
export function getBranchChain(blocks: Block[], startId: string | null): Block[] {
  // ...
}
```

---

### 37. 不要なエクスポート

**ファイル**: `embed/progressBar.ts`

**問題**:
```typescript
export function completeProgressBar(_total: number): void {
  _current = _total
}
```

引数`_total`が未使用です。

**推奨修正**:
```typescript
export function completeProgressBar(): void {
  _current = _total;
}
```

---

### 38. CSS classの命名規則統一

**ファイル**: 全体

**問題**:
Tailwind CSSとカスタムクラス（`tq-`プレフィックス）が混在しています。

**推奨修正**:
命名規則を統一し、BEMやモジュールCSSを検討してください。

---

### 39. テストの欠如

**ファイル**: プロジェクト全体

**問題**:
単体テスト、統合テスト、E2Eテストがありません。

**推奨修正**:
- Jest + React Testing Libraryで単体テスト
- Playwrightでe2eテスト
- 最低でも以下をカバー：
  - 型バリデーション関数
  - ブロック接続ロジック
  - XSS脆弱性の回帰テスト

---

### 40. デバッグモードの不在

**ファイル**: 全体

**問題**:
開発時のデバッグ情報を表示する機能がありません。

**推奨修正**:
```typescript
if (process.env.NODE_ENV === 'development') {
  // デバッグパネルを表示
  window.__GOVGUIDE_DEBUG__ = {
    scenario: useEditorStore.getState().scenario,
    logs: [],
  };
}
```

---

### 41. パフォーマンス計測の不在

**ファイル**: embed/engine.ts

**問題**:
重い処理（例：長いシナリオの実行）のパフォーマンス計測がありません。

**推奨修正**:
```typescript
performance.mark('scenario-start');
// シナリオ実行
performance.mark('scenario-end');
performance.measure('scenario-duration', 'scenario-start', 'scenario-end');
const measure = performance.getEntriesByName('scenario-duration')[0];
console.log(`Scenario took ${measure.duration}ms`);
```

---

### 42. ビルドサイズの最適化

**ファイル**: package.json, next.config.mjs

**問題**:
バンドルサイズの分析や最適化設定がありません。

**推奨修正**:
```javascript
// next.config.mjs
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
          },
        },
      };
    }
    return config;
  },
};
```

---

### 43. 環境変数の管理

**ファイル**: プロジェクト全体

**問題**:
.env.example等がなく、必要な環境変数が不明確です。

**推奨修正**:
```
# .env.example
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_SCENARIO_URL=/demo-scenarios/moving.json
```

---

### 44. エラーバウンダリの不在

**ファイル**: React components

**問題**:
予期しないエラーをキャッチするError Boundaryがありません。

**推奨修正**:
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>エラーが発生しました。ページをリロードしてください。</div>;
    }
    return this.props.children;
  }
}
```

---

### 45. SEO・メタデータの不足

**ファイル**: `src/app/layout.tsx`

**問題**:
基本的なメタデータのみで、OGPやTwitter Cardがありません。

**推奨修正**:
```typescript
export const metadata: Metadata = {
  title: 'GovGuide - 行政手続きチュートリアルエディタ',
  description: '行政手続きの操作ガイドを簡単に作成できるビジュアルエディタ',
  openGraph: {
    title: 'GovGuide',
    description: '行政手続きチュートリアルシナリオエディタ',
    images: ['/og-image.png'],
  },
};
```

---

## 📝 総合推奨事項

### 即座に対応すべき項目（優先度：最高）
1. **XSS脆弱性の修正**（問題1, 2）
2. **postMessage検証の追加**（問題3）
3. **LocalStorageデータ検証**（問題4）
4. **正規表現インジェクション対策**（問題5）

### 早急に対応すべき項目（優先度：高）
5. 型安全性の強化（zodなどのバリデーションライブラリ導入）
6. エラーハンドリングの統一
7. メモリリーク対策
8. ファイルアップロードのバリデーション

### 中長期的な改善項目（優先度：中）
9. テストの導入（カバレッジ目標：80%以上）
10. アクセシビリティ対応（WCAG 2.1 AA準拠）
11. パフォーマンス最適化
12. コンポーネント設計の見直し

### 将来的な検討項目（優先度：低）
13. 国際化対応
14. PWA化
15. サーバーサイドストレージの検討

---

## 🎯 次のステップ

1. **セキュリティパッチのリリース**: 問題1-5を修正したバージョンを即座にリリース
2. **技術的負債の返済計画**: 四半期ごとに改善項目を5-10件ずつ対応
3. **開発プロセスの改善**:
   - Pre-commit hookでESLintとPrettierを強制
   - Pull Requestテンプレートにセキュリティチェックリストを追加
   - 定期的なコードレビュー会の実施

---

**レビュアー**: GitHub Copilot  
**レビュー完了日**: 2024年12月

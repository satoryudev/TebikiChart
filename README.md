# TebikiChart

> 複雑な手続きや操作を、インタラクティブなチュートリアルとして**ノーコードで作成・埋め込み**できるツール

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://tebikichart.vercel.app/)

🔗 **https://tebikichart.vercel.app/**

---

## たった3ステップで使える

**1. シナリオを作る** — ブロックをフローチャートのように繋ぐだけ

**2. ターゲットを指定する** — プレビューの実画面でボタン・フォームをクリックするだけ（🎯ピック機能）

**3. HTMLに組み込む** — 「HTMLエクスポート」ボタンで embed.js 注入済みの HTML を生成。既存サイトに埋め込む場合も `</body>` 直前に1行追加するだけ

ノーコード・コーディング不要で、既存サイトを**一切改修せずに**チュートリアルを追加できます。

---

## 概要

TebikiChart は、マイナンバー申請・確定申告などの複雑な手続きを
ゲームのチュートリアル風にユーザーへ案内するシステムです。

**2つのコンポーネントで構成されています。**

| コンポーネント | 説明 |
|---|---|
| **エディタ（Webアプリ）** | ブロックをドラッグ＆ドロップで並べてシナリオを作成・プレビューできる管理画面 |
| **プレイヤー（embed.js）** | 既存の Web サイトの `</body>` 直前に 1 行追加するだけでチュートリアルのオーバーレイが動く |

---

## スクリーンショット

### エディタ（4パネルレイアウト）

```
┌──────────────┬──────────────┬──────────────┬───────────────┐
│ ブロックパレット│ キャンバス    │ プレビュー    │ ブロック設定   │
│              │              │  ┌────────┐  │               │
│ 💬 セリフ     │ ● Start      │  │iframe  │  │ メッセージ     │
│ 🔦 スポット   │ │            │  │        │  │               │
│ ✏️ 入力       │ ● セリフ      │  │        │  │ ターゲットID   │
│ 🔀 分岐       │ │            │  │▶実行  │  │               │
│ 🏁 終了       │ ● 終了        │  └────────┘  │ 🎯 ピック      │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

### プレイヤー（ユーザー画面）

```
┌─────────────────────────────────────────────────────┐
│  Step 2 / 6  ██████░░░░░░░░░░░░░░░░  （進行バー）    │
├─────────────────────────────────────────────────────┤
│  マイナンバーカード申請フォーム                          │
│                                    ████████████     │
│  郵便番号  [███████████]  ← パルスリングで強調          │
│                                                     │
│  🔲████████████████████████████████████████████     │
│  😊  次に、郵便番号を入力してください。                  │
│      [次へ →]                                        │
└─────────────────────────────────────────────────────┘
```

---

## 機能一覧

### ブロックの種類（6種類）

| ブロック | 説明 |
|---|---|
| **開始** | シナリオの起点。メッセージを設定するとオーバーレイ付き吹き出しを最初に表示 |
| **終了** | シナリオの終点。完了メッセージを表示して終わる |
| **💬 セリフ** | キャラクターがメッセージを話す（タイプライター表示）。感情3種（normal/happy/thinking） |
| **🔦 スポットライト** | CSS セレクタで対象要素を強調、クリックで次ブロックへ進む |
| **✏️ 入力スポットライト** | 入力フォーム／ボタン／エリアを強調して操作を案内（後述） |
| **🔀 分岐** | 最大5択の選択肢でシナリオを分岐。12色のボタンカラー |

### 入力スポットライトの3モード

| モード | 動作 |
|---|---|
| **✏️ 入力フォーム** | 入力欄をハイライト → 入力値を正規表現でバリデーション → 通過後に次へ |
| **🔦 ボタン** | ボタンをパルスリングで強調 → クリックで次へ（disabled ボタンにも対応） |
| **📌 エリア** | 任意の領域を強調 → 「次へ」ボタンで進む |

### バリデーションプリセット（入力フォームモード）

氏名・ふりがな・メールアドレス・電話番号（ハイフンあり/なし）・郵便番号（ハイフンあり/なし）・パスワード（英数字 / 英数字+記号）・任意桁数の数字・カスタム正規表現

### 書類プレビュー機能

プリセット（マイナンバーカード・領収書・住民票）またはカスタム画像をモーダルで表示。入力スポットライトと組み合わせて「見本を確認」ボタンを添えられる。

### エディタのその他の機能

| 機能 | 説明 |
|---|---|
| **🎯 ピック** | プレビュー上で対象要素をクリックすると ID が自動入力される |
| **Undo / Redo** | Cmd+Z / Cmd+Shift+Z（最大 50 ステップ） |
| **JSON エクスポート** | シナリオを JSON ファイルとしてダウンロード |
| **JSON インポート** | 保存済み JSON を読み込む |
| **HTML エクスポート** | embed.js を注入済みのスタンドアロン HTML を生成 |
| **📁 ローカルファイルを開く** | 手元の HTML に embed.js を自動注入してプレビュー |
| **バリデーションチェック** | 未設定フィールドや無効なセレクタをバッジで警告 |
| **ダークモード** | localStorage で設定を永続化 |
| **分岐ビュー** | 分岐ブロックをクリックするとサブチェーンが別キャンバスで開く |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                       TebikiChart エディタ                        │
│  ┌──────────────┬──────────────┬──────────────┬───────────────┐ │
│  │ BlockPalette │   Canvas     │ PreviewPane  │ BlockEditor   │ │
│  └──────────────┴──────────────┴──────────────┴───────────────┘ │
│                    ↕ Zustand Store (editorStore)                 │
└───────────────────────────────────────┬─────────────────────────┘
                                        │ postMessage
                                        ↓
                        ┌───────────────────────────────┐
                        │  iframe (blob URL + embed.js) │
                        │  ┌───────────────────────┐    │
                        │  │    ScenarioEngine      │    │
                        │  │  bubble / overlay      │    │
                        │  │  inputSpotlight        │    │
                        │  │  documentPreview       │    │
                        │  │  progressBar           │    │
                        │  └───────────────────────┘    │
                        └───────────────────────────────┘
```

### postMessage 通信

| メッセージ | 方向 | 説明 |
|---|---|---|
| `TEBIKI_CHART_START` | editor → iframe | シナリオ JSON を渡して開始 |
| `TEBIKI_CHART_STOP` | editor → iframe | チュートリアル停止 |
| `TEBIKI_CHART_PICK_START` | editor → iframe | ピックモード開始 |
| `TEBIKI_CHART_ELEMENT_PICKED` | iframe → editor | 選択した要素の ID / セレクタを返す |
| `TEBIKI_CHART_BLOCK_ACTIVE` | iframe → editor | 現在実行中のブロック ID を通知 |
| `TEBIKI_CHART_FINISHED` | iframe → editor | シナリオ完了を通知 |

---

## 技術スタック

```
フロントエンド    Next.js 14 (App Router) + TypeScript + Tailwind CSS
ドラッグ&ドロップ @dnd-kit/core + @dnd-kit/sortable
状態管理        Zustand（Undo/Redo 付き）
データ保存       localStorage（シナリオ・設定）
埋め込みビルド   tsup（embed/ → public/embed.js / IIFE 形式）
デプロイ        Vercel
```

---

## セットアップ

### 必要なもの
- Node.js 18 以上

### インストール・起動

```bash
git clone https://github.com/satoryudev/TebikiChart.git
cd TebikiChart
npm install

# embed.js をビルド（初回 or embed/ を編集したとき）
npm run embed:build

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開くとエディタのトップ画面が表示されます。

---

## スクリプト一覧

```bash
npm run dev           # 開発サーバー起動
npm run build         # Next.js プロダクションビルド
npm run start         # プロダクションサーバー起動
npm run embed:build   # embed.js をビルド（embed/ を変更した際に必須）
```

---

## 使い方

### エディタでシナリオを作る

1. http://localhost:3000 を開く
2. 「新規作成」でシナリオを追加
3. 左パレットのブロックをクリックしてキャンバスに追加
4. ドラッグして順序を変更
5. ブロックの **⋮** アイコンからブロック設定を開いて内容を編集
6. プレビューパネルの「**📁 開く**」でローカル HTML ファイルを読み込む
7. 「**▶ 実行**」ボタンでチュートリアルの動作確認

### 任意の Web サイトに埋め込む

**HTML エクスポート**（エディタの「HTML エクスポート」ボタン）で embed.js 注入済みの HTML を生成するのが最も簡単です。

手動で埋め込む場合は `</body>` 直前に以下を追加してください。

```html
<script>document.write('<scr'+'ipt src="/embed.js?v='+Date.now()+'"><\/scr'+'ipt>')</script>
<script>
  // JSONファイルを指定して起動
  window.TebikiChart.start('/scenario.json')

  // または JSON オブジェクトを直接渡す
  window.TebikiChart.startWithScenario(scenarioObject)

  // 「チュートリアルを開始しますか？」確認ダイアログ付きで起動
  window.TebikiChart.startWithPrompt(scenarioObject)
</script>
```

---

## ディレクトリ構成

```
TebikiChart/
├── embed/                         # プレイヤー本体（tsup で public/embed.js にビルド）
│   ├── index.ts                   # グローバル API（start / stop / startWithPrompt）
│   ├── engine.ts                  # シナリオ再生エンジン
│   ├── bubble.ts                  # キャラクター吹き出し（タイプライター・感情・プログレスバー）
│   ├── overlay.ts                 # 画面暗転 & スポットライト（4分割方式 + SVG マスク）
│   ├── inputSpotlight.ts          # 入力フォーム/ボタン/エリア特化スポットライト
│   ├── documentPreview.ts         # 書類プレビューモーダル
│   ├── progressBar.ts             # 進行状況プログレスバー
│   └── types.ts                   # embed 用型定義
│
├── src/
│   ├── app/
│   │   ├── layout.tsx             # ルートレイアウト（ダークモード・メタデータ）
│   │   ├── globals.css            # グローバルスタイル（アニメーション定義）
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # サイドバー付きレイアウト
│   │   │   └── page.tsx           # シナリオ一覧（ダッシュボード）
│   │   ├── editor/[id]/
│   │   │   └── page.tsx           # エディタ本体（4パネル）
│   │   └── sp/
│   │       └── page.tsx           # モバイル向け活用例リスト
│   │
│   ├── components/
│   │   ├── editor/
│   │   │   ├── BlockEditor.tsx    # ブロック設定パネル（右）
│   │   │   ├── BlockItem.tsx      # キャンバス上の1ブロック
│   │   │   ├── BlockPalette.tsx   # ブロックパレット（左）
│   │   │   ├── BranchCanvas.tsx   # 分岐サブチェーン表示
│   │   │   ├── BranchSplit.tsx    # 分岐分割 UI
│   │   │   ├── BranchViewContext.tsx # 分岐ビュー状態管理
│   │   │   ├── Canvas.tsx         # メインキャンバス（DnD）
│   │   │   ├── EditorDndProvider.tsx # @dnd-kit プロバイダー
│   │   │   ├── PreviewPane.tsx    # プレビュー iframe
│   │   │   ├── PreviewToolbar.tsx # JSON/HTML エクスポート・再生
│   │   │   ├── ResizeDivider.tsx  # パネル間リサイザー
│   │   │   ├── ValidationBadge.tsx
│   │   │   └── ValidationDialog.tsx
│   │   ├── layout/
│   │   │   └── DashboardSidebar.tsx
│   │   ├── onboarding/
│   │   │   ├── EditorTour.tsx     # 初回ユーザー向けオンボーディング
│   │   │   ├── EditorStepper.tsx
│   │   │   ├── EmptyStatePrompt.tsx
│   │   │   ├── ScenarioWizard.tsx
│   │   │   └── WelcomeModal.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── hooks/
│   │   ├── useOnboarding.ts
│   │   └── useTheme.ts
│   │
│   ├── lib/
│   │   ├── blockFactory.ts        # ブロック生成ファクトリ
│   │   ├── branchChain.ts         # 分岐チェーン操作・自動リンク
│   │   ├── customDocTypes.ts      # カスタム書類タイプ管理
│   │   ├── previewStorage.ts      # プレビュー HTML / blob URL 管理
│   │   ├── scenarioStorage.ts     # localStorage シナリオ永続化
│   │   ├── scenarioUtils.ts       # シナリオステータス判定
│   │   └── scenarioValidation.ts  # シナリオバリデーション
│   │
│   ├── store/
│   │   └── editorStore.ts         # Zustand（ブロック操作・Undo/Redo・ピック機能）
│   │
│   ├── types/
│   │   └── scenario.ts            # 型定義（Block, Scenario, BranchOption 等）
│   │
│   └── middleware.ts              # モバイル UA → /sp リダイレクト
│
├── public/
│   ├── embed.js                   # ビルド済みプレイヤー（IIFE 形式）
│   ├── demo.html                  # プレイヤー動作確認用デモページ
│   ├── demo-scenario.json         # デモシナリオ JSON
│   ├── shopping.html              # 活用例：EC サイト
│   ├── mynumber-tutorial.html     # 活用例：マイナンバーカード申請
│   ├── kakuteishinkoku-tutorial.html # 活用例：確定申告
│   └── hck_icon.png
│
├── tsup.config.ts                 # embed.js ビルド設定（IIFE / minify）
├── next.config.mjs
├── tailwind.config.ts
└── CLAUDE.md                      # Claude Code 向けガイドライン
```

---

## モバイル対応

スマートフォンからアクセスすると `/sp` へ自動リダイレクトされます。

- **判定**: User-Agent（Android / iPhone / iPad 等）
- **リダイレクト除外**: `.html` / `.js` / `.json` ファイルは除外（チュートリアル直接閲覧可）
- **`/sp` ページ**: 活用例チュートリアルへのリンク一覧を表示

PC 版ではシナリオの作成・編集ができます。

---

## スポットライトの技術詳細

ボタンスポットライトでは、CSS の `z-index` / スタッキングコンテキスト問題を回避するため
**1 枚の SVG マスクオーバーレイではなく、ボタン周囲を 4 枚の div で囲む方式**を採用しています。
ボタン領域の上に何も置かないため、`position: sticky` や `z-index` の親要素に関係なく
確実にクリックイベントが届きます。

```
┌─────────────────────────────────────────────────┐
│  [tq-block-top     (pointer-events:all)]        │
├────────────┬──────────────────┬─────────────────┤
│ tq-block-  │   ボタン領域     │   tq-block-     │
│ left       │  （何もなし）    │   right         │
├────────────┴──────────────────┴─────────────────┤
│  [tq-block-bottom  (pointer-events:all)]        │
└─────────────────────────────────────────────────┘
```

---

## ライセンス

MIT

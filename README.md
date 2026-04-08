# 🗺️ TetsuzukiQuest (URL:https://govguide-seven.vercel.app/)

> 行政手続きを、ゲームのチュートリアル風に案内するシステム

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)](https://tailwindcss.com/)

---

## 概要

TetsuzukiQuest は、引越し・マイナンバー・確定申告・育児出産などの行政手続きを、RPGのチュートリアル風に市民へ案内するシステムです。

**2つのコンポーネントで構成されています。**

| コンポーネント | 説明 |
|---|---|
| **エディタ（Webアプリ）** | 行政担当者がブロックをドラッグ＆ドロップで並べてシナリオを作成し、JSONとして書き出す |
| **プレイヤー（埋め込みスクリプト）** | 既存の行政WebサイトにJSを1行追加するだけでチュートリアルのオーバーレイが起動する |

---

## スクリーンショット

### エディタ画面
4カラムのレイアウトで、左からブロックパレット・キャンバス・プレビュー・ブロック設定が並びます。

```
[ ブロックパレット ] [ キャンバス ] [ プレビュー ] [ ブロック設定 ]
      240px           flex 1:1       flex 1:1        280px
```

### プレイヤー動作イメージ
```
┌──────────────────────────────────────────────┐
│  Step 2 / 8  ████████░░░░░░░░░░░░░░░  (進行バー) │
├──────────────────────────────────────────────┤
│  転居届 オンライン申請                            │
│                                              │
│  郵便番号 [████████████]  ← スポットライト       │
│                          ↑ 入力を促す          │
│                                              │
│ 😊 まず、新しい郵便番号を入力してください。        │
│    [次へ →]                                  │
└──────────────────────────────────────────────┘
```

---

## 機能一覧

### ブロックの種類（6種類）

| ブロック | 色 | 機能 |
|---|---|---|
| 💬 吹き出し | blue | キャラクターがセリフを話す（タイプライター表示） |
| 🔦 スポットライト | amber | 特定のボタンを強調してクリックを促す |
| ✏️ 入力スポットライト | indigo | 入力フォームを暗転の中でハイライトする（機能1） |
| 📄 書類プレビュー | teal | マイナンバーカード等の見本をモーダルで表示（機能2） |
| ✅ バリデーション | rose | 正規表現で入力値を検証し、エラーを吹き出しで表示（機能3） |
| 🔀 条件分岐 | red | はい/いいえでシナリオを分岐 |

### エディタ機能
- ドラッグ＆ドロップによるブロック並び替え（@dnd-kit）
- ブロックごとの詳細設定フォーム
- シナリオのJSON書き出し（ダウンロード）
- インライン▶実行 / ■停止でiframe内プレビュー

### プレイヤー機能
- 任意の行政WebサイトにJSを1行追加するだけで動作
- **機能4：進行状況プログレスバー**（ページ最上部、Step X/Y 表示）
- 画面暗転 + SVGマスクによるスポットライト
- 書類の内蔵プレビュー（マイナンバーカード/領収書/住民票）
- ダイナミックバリデーション（入力値リアルタイム検証）

---

## 技術スタック

```
フロントエンド    Next.js 14 (App Router) + TypeScript + Tailwind CSS
ドラッグ&ドロップ @dnd-kit/core + @dnd-kit/sortable
状態管理        Zustand
データ保存       LocalStorage（プロトタイプ）
埋め込みビルド   tsup（embed.ts → embed.js / IIFE形式）
```

---

## セットアップ

### 前提条件
- Node.js 18以上
- npm

### インストール

```bash
git clone <このリポジトリのURL>
cd GovGuide
npm install
```

### 開発サーバー起動

```bash
# embed.js をビルド（初回 or embed/ を編集した後に実行）
npm run embed:build

# Next.js 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開くとエディタのトップ画面が表示されます。

---

## 使い方

### エディタでシナリオを作る

1. http://localhost:3000 を開く
2. 初回起動時は「引越し・転居届の手続き」デモシナリオが自動で追加されます
3. シナリオカードをクリックするとエディタ画面（`/editor/[id]`）が開きます
4. 左パレットのブロックをクリックしてキャンバスに追加
5. ブロックをドラッグして順序を変更
6. ブロックをクリックして右サイドバーで内容を編集
7. 「▶ 実行」ボタンで右のiframe内でチュートリアルを確認

### JSONをエクスポートして既存サイトに組み込む

1. 「JSON 書き出し」ボタンでシナリオJSONをダウンロード
2. 既存の行政WebサイトのHTMLに以下を追加：

```html
<script src="https://your-cdn.com/embed.js"></script>
<script>
  TetsuzukiQuest.start('./scenario.json')
</script>
```

---

## ディレクトリ構成

```
GovGuide/
├── embed/                    # プレイヤー本体（tsupでembed.jsにビルド）
│   ├── index.ts              # TetsuzukiQuest グローバルAPI
│   ├── engine.ts             # シナリオ再生エンジン
│   ├── bubble.ts             # キャラクター吹き出し
│   ├── overlay.ts            # 暗転 + SVGスポットライト
│   ├── inputSpotlight.ts     # 入力フォーム特化スポットライト（機能1）
│   ├── documentPreview.ts    # 書類プレビューモーダル（機能2）
│   ├── validation.ts         # ダイナミックバリデーション（機能3）
│   ├── progressBar.ts        # 進行状況プログレスバー（機能4）
│   └── types.ts              # 型定義
│
├── src/
│   ├── app/
│   │   ├── page.tsx          # シナリオ一覧
│   │   └── editor/[id]/
│   │       └── page.tsx      # エディタ画面（4カラム）
│   ├── components/editor/
│   │   ├── BlockPalette.tsx  # 左パレット
│   │   ├── Canvas.tsx        # ドラッグ&ドロップキャンバス
│   │   ├── BlockItem.tsx     # キャンバス上の1ブロック
│   │   ├── BlockEditor.tsx   # 右サイドバー設定フォーム
│   │   ├── PreviewPane.tsx   # プレビューiframe
│   │   └── PreviewToolbar.tsx # 実行/停止ボタン
│   ├── types/scenario.ts     # 型定義
│   ├── store/editorStore.ts  # Zustandストア
│   └── lib/scenarioStorage.ts # LocalStorage操作
│
├── public/
│   ├── embed.js              # ビルド済みプレイヤー（20KB）
│   ├── demo.html             # デモ用テストページ
│   └── demo-scenario.json   # デモシナリオ
│
├── tsup.config.ts            # embed.jsビルド設定
└── README.md
```

---

## スクリプト一覧

```bash
npm run dev           # Next.js 開発サーバー起動
npm run build         # Next.js プロダクションビルド
npm run start         # プロダクションサーバー起動
npm run embed:build   # embed.js をtsupでビルド
```

---

## デモシナリオ

初回起動時に以下のシナリオが自動投入されます。

**引越し・転居届の手続き（8ステップ）**

```
1. 吹き出し     → 引越しのあいさつ
2. 条件分岐     → 同じ市区町村か？（はい/いいえ）
3a. 吹き出し    → 転居届1枚で完了
3b. 吹き出し    → 転出届＋転入届の2回手続き
4. 入力スポット → 郵便番号を入力（機能1）
5. バリデーション → 7桁の数字チェック（機能3）
6. 書類プレビュー → マイナンバーカードの見本確認（機能2）
7. スポットライト → 申請ボタンをクリック
8. 吹き出し     → 手続き完了！
```

---

## ライセンス

MIT

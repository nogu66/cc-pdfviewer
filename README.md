# Claude Cowork for PDF

大規模言語モデル Claude を活用した PDF 対話デスクトップアプリケーション。

## 機能

- PDFファイルのドラッグ＆ドロップ / ファイルダイアログで開く
- PDF.jsによるインタラクティブなビューア（ページ送り、ズーム、サムネイル）
- RAGパイプライン（テキスト抽出 → スマートチャンキング → BM25検索）
- Claude APIによるストリーミング応答
- セキュアなElectron設計（contextIsolation、APIキーはメインプロセスのみ）

## セットアップ

### 必要環境
- Node.js 18+
- Bun 1.0+

### インストール
```bash
bun install
```

### 開発モードで起動
```bash
bun run dev
```

### APIキーの設定

アプリ起動後、DevToolsのコンソール（Cmd+Opt+I）で以下を実行:

```javascript
window.electronAPI.store.set('anthropicApiKey', 'sk-ant-your-key-here')
```

設定後はアプリを再起動してください。

## ビルド

```bash
# プロダクションビルド
bun run build

# パッケージング（.dmg / .exe / .AppImage）
bun run dist
```

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Desktop | Electron 33 |
| Frontend | React 18 + TypeScript |
| UI | Tailwind CSS v4 |
| Build | electron-vite (esbuild + Vite) |
| PDF表示 | pdfjs-dist 4 |
| PDF抽出 | pdf-parse |
| 検索 | BM25（日本語2-gram対応） |
| AI | @anthropic-ai/sdk (claude-opus-4-5) |
| 設定 | electron-store |

## プロジェクト構造

```
src/
├── main/           # Electronメインプロセス
│   ├── index.ts    # エントリーポイント
│   ├── ipc/        # IPC通信ハンドラ
│   ├── pdf/        # PDF処理（抽出・チャンキング・BM25検索）
│   └── claude/     # Claude API統合
├── renderer/       # Reactフロントエンド
│   ├── App.tsx
│   ├── components/ # PDFViewer, ThumbnailPanel, ChatPanel
│   ├── hooks/      # usePDF, useChat
│   └── styles/
└── preload/        # contextBridge定義
```
# pdf-viewer-agent

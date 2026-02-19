# CC PDF Viewer

[English](README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/nogu66/cc-pdf-viewer)](https://github.com/nogu66/cc-pdf-viewer/releases)
[![Build](https://github.com/nogu66/cc-pdf-viewer/actions/workflows/build.yml/badge.svg)](https://github.com/nogu66/cc-pdf-viewer/actions/workflows/build.yml)

大規模言語モデル Claude を活用した PDF 対話デスクトップアプリケーション。

## 機能

- PDF ファイルのドラッグ＆ドロップ / ファイルダイアログで開く
- PDF.js によるインタラクティブなビューア（ページ送り、ズーム、サムネイル）
- RAG パイプライン（テキスト抽出 → スマートチャンキング → BM25 検索）
- Claude API によるストリーミング応答
- セキュアな Electron 設計（contextIsolation、API キーはメインプロセスのみ）

## ダウンロード

[GitHub Releases](https://github.com/nogu66/cc-pdf-viewer/releases) から最新版をダウンロードしてください。

| プラットフォーム | ファイル |
|---|---|
| macOS | `CC-PDF-Viewer-x.x.x.dmg` |
| Windows | `CC-PDF-Viewer-Setup-x.x.x.exe` |
| Linux | `CC-PDF-Viewer-x.x.x.AppImage` |

> **注意:** コード署名なしのため、macOS では Gatekeeper の警告が表示される場合があります。
> 回避方法: `System Settings > Privacy & Security` で「このまま開く」を選択してください。

## セットアップ

### 必要環境

- Node.js 18+
- Bun 1.0+
- Anthropic API キー（[取得方法](https://console.anthropic.com/)）

### インストール

```bash
git clone https://github.com/nogu66/cc-pdf-viewer.git
cd cc-pdf-viewer
bun install
```

### API キーの設定

アプリ起動後、設定ダイアログ（右上の歯車アイコン）から API キーを入力できます。

または DevTools コンソール（`Cmd+Opt+I`）で以下を実行:

```javascript
window.electronAPI.store.set('anthropicApiKey', 'sk-ant-your-key-here')
```

設定後はアプリを再起動してください。

### 開発モードで起動

```bash
bun run dev
```

## ビルド

```bash
# 型チェック
bun run typecheck

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
| PDF 表示 | pdfjs-dist 4 |
| PDF 抽出 | pdf-parse |
| 検索 | BM25（日本語 2-gram 対応） |
| AI | @anthropic-ai/sdk (claude-opus-4-5) |
| 設定 | electron-store |

## プロジェクト構造

```
src/
├── main/           # Electron メインプロセス
│   ├── index.ts    # エントリーポイント
│   ├── ipc/        # IPC 通信ハンドラ
│   ├── pdf/        # PDF 処理（抽出・チャンキング・BM25 検索）
│   └── claude/     # Claude API 統合
├── renderer/       # React フロントエンド
│   ├── App.tsx
│   ├── components/ # PDFViewer, ThumbnailPanel, ChatPanel
│   ├── hooks/      # usePDF, useChat
│   └── styles/
└── preload/        # contextBridge 定義
```

## コントリビュート

[CONTRIBUTING.md](CONTRIBUTING.md) をご参照ください。

## ライセンス

[MIT](LICENSE)

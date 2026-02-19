# CC PDF Viewer

[日本語](README.ja.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/nogu66/cc-pdf-viewer)](https://github.com/nogu66/cc-pdf-viewer/releases)
[![Build](https://github.com/nogu66/cc-pdf-viewer/actions/workflows/build.yml/badge.svg)](https://github.com/nogu66/cc-pdf-viewer/actions/workflows/build.yml)

A desktop PDF viewer with Claude AI chat — open a PDF, ask questions, get answers powered by RAG.

## Features

- Open PDFs via drag & drop or file dialog
- Interactive viewer (page navigation, zoom, thumbnail panel) powered by PDF.js
- RAG pipeline: text extraction → smart chunking → BM25 search
- Streaming responses from Claude API
- Secure Electron architecture (contextIsolation, API key in main process only)

## Download

Download the latest release from [GitHub Releases](https://github.com/nogu66/cc-pdf-viewer/releases).

| Platform | File |
|---|---|
| macOS | `CC-PDF-Viewer-x.x.x.dmg` |
| Windows | `CC-PDF-Viewer-Setup-x.x.x.exe` |
| Linux | `CC-PDF-Viewer-x.x.x.AppImage` |

> **Note:** The app is not code-signed. On macOS you may see a Gatekeeper warning.
> To bypass: open `System Settings > Privacy & Security` and click "Open Anyway".

## Getting Started

### Prerequisites

- An [Anthropic API key](https://console.anthropic.com/)

### Set your API key

After launching the app, open the Settings dialog (gear icon in the top-right) and enter your API key.

Alternatively, open DevTools (`Cmd+Opt+I` on macOS) and run:

```javascript
window.electronAPI.store.set('anthropicApiKey', 'sk-ant-your-key-here')
```

Restart the app after saving.

## Development

### Requirements

- Node.js 18+
- [Bun](https://bun.sh/) 1.0+

### Setup

```bash
git clone https://github.com/nogu66/cc-pdf-viewer.git
cd cc-pdf-viewer
bun install
bun run dev
```

### Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start in development mode |
| `bun run build` | Production build |
| `bun run typecheck` | TypeScript type check |
| `bun run dist` | Package app (dmg / exe / AppImage) |
| `bun run preview` | Preview production build |

## Building from Source

```bash
bun install
bun run build
bun run dist
# Output: release/
```

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop | Electron 33 |
| Frontend | React 18 + TypeScript |
| UI | Tailwind CSS v4 |
| Build | electron-vite (esbuild + Vite) |
| PDF Rendering | pdfjs-dist 4 |
| PDF Extraction | pdf-parse |
| Search | BM25 (with Japanese 2-gram support) |
| AI | @anthropic-ai/sdk (claude-opus-4-5) |
| Storage | electron-store |

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # Entry point
│   ├── ipc/        # IPC handlers
│   ├── pdf/        # PDF processing (extraction, chunking, BM25)
│   └── claude/     # Claude API integration
├── renderer/       # React frontend
│   ├── App.tsx
│   ├── components/ # PDFViewer, ThumbnailPanel, ChatPanel
│   ├── hooks/      # usePDF, useChat
│   └── styles/
└── preload/        # contextBridge definitions
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2026-02-20

### Fixed

- macOS の Finder/Dock から起動したとき "spawn node ENOENT" エラーが発生する問題を修正
  - nvm や Homebrew でインストールした Node.js が GUI アプリから見つからない問題
  - 起動時にログインシェルを経由してユーザーの PATH を読み込むことで解消

## [0.1.0] - 2026-02-19

### Added

- PDF viewer with drag & drop and file dialog support
- Interactive PDF navigation (page controls, zoom, thumbnail panel) via PDF.js
- RAG pipeline: text extraction, smart chunking, BM25 search (with Japanese 2-gram support)
- Claude AI chat panel with streaming responses
- Secure Electron architecture with contextIsolation
- Settings dialog for API key configuration
- Support for macOS (dmg), Windows (nsis), and Linux (AppImage) builds

[Unreleased]: https://github.com/nogu66/cc-pdf-viewer/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/nogu66/cc-pdf-viewer/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/nogu66/cc-pdf-viewer/releases/tag/v0.1.0

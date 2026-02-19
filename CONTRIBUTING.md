# Contributing to CC PDF Viewer

Thank you for your interest in contributing!

---

## Bug Reports

Please open an issue at [GitHub Issues](https://github.com/nogu66/cc-pdf-viewer/issues) with:

- OS and version
- App version
- Steps to reproduce
- Expected vs. actual behavior
- Relevant logs (DevTools console, `Cmd+Opt+I`)

## Feature Requests

Open an issue and describe:

- The problem you want to solve
- Your proposed solution (optional)

## Pull Requests

1. Fork the repository and create a branch from `main`.
2. Run `bun install` to set up dependencies.
3. Make your changes, keeping commits focused and atomic.
4. Run `bun run typecheck` and `bun run build` to verify.
5. Open a PR against `main` with a clear description.

## Code Style

- TypeScript strict mode is enabled — avoid `any`.
- Follow existing patterns in the codebase (React hooks, IPC structure).
- No new external runtime dependencies without discussion.

---

## コントリビュートについて（日本語）

バグ報告・機能提案は [GitHub Issues](https://github.com/nogu66/cc-pdf-viewer/issues) へお気軽にどうぞ。

### バグ報告

以下の情報を含めてください:

- OS とバージョン
- アプリのバージョン
- 再現手順
- 期待する動作と実際の動作
- 関連するログ（DevTools コンソール、`Cmd+Opt+I`）

### 機能提案

解決したい課題と、もし案があれば提案する解決策を記載してください。

### プルリクエストの流れ

1. リポジトリをフォークし、`main` から作業ブランチを作成する。
2. `bun install` で依存関係をセットアップする。
3. 変更を加え、コミットは小さく・目的を絞る。
4. `bun run typecheck` と `bun run build` で確認する。
5. `main` に向けて PR を作成し、変更内容を説明する。

### コードスタイル

- TypeScript の strict モードが有効です — `any` は避けてください。
- 既存のコードパターン（React hooks、IPC 構造）に従ってください。
- 新しい外部依存を追加する場合は事前に相談してください。

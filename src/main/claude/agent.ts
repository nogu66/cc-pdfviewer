import { query } from '@anthropic-ai/claude-agent-sdk'
import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { TextChunk } from '../pdf/chunker'

/**
 * process.env.PATH (またはカスタム envPath) から node バイナリの絶対パスを解決する。
 * GUI 起動時に PATH が最小限しかない環境でも "spawn node ENOENT" を防ぐ。
 */
function resolveNodePath(envPath: string | undefined): string {
  const pathDirs = (envPath || process.env.PATH || '').split(':')
  for (const dir of pathDirs) {
    if (!dir) continue
    const nodeBin = join(dir, 'node')
    if (existsSync(nodeBin)) {
      return nodeBin
    }
  }
  return 'node' // 見つからなければ OS の PATH 検索に委ねる
}

export class ClaudeAgent {
  private apiKey: string
  private readonly model = 'claude-opus-4-5'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async streamResponse(
    userMessage: string,
    relevantChunks: TextChunk[],
    onChunk: (text: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const context = this.buildContext(relevantChunks)

    const systemPrompt = `あなたはPDFドキュメントの内容についてユーザーを支援するAIアシスタントです。
以下のPDF抽出テキスト（コンテキスト）を参考にして、ユーザーの質問に正確かつ詳細に答えてください。

## コンテキスト（PDFから抽出した関連テキスト）
${context}

## 回答のガイドライン
- コンテキストに含まれる情報を優先して回答してください
- コンテキストに記載がない場合は、その旨を明示してください
- 日本語で質問された場合は日本語で、英語の場合は英語で回答してください
- 回答の根拠となるページ番号を必ず「[[p.X]]」形式で文中にインラインで示してください（例: この概念は〜です[[p.3]]）。複数ページにまたがる場合は[[p.2]][[p.5]]のように並べてください
- マークダウン形式で構造化した回答を心がけてください`

    const abortController = new AbortController()
    signal?.addEventListener('abort', () => {
      abortController.abort()
    })

    const env = { ...process.env, ANTHROPIC_API_KEY: this.apiKey }

    const conversation = query({
      prompt: userMessage,
      options: {
        systemPrompt,
        model: this.model,
        maxTurns: 1,
        allowedTools: [],
        includePartialMessages: true,
        abortController,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        env,
        // "node" を絶対パスに解決してから spawn する。
        // GUI起動時は PATH が最小限しかなく "spawn node ENOENT" が発生するため、
        // loadShellEnv() の補完に加えてここでも対策する。
        spawnClaudeCodeProcess: (opts) => {
          const nodePath = resolveNodePath(opts.env.PATH)
          const proc = spawn(nodePath, opts.args, {
            cwd: opts.cwd,
            env: opts.env,
            stdio: ['pipe', 'pipe', 'ignore'],
            windowsHide: true,
          })
          // AbortSignal が来たらプロセスを終了する
          opts.signal?.addEventListener('abort', () => {
            if (!proc.killed) proc.kill('SIGTERM')
          })
          return {
            stdin: proc.stdin!,
            stdout: proc.stdout!,
            get killed() { return proc.killed },
            get exitCode() { return proc.exitCode },
            kill: (sig: NodeJS.Signals) => proc.kill(sig),
            on: proc.on.bind(proc),
            once: proc.once.bind(proc),
            off: proc.off.bind(proc),
          }
        },
      }
    })

    for await (const message of conversation) {
      if (signal?.aborted) break

      if (
        message.type === 'stream_event' &&
        message.event.type === 'content_block_delta' &&
        message.event.delta.type === 'text_delta'
      ) {
        onChunk(message.event.delta.text)
      }
    }
  }

  private buildContext(chunks: TextChunk[]): string {
    if (chunks.length === 0) {
      return 'PDFからのコンテキストが見つかりませんでした。'
    }

    return chunks
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(chunk => `[ページ ${chunk.pageNumber}]\n${chunk.text}`)
      .join('\n\n---\n\n')
  }
}

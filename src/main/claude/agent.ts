import { query } from '@anthropic-ai/claude-agent-sdk'
import { TextChunk } from '../pdf/chunker'

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
        env: { ...process.env, ANTHROPIC_API_KEY: this.apiKey }
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

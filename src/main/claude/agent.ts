import Anthropic from '@anthropic-ai/sdk'
import { TextChunk } from '../pdf/chunker'

export class ClaudeAgent {
  private client: Anthropic
  private readonly model = 'claude-opus-4-5'
  private readonly maxTokens = 4096

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
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
- ページ番号の参照がある場合は「(p.X)」形式で引用元を示してください
- マークダウン形式で構造化した回答を心がけてください`

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: this.maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    signal?.addEventListener('abort', () => {
      stream.abort()
    })

    for await (const event of stream) {
      if (signal?.aborted) break

      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        onChunk(event.delta.text)
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

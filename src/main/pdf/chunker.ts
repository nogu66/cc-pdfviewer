export interface TextChunk {
  id: string
  text: string
  pageNumber: number
  chunkIndex: number
  startChar: number
  endChar: number
}

export interface ChunkOptions {
  chunkSize: number
  chunkOverlap: number
  minChunkSize: number
}

export class PDFChunker {
  private options: ChunkOptions

  constructor(options?: Partial<ChunkOptions>) {
    this.options = {
      chunkSize: 800,
      chunkOverlap: 150,
      minChunkSize: 100,
      ...options
    }
  }

  chunk(fullText: string, pageTexts: Map<number, string>): TextChunk[] {
    const chunks: TextChunk[] = []
    let chunkIndex = 0

    if (pageTexts.size > 0) {
      for (const [pageNum, pageText] of pageTexts) {
        const cleanedText = this.cleanText(pageText)
        if (cleanedText.length < this.options.minChunkSize) continue

        const pageChunks = this.splitIntoChunks(cleanedText, pageNum, chunkIndex)
        chunks.push(...pageChunks)
        chunkIndex += pageChunks.length
      }
    }

    // ページテキストが空の場合は全文からチャンキング
    if (chunks.length === 0) {
      const cleanedText = this.cleanText(fullText)
      const allChunks = this.splitIntoChunks(cleanedText, 1, 0)
      chunks.push(...allChunks)
    }

    return chunks
  }

  private splitIntoChunks(text: string, pageNum: number, startIndex: number): TextChunk[] {
    const chunks: TextChunk[] = []
    const { chunkSize, chunkOverlap, minChunkSize } = this.options

    const sentences = this.splitIntoSentences(text)
    let currentChunk = ''
    let currentStart = 0
    let absolutePos = 0
    let localIndex = 0

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length >= minChunkSize) {
        chunks.push({
          id: `page${pageNum}-chunk${startIndex + localIndex}`,
          text: currentChunk.trim(),
          pageNumber: pageNum,
          chunkIndex: startIndex + localIndex,
          startChar: currentStart,
          endChar: currentStart + currentChunk.length
        })
        localIndex++

        // オーバーラップ
        const overlapText = currentChunk.length > chunkOverlap
          ? currentChunk.slice(-chunkOverlap)
          : currentChunk
        currentStart = absolutePos - overlapText.length
        currentChunk = overlapText + sentence
      } else {
        currentChunk += sentence
      }

      absolutePos += sentence.length
    }

    if (currentChunk.trim().length >= minChunkSize) {
      chunks.push({
        id: `page${pageNum}-chunk${startIndex + localIndex}`,
        text: currentChunk.trim(),
        pageNumber: pageNum,
        chunkIndex: startIndex + localIndex,
        startChar: currentStart,
        endChar: currentStart + currentChunk.length
      })
    }

    return chunks
  }

  private splitIntoSentences(text: string): string[] {
    // 日本語・英語対応の文分割
    const parts = text.split(/(?<=[。.!?！？\n])/)
    return parts.filter(s => s.length > 0)
  }

  private cleanText(text: string): string {
    return text
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\d+\s*$/gm, '')
      .trim()
  }
}

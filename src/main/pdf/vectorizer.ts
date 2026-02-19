import { TextChunk } from './chunker'

export class PDFVectorizer {
  private indexMap: Map<string, TextChunk[]>

  constructor() {
    this.indexMap = new Map()
  }

  async buildIndex(filePath: string, chunks: TextChunk[]): Promise<void> {
    this.indexMap.set(filePath, chunks)
  }

  async search(filePath: string, query: string, topK: number = 5): Promise<TextChunk[]> {
    const chunks = this.indexMap.get(filePath)
    if (!chunks || chunks.length === 0) {
      return []
    }

    const queryTerms = this.tokenize(query)
    const scored = chunks.map(chunk => ({
      chunk,
      score: this.bm25Score(chunk.text, queryTerms, chunks)
    }))

    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, topK).map(s => s.chunk)
  }

  // BM25スコア計算（k1=1.5, b=0.75）
  private bm25Score(
    document: string,
    queryTerms: string[],
    allDocs: TextChunk[]
  ): number {
    const k1 = 1.5
    const b = 0.75
    const docTokens = this.tokenize(document)
    const docLength = docTokens.length
    const avgDocLength = allDocs.reduce(
      (sum, d) => sum + this.tokenize(d.text).length, 0
    ) / Math.max(allDocs.length, 1)

    let score = 0
    for (const term of queryTerms) {
      const tf = docTokens.filter(t => t === term).length
      if (tf === 0) continue

      const df = allDocs.filter(d => this.tokenize(d.text).includes(term)).length
      const idf = Math.log((allDocs.length - df + 0.5) / (df + 0.5) + 1)
      const tfNorm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (docLength / avgDocLength)))
      score += idf * tfNorm
    }

    return score
  }

  private tokenize(text: string): string[] {
    const normalized = text.toLowerCase()

    // 英単語
    const englishWords = normalized.match(/[a-z0-9]+/g) || []

    // 日本語2-gram
    const japaneseChars = normalized.match(/[\u3000-\u9fff\uff00-\uffef]/g) || []
    const japaneseNgrams: string[] = []
    for (let i = 0; i < japaneseChars.length - 1; i++) {
      japaneseNgrams.push(japaneseChars[i] + japaneseChars[i + 1])
    }

    return [...englishWords, ...japaneseNgrams]
  }

  clearIndex(filePath?: string): void {
    if (filePath) {
      this.indexMap.delete(filePath)
    } else {
      this.indexMap.clear()
    }
  }
}

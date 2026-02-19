import { readFile } from 'fs/promises'
import { PDFChunker, TextChunk } from './chunker'

// pdf-parseの型定義
interface PDFData {
  numpages: number
  text: string
  info?: {
    Title?: string
    [key: string]: unknown
  }
}

export interface ExtractionResult {
  pageCount: number
  title: string
  fullText: string
  pageTexts: Map<number, string>
  chunks: TextChunk[]
}

export class PDFExtractor {
  private chunker: PDFChunker
  private cache: Map<string, ExtractionResult>

  constructor() {
    this.chunker = new PDFChunker()
    this.cache = new Map()
  }

  async extract(filePath: string): Promise<ExtractionResult> {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!
    }

    const buffer = await readFile(filePath)

    // pdf-parseを動的インポートで読み込む
    const pdfParse = (await import('pdf-parse')).default
    const data: PDFData = await pdfParse(buffer)

    // ページごとのテキストを分割（近似）
    const pageTexts = new Map<number, string>()
    const lines = data.text.split('\n')
    const linesPerPage = Math.ceil(lines.length / Math.max(data.numpages, 1))

    for (let i = 0; i < data.numpages; i++) {
      const pageLines = lines.slice(i * linesPerPage, (i + 1) * linesPerPage)
      const pageText = pageLines.join('\n').trim()
      if (pageText.length > 0) {
        pageTexts.set(i + 1, pageText)
      }
    }

    const title = (data.info?.Title as string) || this.extractTitleFromText(data.text)
    const chunks = this.chunker.chunk(data.text, pageTexts)

    const result: ExtractionResult = {
      pageCount: data.numpages,
      title,
      fullText: data.text,
      pageTexts,
      chunks
    }

    this.cache.set(filePath, result)
    return result
  }

  async getPageText(filePath: string, pageNum: number): Promise<string> {
    const result = await this.extract(filePath)
    return result.pageTexts.get(pageNum) || ''
  }

  private extractTitleFromText(text: string): string {
    const lines = text.split('\n').filter(l => l.trim().length > 0)
    if (lines.length > 0) {
      return lines[0].trim().slice(0, 100)
    }
    return 'Untitled PDF'
  }

  clearCache(filePath?: string): void {
    if (filePath) {
      this.cache.delete(filePath)
    } else {
      this.cache.clear()
    }
  }
}

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as PDFJS from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useLanguage } from '../contexts/LanguageContext'

// PDF.jsのワーカーを設定
PDFJS.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString()

interface PDFViewerProps {
  filePath: string
  currentPage: number
  pageCount: number
  onPageChange: (page: number) => void
}

const toolbarBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'var(--color-bg-3)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  color: 'var(--color-text)',
  cursor: 'pointer',
  fontSize: '14px',
  lineHeight: 1,
  transition: 'background 0.15s'
}

export default function PDFViewer({
  filePath,
  currentPage,
  pageCount,
  onPageChange
}: PDFViewerProps): React.ReactElement {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [scale, setScale] = useState(1.0)
  const [isRendering, setIsRendering] = useState(false)
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null)
  const [pageInput, setPageInput] = useState(String(currentPage))

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    let cancelled = false
    setPdfDoc(null)

    const loadPDF = async (): Promise<void> => {
      try {
        const data = await window.electronAPI.fs.readFile(filePath)
        if (cancelled) return
        const doc = await PDFJS.getDocument({ data }).promise
        if (!cancelled) {
          setPdfDoc(doc)
        }
      } catch (err) {
        console.error('PDF load error:', err)
      }
    }

    loadPDF()
    return () => {
      cancelled = true
    }
  }, [filePath])

  const renderPage = useCallback(
    async (doc: PDFDocumentProxy, pageNum: number, currentScale: number): Promise<void> => {
      if (!canvasRef.current) return

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }

      setIsRendering(true)
      try {
        const page = await doc.getPage(pageNum)
        const viewport = page.getViewport({ scale: currentScale })

        const canvas = canvasRef.current
        if (!canvas) return
        const context = canvas.getContext('2d')
        if (!context) return

        const pixelRatio = window.devicePixelRatio || 1
        canvas.width = viewport.width * pixelRatio
        canvas.height = viewport.height * pixelRatio
        canvas.style.width = `${viewport.width}px`
        canvas.style.height = `${viewport.height}px`

        context.scale(pixelRatio, pixelRatio)

        const renderTask = page.render({ canvasContext: context, viewport })
        renderTaskRef.current = renderTask as unknown as { cancel: () => void }
        await renderTask.promise
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes('cancelled')) {
          console.error('Page render error:', err)
        }
      } finally {
        setIsRendering(false)
      }
    },
    []
  )

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pdfDoc, currentPage, scale)
    }
  }, [pdfDoc, currentPage, scale, renderPage])

  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return

    const adjustScale = async (): Promise<void> => {
      const page = await pdfDoc.getPage(1)
      const viewport = page.getViewport({ scale: 1.0 })
      const containerWidth = containerRef.current!.clientWidth - 48
      const newScale = containerWidth / viewport.width
      setScale(Math.min(Math.max(newScale, 0.5), 3.0))
    }

    adjustScale()
  }, [pdfDoc])

  const handleZoomIn = (): void => setScale(s => Math.min(s + 0.25, 3.0))
  const handleZoomOut = (): void => setScale(s => Math.max(s - 0.25, 0.25))
  const handleZoomReset = (): void => setScale(1.0)

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPageInput(e.target.value)
  }

  const handlePageInputBlur = (): void => {
    const val = parseInt(pageInput, 10)
    if (!isNaN(val) && val >= 1 && val <= pageCount) {
      onPageChange(val)
    } else {
      setPageInput(String(currentPage))
    }
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handlePageInputBlur()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg-2)',
        flexShrink: 0
      }}>
        {/* Page navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{ ...toolbarBtnStyle, opacity: currentPage <= 1 ? 0.4 : 1 }}
            title={t('pdf.prevPage')}
          >
            ←
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            <input
              type="number"
              value={pageInput}
              min={1}
              max={pageCount}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              style={{
                width: '48px',
                background: 'var(--color-bg-3)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text)',
                textAlign: 'center',
                padding: '2px 4px',
                fontSize: '13px'
              }}
            />
            <span>/ {pageCount}</span>
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= pageCount}
            style={{ ...toolbarBtnStyle, opacity: currentPage >= pageCount ? 0.4 : 1 }}
            title={t('pdf.nextPage')}
          >
            →
          </button>
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleZoomOut} style={toolbarBtnStyle} title={t('pdf.zoomOut')}>−</button>
          <button
            onClick={handleZoomReset}
            style={{ ...toolbarBtnStyle, minWidth: '56px', fontSize: '12px' }}
            title={t('pdf.zoomReset')}
          >
            {Math.round(scale * 100)}%
          </button>
          <button onClick={handleZoomIn} style={toolbarBtnStyle} title={t('pdf.zoomIn')}>＋</button>
        </div>

        <div style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
          {isRendering && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t('pdf.rendering')}</span>
          )}
        </div>
      </div>

      {/* PDF canvas */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '24px',
          background: '#525659'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            borderRadius: '2px',
            display: 'block'
          }}
        />
      </div>
    </div>
  )
}

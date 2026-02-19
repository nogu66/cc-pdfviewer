import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as PDFJS from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useLanguage } from '../contexts/LanguageContext'

interface ThumbnailPanelProps {
  filePath: string
  pageCount: number
  currentPage: number
  onPageSelect: (page: number) => void
}

interface ThumbnailItem {
  pageNum: number
  dataUrl: string | null
  isLoading: boolean
}

const THUMBNAIL_WIDTH = 140

export default function ThumbnailPanel({
  filePath,
  pageCount,
  currentPage,
  onPageSelect
}: ThumbnailPanelProps): React.ReactElement {
  const { t } = useLanguage()
  const [thumbnails, setThumbnails] = useState<ThumbnailItem[]>([])
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const activePageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const loadPDF = async (): Promise<void> => {
      const data = await window.electronAPI.fs.readFile(filePath)
      if (cancelled) return
      const doc = await PDFJS.getDocument({ data }).promise
      if (!cancelled) {
        setPdfDoc(doc)
        setThumbnails(
          Array.from({ length: doc.numPages }, (_, i) => ({
            pageNum: i + 1,
            dataUrl: null,
            isLoading: true
          }))
        )
      }
    }

    loadPDF()
    return () => { cancelled = true }
  }, [filePath])

  const generateThumbnail = useCallback(
    async (doc: PDFDocumentProxy, pageNum: number): Promise<string> => {
      const page = await doc.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.0 })
      const scale = THUMBNAIL_WIDTH / viewport.width
      const scaledViewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height

      const context = canvas.getContext('2d')!
      await page.render({ canvasContext: context, viewport: scaledViewport }).promise

      return canvas.toDataURL('image/jpeg', 0.7)
    },
    []
  )

  useEffect(() => {
    if (!pdfDoc) return

    let cancelled = false

    const generateAll = async (): Promise<void> => {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (cancelled) break
        try {
          const dataUrl = await generateThumbnail(pdfDoc, i)
          if (!cancelled) {
            setThumbnails(prev =>
              prev.map(th => th.pageNum === i ? { ...th, dataUrl, isLoading: false } : th)
            )
          }
        } catch {
          if (!cancelled) {
            setThumbnails(prev =>
              prev.map(th => th.pageNum === i ? { ...th, isLoading: false } : th)
            )
          }
        }
      }
    }

    generateAll()
    return () => { cancelled = true }
  }, [pdfDoc, generateThumbnail])

  useEffect(() => {
    activePageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentPage])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
        userSelect: 'none'
      }}>
        {t('thumbnail.pages', { n: pageCount })}
      </div>

      {/* Thumbnail list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {thumbnails.map(thumbnail => (
          <div
            key={thumbnail.pageNum}
            ref={thumbnail.pageNum === currentPage ? activePageRef : null}
            onClick={() => onPageSelect(thumbnail.pageNum)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '6px',
              borderRadius: '6px',
              cursor: 'pointer',
              border: thumbnail.pageNum === currentPage
                ? '2px solid var(--color-accent)'
                : '2px solid transparent',
              background: thumbnail.pageNum === currentPage
                ? 'rgba(249, 115, 22, 0.08)'
                : 'transparent',
              transition: 'all 0.15s'
            }}
          >
            <div style={{
              width: THUMBNAIL_WIDTH,
              aspectRatio: '0.707',
              background: thumbnail.isLoading ? 'var(--color-bg-3)' : '#fff',
              borderRadius: '3px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {thumbnail.isLoading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
              ) : thumbnail.dataUrl ? (
                <img
                  src={thumbnail.dataUrl}
                  alt={`${thumbnail.pageNum}`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  draggable={false}
                />
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{t('thumbnail.error')}</span>
              )}
            </div>

            <span style={{
              fontSize: '11px',
              color: thumbnail.pageNum === currentPage
                ? 'var(--color-accent)'
                : 'var(--color-text-muted)'
            }}>
              {thumbnail.pageNum}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

import React, { useState, useCallback, useEffect, useRef } from 'react'
import PDFViewer from './components/PDFViewer'
import ThumbnailPanel from './components/ThumbnailPanel'
import ChatPanel from './components/ChatPanel'
import SettingsDialog from './components/SettingsDialog'
import { usePDF } from './hooks/usePDF'
import { useRecentFiles } from './hooks/useRecentFiles'
import { useTheme } from './hooks/useTheme'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { createT, type Locale } from './i18n'

const getFileName = (filePath: string): string => filePath.split('/').pop() ?? filePath

function formatRelativeDate(ts: number, t: ReturnType<typeof createT>, locale: Locale): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return t('date.justNow')
  if (minutes < 60) return t('date.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('date.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('date.daysAgo', { n: days })
  return new Date(ts).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US')
}

const PdfIcon = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

function AppContent(): React.ReactElement {
  const {
    filePath,
    pageCount,
    currentPage,
    title,
    isLoading,
    error,
    openFile,
    goToPage,
    handleDrop
  } = usePDF()

  const { recentFiles, addRecentFile, removeRecentFile } = useRecentFiles()
  const { theme, setTheme } = useTheme()
  const { t, locale } = useLanguage()

  const [isDragOver, setIsDragOver] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isRecentOpen, setIsRecentOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isRecentOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsRecentOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isRecentOpen])

  const prevLoadedPathRef = useRef<string | null>(null)
  useEffect(() => {
    if (filePath && title && !isLoading && !error && filePath !== prevLoadedPathRef.current) {
      prevLoadedPathRef.current = filePath
      addRecentFile(filePath, title)
    }
  }, [filePath, title, isLoading, error, addRecentFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleDropEvent = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      const pdfFile = files.find(f => f.name.toLowerCase().endsWith('.pdf'))
      if (pdfFile) {
        const electronFile = pdfFile as File & { path?: string }
        if (electronFile.path) {
          await handleDrop(electronFile.path)
        }
      }
    },
    [handleDrop]
  )

  const handleOpenRecent = useCallback(
    async (recentFilePath: string) => {
      setIsRecentOpen(false)
      await handleDrop(recentFilePath)
    },
    [handleDrop]
  )

  return (
    <div
      className="app-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropEvent}
    >
      {/* Title bar */}
      <header className="titlebar">
        <span className="titlebar-title">
          {title ? `${title} — CC PDF Viewer` : 'CC PDF Viewer'}
        </span>
        <div style={{ display: 'flex', gap: '8px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Open + Recent dropdown (split button) */}
          <div ref={dropdownRef} style={{ position: 'relative', display: 'flex' }}>
            <button
              className="titlebar-open-btn"
              onClick={openFile}
              style={{ borderRadius: recentFiles.length > 0 ? '6px 0 0 6px' : '6px', borderRight: recentFiles.length > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}
            >
              {t('app.open')}
            </button>
            {recentFiles.length > 0 && (
              <button
                className="titlebar-open-btn"
                onClick={() => setIsRecentOpen(v => !v)}
                title={t('app.recentFiles')}
                style={{ borderRadius: '0 6px 6px 0', padding: '4px 7px', fontSize: '10px' }}
              >
                ▾
              </button>
            )}
            {isRecentOpen && (
              <div className="recent-dropdown">
                <div className="recent-dropdown-header">{t('app.recentFiles')}</div>
                {recentFiles.slice(0, 8).map(file => (
                  <button
                    key={file.filePath}
                    className="recent-dropdown-item"
                    onClick={() => handleOpenRecent(file.filePath)}
                    title={file.filePath}
                  >
                    <PdfIcon size={13} style={{ flexShrink: 0, opacity: 0.5 }} />
                    <span className="recent-dropdown-name">
                      {file.title || getFileName(file.filePath)}
                    </span>
                    <span className="recent-dropdown-date">
                      {formatRelativeDate(file.openedAt, t, locale)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {filePath && (
            <button
              className="titlebar-open-btn"
              onClick={() => setIsChatOpen(prev => !prev)}
              style={{
                background: isChatOpen ? 'var(--color-accent)' : 'var(--color-bg-3)',
                border: '1px solid var(--color-border)',
                color: isChatOpen ? 'white' : 'var(--color-text-muted)'
              }}
            >
              {t('app.chat')}
            </button>
          )}
          <button
            className="titlebar-open-btn"
            onClick={() => setIsSettingsOpen(true)}
            style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            {t('app.settings')}
          </button>
        </div>
      </header>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main content */}
      <main className="main-layout">
        {!filePath ? (
          <div className={`welcome-screen${isDragOver ? ' drag-over' : ''}`}>
            <div className={`welcome-content${recentFiles.length > 0 ? ' welcome-content--wide' : ''}`}>

              <div className="welcome-header">
                <div className="welcome-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h1 className="welcome-title">CC PDF Viewer</h1>
              </div>

              <div className="welcome-body">
                <div className="welcome-section">
                  <h2 className="welcome-section-title">{t('app.start')}</h2>
                  <button className="welcome-action-btn" onClick={openFile}>
                    <PdfIcon size={15} style={{ flexShrink: 0 }} />
                    <span>{t('app.openPdf')}</span>
                  </button>
                  <p className="welcome-hint">{t('app.dragAndDrop')}</p>
                </div>

                {recentFiles.length > 0 && (
                  <div className="welcome-section welcome-section--recent">
                    <h2 className="welcome-section-title">{t('app.recentFiles')}</h2>
                    <div className="welcome-recent-list">
                      {recentFiles.map(file => (
                        <div key={file.filePath} className="welcome-recent-item">
                          <button
                            className="welcome-recent-btn"
                            onClick={() => handleOpenRecent(file.filePath)}
                            title={file.filePath}
                          >
                            <PdfIcon size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                            <div className="welcome-recent-info">
                              <span className="welcome-recent-name">
                                {file.title || getFileName(file.filePath)}
                              </span>
                              <span className="welcome-recent-path">{file.filePath}</span>
                            </div>
                            <span className="welcome-recent-date">
                              {formatRelativeDate(file.openedAt, t, locale)}
                            </span>
                          </button>
                          <button
                            className="welcome-recent-remove"
                            onClick={() => removeRecentFile(file.filePath)}
                            title={t('app.removeFromHistory')}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="three-pane-layout">
            <div className="thumbnail-panel-container">
              <ThumbnailPanel
                filePath={filePath}
                pageCount={pageCount}
                currentPage={currentPage}
                onPageSelect={goToPage}
              />
            </div>

            <div className="center-layout">
              <div className="pdf-viewer-container">
                {isLoading ? (
                  <div className="loading-indicator">
                    <div className="spinner" />
                    <span>{t('app.processingPdf')}</span>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <span>{t('app.error')}: {error}</span>
                    <button
                      onClick={openFile}
                      style={{
                        marginTop: '8px',
                        padding: '6px 16px',
                        background: 'var(--color-accent)',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {t('app.openAnotherFile')}
                    </button>
                  </div>
                ) : (
                  <PDFViewer
                    filePath={filePath}
                    currentPage={currentPage}
                    onPageChange={goToPage}
                    pageCount={pageCount}
                  />
                )}
              </div>
            </div>

            <div className={`chat-sidebar${isChatOpen ? '' : ' collapsed'}`}>
              <ChatPanel
                filePath={filePath}
                isReady={!isLoading && !error}
                onGoToPage={goToPage}
                onClose={() => setIsChatOpen(false)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function App(): React.ReactElement {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

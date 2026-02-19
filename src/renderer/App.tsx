import React, { useState, useCallback } from 'react'
import PDFViewer from './components/PDFViewer'
import ThumbnailPanel from './components/ThumbnailPanel'
import ChatPanel from './components/ChatPanel'
import SettingsDialog from './components/SettingsDialog'
import { usePDF } from './hooks/usePDF'

export default function App(): React.ReactElement {
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

  const [isDragOver, setIsDragOver] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

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
        // Electron環境ではFile.pathが利用可能
        const electronFile = pdfFile as File & { path?: string }
        if (electronFile.path) {
          await handleDrop(electronFile.path)
        }
      }
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
      {/* タイトルバー */}
      <header className="titlebar">
        <span className="titlebar-title">
          {title ? `${title} — Claude Cowork for PDF` : 'Claude Cowork for PDF'}
        </span>
        <div style={{ display: 'flex', gap: '8px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button className="titlebar-open-btn" onClick={openFile}>
            開く
          </button>
          <button
            className="titlebar-open-btn"
            onClick={() => setIsSettingsOpen(true)}
            style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            設定
          </button>
        </div>
      </header>

      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* メインコンテンツ */}
      <main className="main-layout">
        {!filePath ? (
          // ウェルカム画面
          <div className={`welcome-screen${isDragOver ? ' drag-over' : ''}`}>
            <div className="welcome-content">
              <div className="welcome-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h1 className="welcome-title">Claude Cowork for PDF</h1>
              <p className="welcome-subtitle">
                PDFをドラッグ＆ドロップするか、ファイルを選択してください
              </p>
              <button className="welcome-open-btn" onClick={openFile}>
                PDFファイルを開く
              </button>
            </div>
          </div>
        ) : (
          // 3ペインレイアウト
          <div className="three-pane-layout">
            {/* 左: サムネイルパネル */}
            <div className="thumbnail-panel-container">
              <ThumbnailPanel
                filePath={filePath}
                pageCount={pageCount}
                currentPage={currentPage}
                onPageSelect={goToPage}
              />
            </div>

            {/* 中央+下部 */}
            <div className="center-layout">
              {/* 中央: PDFビューア */}
              <div className="pdf-viewer-container">
                {isLoading ? (
                  <div className="loading-indicator">
                    <div className="spinner" />
                    <span>PDFを処理中...</span>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <span>エラー: {error}</span>
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
                      別のファイルを開く
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

              {/* 下部: チャットパネル */}
              <div className="chat-panel-container">
                <ChatPanel
                  filePath={filePath}
                  isReady={!isLoading && !error}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

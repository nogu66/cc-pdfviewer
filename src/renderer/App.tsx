import React, { useState, useCallback, useEffect, useRef } from 'react'
import PDFViewer from './components/PDFViewer'
import ThumbnailPanel from './components/ThumbnailPanel'
import ChatPanel from './components/ChatPanel'
import SettingsDialog from './components/SettingsDialog'
import { usePDF } from './hooks/usePDF'
import { useRecentFiles } from './hooks/useRecentFiles'
import { useTheme } from './hooks/useTheme'

const getFileName = (filePath: string): string => filePath.split('/').pop() ?? filePath

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}日前`
  return new Date(ts).toLocaleDateString('ja-JP')
}

const PdfIcon = ({ size = 16, style }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
)

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

  const { recentFiles, addRecentFile, removeRecentFile } = useRecentFiles()
  const { theme, setTheme } = useTheme()

  const [isDragOver, setIsDragOver] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isRecentOpen, setIsRecentOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // ドロップダウン外クリックで閉じる
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

  // ファイルの読み込み成功を検知して履歴に追加
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
      {/* タイトルバー */}
      <header className="titlebar">
        <span className="titlebar-title">
          {title ? `${title} — CC PDF Viewer` : 'CC PDF Viewer'}
        </span>
        <div style={{ display: 'flex', gap: '8px', WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* 開く + 履歴ドロップダウン (スプリットボタン) */}
          <div ref={dropdownRef} style={{ position: 'relative', display: 'flex' }}>
            <button
              className="titlebar-open-btn"
              onClick={openFile}
              style={{ borderRadius: recentFiles.length > 0 ? '6px 0 0 6px' : '6px', borderRight: recentFiles.length > 0 ? '1px solid rgba(255,255,255,0.15)' : 'none' }}
            >
              開く
            </button>
            {recentFiles.length > 0 && (
              <button
                className="titlebar-open-btn"
                onClick={() => setIsRecentOpen(v => !v)}
                title="最近のファイル"
                style={{ borderRadius: '0 6px 6px 0', padding: '4px 7px', fontSize: '10px' }}
              >
                ▾
              </button>
            )}
            {isRecentOpen && (
              <div className="recent-dropdown">
                <div className="recent-dropdown-header">最近のファイル</div>
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
                      {formatRelativeDate(file.openedAt)}
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
              チャット
            </button>
          )}
          <button
            className="titlebar-open-btn"
            onClick={() => setIsSettingsOpen(true)}
            style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
          >
            設定
          </button>
        </div>
      </header>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
      />

      {/* メインコンテンツ */}
      <main className="main-layout">
        {!filePath ? (
          // ウェルカム画面
          <div className={`welcome-screen${isDragOver ? ' drag-over' : ''}`}>
            <div className={`welcome-content${recentFiles.length > 0 ? ' welcome-content--wide' : ''}`}>

              {/* ヘッダー: アイコン + タイトル */}
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

              {/* ボディ: 開始 + 最近のファイル */}
              <div className="welcome-body">
                {/* 開始セクション */}
                <div className="welcome-section">
                  <h2 className="welcome-section-title">開始</h2>
                  <button className="welcome-action-btn" onClick={openFile}>
                    <PdfIcon size={15} style={{ flexShrink: 0 }} />
                    <span>PDFファイルを開く</span>
                  </button>
                  <p className="welcome-hint">またはウィンドウにD&D</p>
                </div>

                {/* 最近のファイルセクション */}
                {recentFiles.length > 0 && (
                  <div className="welcome-section welcome-section--recent">
                    <h2 className="welcome-section-title">最近のファイル</h2>
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
                              {formatRelativeDate(file.openedAt)}
                            </span>
                          </button>
                          <button
                            className="welcome-recent-remove"
                            onClick={() => removeRecentFile(file.filePath)}
                            title="履歴から削除"
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
          // 3ペインレイアウト
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

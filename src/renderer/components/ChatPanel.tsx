import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useChat } from '../hooks/useChat'
import MarkdownContent from './MarkdownContent'

interface ChatPanelProps {
  filePath: string
  isReady: boolean
  onGoToPage?: (page: number) => void
  onClose?: () => void
}

export default function ChatPanel({ filePath, isReady, onGoToPage, onClose }: ChatPanelProps): React.ReactElement {
  const {
    messages,
    inputValue,
    isStreaming,
    setInputValue,
    sendMessage,
    abortStream,
    newSession
  } = useChat(filePath)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 新しいメッセージが来たら最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // テキストエリアの高さを自動調整
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [inputValue])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent): Promise<void> => {
      e?.preventDefault()
      if (!inputValue.trim() || isStreaming || !isReady) return
      const msg = inputValue.trim()
      setInputValue('')
      await sendMessage(msg)
    },
    [inputValue, isStreaming, isReady, sendMessage, setInputValue]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      // IME変換中（CJK等）のEnterは送信しない
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleCopy = useCallback(async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(prev => (prev === id ? null : prev)), 2000)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ヘッダー */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0
      }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
          Claude と対話
        </span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isReady && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              PDFを処理中...
            </span>
          )}
          <button
            onClick={newSession}
            disabled={isStreaming}
            style={{
              padding: '3px 10px',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '5px',
              color: 'var(--color-text-muted)',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              opacity: isStreaming ? 0.5 : 1
            }}
          >
            新規セッション
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="チャットを閉じる"
              style={{
                padding: '3px 8px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: '5px',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* メッセージリスト */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
            paddingTop: '20px'
          }}>
            {isReady
              ? 'PDFについて何でも質問してください'
              : 'PDFの処理が完了するとチャットが有効になります'}
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '4px'
            }}
          >
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              paddingLeft: msg.role === 'assistant' ? '4px' : '0',
              paddingRight: msg.role === 'user' ? '4px' : '0'
            }}>
              {msg.role === 'user' ? 'あなた' : 'Claude'}
            </div>

            {msg.role === 'assistant' ? (
              <div
                className="message-content"
                style={{
                  maxWidth: '100%',
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 2px',
                  background: 'var(--color-bg-3)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  wordBreak: 'break-word'
                }}
              >
                <MarkdownContent content={msg.content} onGoToPage={onGoToPage} />
              </div>
            ) : (
              <div
                style={{
                  maxWidth: '85%',
                  padding: '8px 12px',
                  borderRadius: '12px 12px 2px 12px',
                  background: 'var(--color-accent)',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </div>
            )}

            {/* アシスタントメッセージのアクション */}
            {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
              <div className="message-actions">
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(msg.id, msg.content)}
                >
                  {copiedId === msg.id ? 'コピーしました' : 'コピー'}
                </button>
              </div>
            )}

            {/* エラー表示 */}
            {msg.error && (
              <div style={{
                fontSize: '11px',
                color: 'var(--color-error)',
                padding: '4px 8px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '4px',
                maxWidth: '85%'
              }}>
                エラー: {msg.error}
              </div>
            )}

            {/* ストリーミングカーソル */}
            {msg.isStreaming && (
              <div style={{
                width: '8px',
                height: '16px',
                background: 'var(--color-accent)',
                borderRadius: '2px',
                animation: 'blink 1s step-end infinite',
                marginLeft: '4px'
              }} />
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--color-border)',
        flexShrink: 0,
        background: 'var(--color-bg-2)'
      }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}
        >
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isReady
                ? 'PDFについて質問する... (Shift+Enter で改行)'
                : 'PDFを処理中...'
            }
            disabled={!isReady || isStreaming}
            rows={1}
            style={{
              flex: 1,
              resize: 'none',
              background: 'var(--color-bg-3)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text)',
              padding: '8px 12px',
              fontSize: '13px',
              lineHeight: 1.5,
              outline: 'none',
              minHeight: '36px',
              maxHeight: '120px',
              fontFamily: 'inherit',
              opacity: (!isReady || isStreaming) ? 0.6 : 1
            }}
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={abortStream}
              style={{
                padding: '8px 14px',
                background: 'var(--color-error)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              停止
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim() || !isReady}
              style={{
                padding: '8px 14px',
                background: !inputValue.trim() || !isReady
                  ? 'var(--color-bg-3)'
                  : 'var(--color-accent)',
                border: 'none',
                borderRadius: '8px',
                color: !inputValue.trim() || !isReady
                  ? 'var(--color-text-muted)'
                  : 'white',
                cursor: !inputValue.trim() || !isReady ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              送信
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

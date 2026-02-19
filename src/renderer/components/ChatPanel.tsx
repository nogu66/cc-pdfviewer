import React, { useRef, useEffect, useCallback } from 'react'
import { useChat } from '../hooks/useChat'

interface ChatPanelProps {
  filePath: string
  isReady: boolean
}

// シンプルなマークダウンレンダラー
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) =>
      `<pre><code>${escapeHtml(code.trim())}</code></pre>`)
    .replace(/`([^`]+)`/g, (_m, code) => `<code>${escapeHtml(code)}</code>`)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^[*\-] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^([^<].*)$/gm, '<p>$1</p>')
}

export default function ChatPanel({ filePath, isReady }: ChatPanelProps): React.ReactElement {
  const {
    messages,
    inputValue,
    isStreaming,
    setInputValue,
    sendMessage,
    abortStream,
    clearMessages
  } = useChat(filePath)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

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
            onClick={clearMessages}
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
            クリア
          </button>
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

            <div
              className={msg.role === 'assistant' ? 'message-content' : undefined}
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user'
                  ? '12px 12px 2px 12px'
                  : '12px 12px 12px 2px',
                background: msg.role === 'user'
                  ? 'var(--color-accent)'
                  : 'var(--color-bg-3)',
                color: 'var(--color-text)',
                fontSize: '13px',
                lineHeight: 1.6,
                wordBreak: 'break-word',
                whiteSpace: msg.role === 'user' ? 'pre-wrap' : undefined
              }}
              {...(msg.role === 'assistant'
                ? { dangerouslySetInnerHTML: { __html: renderMarkdown(msg.content) } }
                : { children: msg.content }
              )}
            />

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

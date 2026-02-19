import React, { useState, useEffect } from 'react'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps): React.ReactElement | null {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  // ダイアログが開くたびに現在のAPIキーを取得
  useEffect(() => {
    if (!isOpen) return
    window.electronAPI.store.get('anthropicApiKey').then(key => {
      if (typeof key === 'string') setApiKey(key)
    })
    setSavedMessage('')
  }, [isOpen])

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSave = async () => {
    setIsSaving(true)
    await window.electronAPI.store.set('anthropicApiKey', apiKey.trim())
    setIsSaving(false)
    setSavedMessage('保存しました。次回のチャットから反映されます。')
  }

  if (!isOpen) return null

  return (
    // オーバーレイ
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      {/* ダイアログ本体 */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          width: '440px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
            設定
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* APIキー入力 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            Anthropic APIキー
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setSavedMessage('') }}
              placeholder="sk-ant-..."
              style={{
                flex: 1,
                background: 'var(--color-bg-3)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text)',
                padding: '8px 12px',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border)' }}
              autoFocus
            />
            <button
              onClick={() => setShowKey(v => !v)}
              title={showKey ? '隠す' : '表示'}
              style={{
                padding: '8px 10px',
                background: 'var(--color-bg-3)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
            APIキーはローカルにのみ保存され、外部には送信されません。
          </p>
        </div>

        {/* 保存メッセージ */}
        {savedMessage && (
          <p style={{ fontSize: '12px', color: 'var(--color-success)', marginBottom: '12px' }}>
            ✓ {savedMessage}
          </p>
        )}

        {/* ボタン */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !apiKey.trim()}
            style={{
              padding: '8px 20px',
              background: apiKey.trim() ? 'var(--color-accent)' : 'var(--color-bg-3)',
              border: 'none',
              borderRadius: '8px',
              color: apiKey.trim() ? 'white' : 'var(--color-text-muted)',
              cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              fontWeight: 500
            }}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

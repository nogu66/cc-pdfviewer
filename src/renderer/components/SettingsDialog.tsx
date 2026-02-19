import React, { useState, useEffect } from 'react'
import type { Theme } from '../hooks/useTheme'
import { useLanguage } from '../contexts/LanguageContext'
import type { Locale } from '../i18n'

interface SettingsDialogProps {
  isOpen: boolean
  onClose: () => void
  theme: Theme
  setTheme: (t: Theme) => void
}

export default function SettingsDialog({ isOpen, onClose, theme, setTheme }: SettingsDialogProps): React.ReactElement | null {
  const { t, locale, setLocale } = useLanguage()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const THEME_OPTIONS: { value: Theme; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light',  label: t('settings.themeLight') },
    { value: 'dark',   label: t('settings.themeDark') }
  ]

  const LANG_OPTIONS: { value: Locale; label: string }[] = [
    { value: 'en', label: t('settings.langEnglish') },
    { value: 'ja', label: t('settings.langJapanese') },
  ]

  useEffect(() => {
    if (!isOpen) return
    window.electronAPI.store.get('anthropicApiKey').then(key => {
      if (typeof key === 'string') setApiKey(key)
    })
    setSavedMessage('')
  }, [isOpen])

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
    setSavedMessage(t('settings.saved'))
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-2)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          padding: '24px',
          width: '440px',
          maxWidth: '90vw',
          boxShadow: '0 20px 60px var(--color-shadow-dropdown)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>{t('settings.title')}</h2>
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

        {/* Theme selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {t('settings.theme')}
          </label>
          <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {THEME_OPTIONS.map((opt, i) => {
              const isActive = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    background: isActive ? 'var(--color-accent)' : 'var(--color-bg-3)',
                    border: 'none',
                    borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none',
                    color: isActive ? 'white' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: 'inherit',
                    transition: 'background-color 0.15s, color 0.15s'
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Language selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {t('settings.language')}
          </label>
          <div style={{ display: 'flex', gap: '0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {LANG_OPTIONS.map((opt, i) => {
              const isActive = locale === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setLocale(opt.value)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    background: isActive ? 'var(--color-accent)' : 'var(--color-bg-3)',
                    border: 'none',
                    borderLeft: i > 0 ? '1px solid var(--color-border)' : 'none',
                    color: isActive ? 'white' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: 'inherit',
                    transition: 'background-color 0.15s, color 0.15s'
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Separator */}
        <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '20px' }} />

        {/* API key input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
            {t('settings.apiKey')}
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
              title={showKey ? t('settings.hide') : t('settings.show')}
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
            {t('settings.apiKeyHint')}
          </p>
        </div>

        {savedMessage && (
          <p style={{ fontSize: '12px', color: 'var(--color-success)', marginBottom: '12px' }}>
            ✓ {savedMessage}
          </p>
        )}

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
            {t('settings.cancel')}
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
            {isSaving ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

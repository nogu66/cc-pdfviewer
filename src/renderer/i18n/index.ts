export type Locale = 'en' | 'ja'

const translations = {
  en: {
    // App
    'app.open': 'Open',
    'app.recentFiles': 'Recent Files',
    'app.chat': 'Chat',
    'app.settings': 'Settings',
    'app.start': 'Start',
    'app.openPdf': 'Open PDF file',
    'app.dragAndDrop': 'Or drag & drop to window',
    'app.removeFromHistory': 'Remove from history',
    'app.processingPdf': 'Processing PDF...',
    'app.error': 'Error',
    'app.openAnotherFile': 'Open another file',
    // Relative date
    'date.justNow': 'Just now',
    'date.minutesAgo': '{n} min ago',
    'date.hoursAgo': '{n}h ago',
    'date.daysAgo': '{n}d ago',
    // Settings dialog
    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.themeSystem': 'System',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.language': 'Language',
    'settings.langEnglish': 'English',
    'settings.langJapanese': '日本語',
    'settings.apiKey': 'Anthropic API Key',
    'settings.apiKeyHint': 'API key is stored locally only and is never sent externally.',
    'settings.saved': 'Saved. Changes will take effect on the next chat.',
    'settings.cancel': 'Cancel',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
    'settings.show': 'Show',
    'settings.hide': 'Hide',
    // Chat panel
    'chat.title': 'Chat with Claude',
    'chat.processing': 'Processing PDF...',
    'chat.newSession': 'New Session',
    'chat.close': 'Close chat',
    'chat.placeholder': 'Ask about the PDF... (Shift+Enter for new line)',
    'chat.placeholderProcessing': 'Processing PDF...',
    'chat.emptyReady': 'Ask anything about the PDF',
    'chat.emptyNotReady': 'Chat will be enabled once PDF processing is complete',
    'chat.you': 'You',
    'chat.copy': 'Copy',
    'chat.copied': 'Copied!',
    'chat.error': 'Error',
    'chat.stop': 'Stop',
    'chat.send': 'Send',
    // PDF viewer
    'pdf.prevPage': 'Previous page',
    'pdf.nextPage': 'Next page',
    'pdf.zoomIn': 'Zoom in',
    'pdf.zoomOut': 'Zoom out',
    'pdf.zoomReset': 'Reset zoom',
    'pdf.rendering': 'Rendering...',
    // Thumbnail panel
    'thumbnail.pages': 'Pages ({n})',
    'thumbnail.error': 'Error',
  },
  ja: {
    // App
    'app.open': '開く',
    'app.recentFiles': '最近のファイル',
    'app.chat': 'チャット',
    'app.settings': '設定',
    'app.start': '開始',
    'app.openPdf': 'PDFファイルを開く',
    'app.dragAndDrop': 'またはウィンドウにD&D',
    'app.removeFromHistory': '履歴から削除',
    'app.processingPdf': 'PDFを処理中...',
    'app.error': 'エラー',
    'app.openAnotherFile': '別のファイルを開く',
    // Relative date
    'date.justNow': 'たった今',
    'date.minutesAgo': '{n}分前',
    'date.hoursAgo': '{n}時間前',
    'date.daysAgo': '{n}日前',
    // Settings dialog
    'settings.title': '設定',
    'settings.theme': '表示テーマ',
    'settings.themeSystem': 'システム',
    'settings.themeLight': 'ライト',
    'settings.themeDark': 'ダーク',
    'settings.language': '言語',
    'settings.langEnglish': 'English',
    'settings.langJapanese': '日本語',
    'settings.apiKey': 'Anthropic APIキー',
    'settings.apiKeyHint': 'APIキーはローカルにのみ保存され、外部には送信されません。',
    'settings.saved': '保存しました。次回のチャットから反映されます。',
    'settings.cancel': 'キャンセル',
    'settings.save': '保存',
    'settings.saving': '保存中...',
    'settings.show': '表示',
    'settings.hide': '隠す',
    // Chat panel
    'chat.title': 'Claude と対話',
    'chat.processing': 'PDFを処理中...',
    'chat.newSession': '新規セッション',
    'chat.close': 'チャットを閉じる',
    'chat.placeholder': 'PDFについて質問する... (Shift+Enter で改行)',
    'chat.placeholderProcessing': 'PDFを処理中...',
    'chat.emptyReady': 'PDFについて何でも質問してください',
    'chat.emptyNotReady': 'PDFの処理が完了するとチャットが有効になります',
    'chat.you': 'あなた',
    'chat.copy': 'コピー',
    'chat.copied': 'コピーしました',
    'chat.error': 'エラー',
    'chat.stop': '停止',
    'chat.send': '送信',
    // PDF viewer
    'pdf.prevPage': '前のページ',
    'pdf.nextPage': '次のページ',
    'pdf.zoomIn': '拡大',
    'pdf.zoomOut': '縮小',
    'pdf.zoomReset': 'リセット',
    'pdf.rendering': '描画中...',
    // Thumbnail panel
    'thumbnail.pages': 'ページ ({n})',
    'thumbnail.error': 'エラー',
  },
} as const

type TranslationKeys = keyof typeof translations.en

export function createT(locale: Locale) {
  return function t(key: TranslationKeys, params?: Record<string, string | number>): string {
    const dict = translations[locale] as Record<string, string>
    let text = dict[key] ?? (translations.en as Record<string, string>)[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }
}

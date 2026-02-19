import { IpcMain, dialog, BrowserWindow } from 'electron'
import { readFile } from 'fs/promises'
import Store from 'electron-store'
import { PDFExtractor } from '../pdf/extractor'
import { PDFVectorizer } from '../pdf/vectorizer'
import { ClaudeAgent } from '../claude/agent'

const store = new Store<{
  anthropicApiKey: string
  recentFiles: string[]
}>()

const extractor = new PDFExtractor()
const vectorizer = new PDFVectorizer()
let agent: ClaudeAgent | null = null

function getAgent(): ClaudeAgent {
  const apiKey = store.get('anthropicApiKey', '') as string
  if (!apiKey) {
    throw new Error('Anthropic APIキーが設定されていません。DevToolsコンソールで window.electronAPI.store.set("anthropicApiKey", "sk-ant-xxx") を実行してください。')
  }
  if (!agent) {
    agent = new ClaudeAgent(apiKey)
  }
  return agent
}

// 実行中のストリームを管理するMap
const activeStreams = new Map<string, AbortController>()

export function registerIPCHandlers(ipcMain: IpcMain): void {
  // PDFファイルダイアログを開く
  ipcMain.handle('pdf:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'PDFファイルを開く',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const filePath = result.filePaths[0]
    const recentFiles = (store.get('recentFiles', []) as string[])
      .filter(f => f !== filePath)
      .slice(0, 9)
    store.set('recentFiles', [filePath, ...recentFiles])

    return filePath
  })

  // PDFファイルを処理（テキスト抽出+ベクトル化）
  ipcMain.handle('pdf:process', async (_event, { filePath }: { filePath: string }) => {
    try {
      const extractionResult = await extractor.extract(filePath)
      await vectorizer.buildIndex(filePath, extractionResult.chunks)

      return {
        success: true,
        pageCount: extractionResult.pageCount,
        title: extractionResult.title || 'Untitled PDF'
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDF処理中にエラーが発生しました'
      return { success: false, pageCount: 0, title: '', error: message }
    }
  })

  // 特定ページのテキストを取得
  ipcMain.handle('pdf:get-page-text', async (_event, { filePath, pageNum }: {
    filePath: string
    pageNum: number
  }) => {
    return extractor.getPageText(filePath, pageNum)
  })

  // チャットメッセージを送信（ストリーミング）
  ipcMain.handle('chat:send', async (event, { message, filePath, conversationId }: {
    message: string
    filePath: string
    conversationId: string
  }) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return

    const abortController = new AbortController()
    activeStreams.set(conversationId, abortController)

    try {
      const claudeAgent = getAgent()
      const relevantChunks = await vectorizer.search(filePath, message, 5)

      await claudeAgent.streamResponse(
        message,
        relevantChunks,
        (chunk: string) => {
          if (!abortController.signal.aborted) {
            window.webContents.send(`chat:chunk:${conversationId}`, chunk)
          }
        },
        abortController.signal
      )

      if (!abortController.signal.aborted) {
        window.webContents.send(`chat:done:${conversationId}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました'
      window.webContents.send(`chat:error:${conversationId}`, errorMessage)
    } finally {
      activeStreams.delete(conversationId)
    }
  })

  // ストリーミングを中断
  ipcMain.handle('chat:abort', (_event, { conversationId }: { conversationId: string }) => {
    const controller = activeStreams.get(conversationId)
    if (controller) {
      controller.abort()
      activeStreams.delete(conversationId)
    }
  })

  // 設定を取得
  ipcMain.handle('store:get', (_event, { key }: { key: string }) => {
    return store.get(key)
  })

  // 設定を保存
  ipcMain.handle('store:set', (_event, { key, value }: { key: string; value: unknown }) => {
    if (key === 'anthropicApiKey') {
      agent = null
    }
    store.set(key, value)
  })

  // ファイルをバイナリで読み込む（PDF.js用）
  ipcMain.handle('fs:read-file', async (_event, { filePath }: { filePath: string }) => {
    const buffer = await readFile(filePath)
    return new Uint8Array(buffer)
  })
}

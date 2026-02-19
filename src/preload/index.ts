import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // PDF操作
  pdf: {
    openDialog: (): Promise<string | null> =>
      ipcRenderer.invoke('pdf:open-dialog'),

    processFile: (filePath: string): Promise<{
      success: boolean
      pageCount: number
      title: string
      error?: string
    }> => ipcRenderer.invoke('pdf:process', { filePath }),

    getPageText: (filePath: string, pageNum: number): Promise<string> =>
      ipcRenderer.invoke('pdf:get-page-text', { filePath, pageNum })
  },

  // チャット操作
  chat: {
    sendMessage: (
      message: string,
      filePath: string,
      conversationId: string,
      onChunk: (chunk: string) => void,
      onDone: () => void,
      onError: (error: string) => void
    ): () => void => {
      const channel = `chat:chunk:${conversationId}`
      const doneChannel = `chat:done:${conversationId}`
      const errorChannel = `chat:error:${conversationId}`

      ipcRenderer.on(channel, (_event, chunk: string) => onChunk(chunk))
      ipcRenderer.once(doneChannel, () => {
        ipcRenderer.removeAllListeners(channel)
        onDone()
      })
      ipcRenderer.once(errorChannel, (_event, error: string) => {
        ipcRenderer.removeAllListeners(channel)
        onError(error)
      })

      ipcRenderer.invoke('chat:send', { message, filePath, conversationId })

      // クリーンアップ関数を返す
      return () => {
        ipcRenderer.removeAllListeners(channel)
        ipcRenderer.removeAllListeners(doneChannel)
        ipcRenderer.removeAllListeners(errorChannel)
        ipcRenderer.invoke('chat:abort', { conversationId })
      }
    }
  },

  // 設定管理
  store: {
    get: (key: string): Promise<unknown> =>
      ipcRenderer.invoke('store:get', { key }),
    set: (key: string, value: unknown): Promise<void> =>
      ipcRenderer.invoke('store:set', { key, value })
  },

  // ファイルシステム
  fs: {
    readFile: (filePath: string): Promise<Uint8Array> =>
      ipcRenderer.invoke('fs:read-file', { filePath })
  }
})

// TypeScript型定義のためのグローバル宣言
declare global {
  interface Window {
    electronAPI: {
      pdf: {
        openDialog: () => Promise<string | null>
        processFile: (filePath: string) => Promise<{
          success: boolean
          pageCount: number
          title: string
          error?: string
        }>
        getPageText: (filePath: string, pageNum: number) => Promise<string>
      }
      chat: {
        sendMessage: (
          message: string,
          filePath: string,
          conversationId: string,
          onChunk: (chunk: string) => void,
          onDone: () => void,
          onError: (error: string) => void
        ) => () => void
      }
      store: {
        get: (key: string) => Promise<unknown>
        set: (key: string, value: unknown) => Promise<void>
      }
      fs: {
        readFile: (filePath: string) => Promise<Uint8Array>
      }
    }
  }
}

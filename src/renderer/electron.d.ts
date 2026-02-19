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

export {}

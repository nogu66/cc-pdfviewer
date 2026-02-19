import { useState, useCallback } from 'react'

export interface PDFState {
  filePath: string | null
  pageCount: number
  currentPage: number
  title: string
  isLoading: boolean
  error: string | null
}

export interface UsePDFReturn extends PDFState {
  openFile: () => Promise<void>
  goToPage: (page: number) => void
  handleDrop: (filePath: string) => Promise<void>
}

export function usePDF(): UsePDFReturn {
  const [state, setState] = useState<PDFState>({
    filePath: null,
    pageCount: 0,
    currentPage: 1,
    title: '',
    isLoading: false,
    error: null
  })

  const processFile = useCallback(async (filePath: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      filePath,
      isLoading: true,
      error: null,
      currentPage: 1
    }))

    try {
      const result = await window.electronAPI.pdf.processFile(filePath)

      if (result.success) {
        setState(prev => ({
          ...prev,
          pageCount: result.pageCount,
          title: result.title,
          isLoading: false
        }))
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'PDFの処理に失敗しました'
        }))
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDFの処理中にエラーが発生しました'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }))
    }
  }, [])

  const openFile = useCallback(async (): Promise<void> => {
    const filePath = await window.electronAPI.pdf.openDialog()
    if (filePath) {
      await processFile(filePath)
    }
  }, [processFile])

  const goToPage = useCallback((page: number): void => {
    setState(prev => {
      if (page < 1 || page > prev.pageCount) return prev
      return { ...prev, currentPage: page }
    })
  }, [])

  const handleDrop = useCallback(
    async (filePath: string): Promise<void> => {
      await processFile(filePath)
    },
    [processFile]
  )

  return {
    ...state,
    openFile,
    goToPage,
    handleDrop
  }
}

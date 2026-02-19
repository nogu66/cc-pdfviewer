import { useState, useEffect, useCallback } from 'react'

export interface RecentFile {
  filePath: string
  title: string
  openedAt: number
}

const STORAGE_KEY = 'recent-files'
const MAX_RECENT = 10

export interface UseRecentFilesReturn {
  recentFiles: RecentFile[]
  addRecentFile: (filePath: string, title: string) => void
  removeRecentFile: (filePath: string) => void
}

export function useRecentFiles(): UseRecentFilesReturn {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])

  useEffect(() => {
    window.electronAPI.store.get(STORAGE_KEY).then(data => {
      if (Array.isArray(data)) {
        setRecentFiles(data as RecentFile[])
      }
    })
  }, [])

  const addRecentFile = useCallback((filePath: string, title: string) => {
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.filePath !== filePath)
      const updated = [{ filePath, title, openedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT)
      window.electronAPI.store.set(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const removeRecentFile = useCallback((filePath: string) => {
    setRecentFiles(prev => {
      const updated = prev.filter(f => f.filePath !== filePath)
      window.electronAPI.store.set(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  return { recentFiles, addRecentFile, removeRecentFile }
}

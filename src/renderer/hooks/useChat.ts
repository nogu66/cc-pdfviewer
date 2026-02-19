import { useState, useCallback, useRef, useEffect } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  error?: string
  timestamp: number
}

export interface UseChatReturn {
  messages: ChatMessage[]
  inputValue: string
  isStreaming: boolean
  setInputValue: (value: string) => void
  sendMessage: (message: string) => Promise<void>
  abortStream: () => void
  newSession: () => void
}

const SESSION_PREFIX = 'chat-session:'

export function useChat(filePath: string | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortFnRef = useRef<(() => void) | null>(null)
  const conversationCountRef = useRef(0)
  const prevFilePathRef = useRef<string | null>(null)
  // 最新のmessages状態をrefで保持（filePath変更時の保存に使用）
  const messagesRef = useRef<ChatMessage[]>([])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const saveSession = useCallback((fp: string, msgs: ChatMessage[]) => {
    const toSave = msgs
      .filter(m => !m.isStreaming)
      .map(({ isStreaming: _s, ...m }) => ({ ...m }))
    window.electronAPI.store.set(SESSION_PREFIX + fp, toSave)
  }, [])

  const loadSession = useCallback(async (fp: string) => {
    try {
      const stored = await window.electronAPI.store.get(SESSION_PREFIX + fp)
      if (Array.isArray(stored) && stored.length > 0) {
        setMessages(stored as ChatMessage[])
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    }
  }, [])

  // filePath 変更: 旧セッション保存 → 新セッション読み込み
  useEffect(() => {
    const prev = prevFilePathRef.current
    prevFilePathRef.current = filePath

    if (filePath === prev) return

    // 旧セッションの後処理
    if (prev !== null) {
      if (abortFnRef.current) {
        abortFnRef.current()
        abortFnRef.current = null
      }
      setIsStreaming(false)
      saveSession(prev, messagesRef.current)
    }

    // 新セッション読み込み
    setInputValue('')
    if (filePath !== null) {
      loadSession(filePath)
    } else {
      setMessages([])
    }
  }, [filePath, saveSession, loadSession])

  const generateId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const sendMessage = useCallback(
    async (message: string): Promise<void> => {
      if (!filePath || isStreaming) return

      const userMessageId = generateId()
      const assistantMessageId = generateId()
      const conversationId = `conv-${++conversationCountRef.current}-${Date.now()}`

      setMessages(prev => [
        ...prev,
        { id: userMessageId, role: 'user', content: message, timestamp: Date.now() }
      ])

      setMessages(prev => [
        ...prev,
        { id: assistantMessageId, role: 'assistant', content: '', isStreaming: true, timestamp: Date.now() }
      ])

      setIsStreaming(true)

      let accumulatedContent = ''

      const cleanup = window.electronAPI.chat.sendMessage(
        message,
        filePath,
        conversationId,
        (chunk: string) => {
          accumulatedContent += chunk
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, content: accumulatedContent } : msg
            )
          )
        },
        () => {
          // 完了: ストリームフラグを外してセッション保存
          setMessages(prev => {
            const updated = prev.map(msg =>
              msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
            )
            const toSave = updated.filter(m => !m.isStreaming).map(({ isStreaming: _s, ...m }) => ({ ...m }))
            window.electronAPI.store.set(SESSION_PREFIX + filePath, toSave)
            return updated
          })
          setIsStreaming(false)
          abortFnRef.current = null
        },
        (error: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent || 'エラーが発生しました', isStreaming: false, error }
                : msg
            )
          )
          setIsStreaming(false)
          abortFnRef.current = null
        }
      )

      abortFnRef.current = cleanup
    },
    [filePath, isStreaming]
  )

  const abortStream = useCallback((): void => {
    if (abortFnRef.current) {
      abortFnRef.current()
      abortFnRef.current = null
      setIsStreaming(false)
      setMessages(prev =>
        prev.map(msg => (msg.isStreaming ? { ...msg, isStreaming: false } : msg))
      )
    }
  }, [])

  const newSession = useCallback((): void => {
    if (abortFnRef.current) {
      abortFnRef.current()
      abortFnRef.current = null
    }
    setIsStreaming(false)
    setMessages([])
    if (filePath) {
      window.electronAPI.store.set(SESSION_PREFIX + filePath, [])
    }
  }, [filePath])

  return {
    messages,
    inputValue,
    isStreaming,
    setInputValue,
    sendMessage,
    abortStream,
    newSession
  }
}

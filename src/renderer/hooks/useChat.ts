import { useState, useCallback, useRef } from 'react'

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
  clearMessages: () => void
}

export function useChat(filePath: string | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const abortFnRef = useRef<(() => void) | null>(null)
  const conversationCountRef = useRef(0)

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
        {
          id: userMessageId,
          role: 'user',
          content: message,
          timestamp: Date.now()
        }
      ])

      setMessages(prev => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          isStreaming: true,
          timestamp: Date.now()
        }
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
              msg.id === assistantMessageId
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        },
        () => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            )
          )
          setIsStreaming(false)
          abortFnRef.current = null
        },
        (error: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: accumulatedContent || 'エラーが発生しました',
                    isStreaming: false,
                    error
                  }
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
        prev.map(msg =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      )
    }
  }, [])

  const clearMessages = useCallback((): void => {
    if (isStreaming) {
      abortStream()
    }
    setMessages([])
  }, [isStreaming, abortStream])

  return {
    messages,
    inputValue,
    isStreaming,
    setInputValue,
    sendMessage,
    abortStream,
    clearMessages
  }
}

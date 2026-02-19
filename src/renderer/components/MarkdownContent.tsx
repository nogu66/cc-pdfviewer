import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Components } from 'react-markdown'
import type { CSSProperties } from 'react'

interface MarkdownContentProps {
  content: string
  onGoToPage?: (page: number) => void
}

// (p.X) または (p. X) パターンをマークダウンリンクに変換
function preprocessPageRefs(text: string): string {
  return text.replace(/\(p\.\s*(\d+)\)/g, '[p.$1](page://$1)')
}

export default function MarkdownContent({ content, onGoToPage }: MarkdownContentProps): React.ReactElement {
  const processed = preprocessPageRefs(content)

  const components: Components = {
    // コードブロックのシンタックスハイライト
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className ?? '')
      const isBlock = Boolean(match)
      if (isBlock) {
        return (
          <SyntaxHighlighter
            style={vscDarkPlus as Record<string, CSSProperties>}
            language={match![1]}
            PreTag="div"
            customStyle={{
              borderRadius: '8px',
              margin: '8px 0',
              fontSize: '12px',
              border: '1px solid var(--color-border)'
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },

    // page:// リンクをクリック可能な引用ボタンに変換
    a({ href, children }) {
      if (href?.startsWith('page://')) {
        const pageNum = parseInt(href.slice(7), 10)
        return (
          <button
            className="citation-btn"
            onClick={() => onGoToPage?.(pageNum)}
            title={`${pageNum}ページに移動`}
          >
            {children}
          </button>
        )
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    },

    // テーブル
    table({ children }) {
      return (
        <div style={{ overflowX: 'auto', margin: '8px 0' }}>
          <table className="md-table">{children}</table>
        </div>
      )
    }
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {processed}
    </ReactMarkdown>
  )
}

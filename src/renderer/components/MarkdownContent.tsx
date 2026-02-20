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

// [[p.X]] / (p.X) / （p.X） / (pg X) / 裸のp.X パターンをマークダウンリンクに変換
// 処理順序: 特殊→汎用（二重変換を防止）
function preprocessPageRefs(text: string): string {
  // 1. [[p.X]] 形式（最も特殊・推奨形式）
  let result = text.replace(/\[\[p\.(\d+)\]\]/g, '[$1](page://$1)')
  // 2. 半角括弧: (p.X) または (p. X)
  result = result.replace(/\(p\.\s*(\d+)\)/g, '[$1](page://$1)')
  // 3. 全角括弧: （p.X） または （p. X）
  result = result.replace(/（p\.\s*(\d+)）/g, '[$1](page://$1)')
  // 4. pg形式括弧: (pg X), (pg. X), (pg4)
  result = result.replace(/\(pg\.?\s*(\d+)\)/g, '[$1](page://$1)')
  // 5. 裸のp.X（URL・マークダウンリンク・既変換済みリンク内の誤マッチを防止）
  result = result.replace(/(?<![a-zA-Z\[\/])p\.(\d+)/g, '[$1](page://$1)')
  return result
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
            title={`ページ ${pageNum} に移動`}
          >
            {pageNum}
          </button>
        )
      }
      return (
        <a
          href={href}
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault()
            if (href) {
              window.open(href)
            }
          }}
        >
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
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      urlTransform={(url) => {
        // page:// は内部ページナビゲーション用プロトコルとして通過させる
        if (url.startsWith('page://')) return url
        // http/https は外部リンクとして通過させる
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        // それ以外（javascript: 等）はブロック
        return ''
      }}
    >
      {processed}
    </ReactMarkdown>
  )
}

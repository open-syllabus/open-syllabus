'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import styled from 'styled-components';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const MathWrapper = styled.span`
  .katex {
    font-size: 1.1em;
  }
  
  .katex-display {
    margin: 1em 0;
    overflow-x: auto;
    overflow-y: hidden;
    
    &::-webkit-scrollbar {
      height: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.colors.ui.backgroundLight};
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.colors.ui.border};
      border-radius: 4px;
      
      &:hover {
        background: ${({ theme }) => theme.colors.text.secondary};
      }
    }
  }
`;

interface MathRendererProps {
  math: string;
  display?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ math, display = false }) => {
  const [html, setHtml] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const rendered = katex.renderToString(math, {
        displayMode: display,
        throwOnError: false,
        errorColor: '#ff6b6b',
        strict: false,
        trust: true,
        macros: {
          "\\RR": "\\mathbb{R}",
          "\\NN": "\\mathbb{N}",
          "\\ZZ": "\\mathbb{Z}",
          "\\QQ": "\\mathbb{Q}",
          "\\CC": "\\mathbb{C}",
        }
      });
      setHtml(rendered);
      setError(null);
    } catch (err) {
      console.error('KaTeX rendering error:', err);
      setError(err instanceof Error ? err.message : 'Failed to render math');
    }
  }, [math, display]);

  if (error) {
    return <span style={{ color: '#ff6b6b' }}>Math error: {error}</span>;
  }

  return (
    <MathWrapper
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

interface MessageWithMathProps {
  content: string;
}

// Markdown components for ReactMarkdown
const markdownComponents: Components = {
    a: (props) => (<a {...props} target="_blank" rel="noopener noreferrer" />),
    input: (props) => { const { checked, ...rest } = props; return (<input type="checkbox" checked={!!checked} disabled={true} readOnly {...rest} /> ); },
    details: (props) => <details {...props} />,
    summary: (props) => <summary {...props} style={{ cursor: 'pointer', userSelect: 'none' }} />,
    code({ className, children, inline, ...props }: React.HTMLAttributes<HTMLElement> & { className?: string; children?: React.ReactNode; inline?: boolean; }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');
        const { style: _unused, ...restProps } = props;
        void _unused;
        return !inline ? (
            <pre className="code-block-wrapper" {...restProps}>
                <code className={match ? `language-${match[1]}` : undefined}>{codeString}</code>
            </pre>
        ) : (
            <code className={`inline-code ${className || ''}`} {...restProps}>{codeString}</code>
        );
    }
};

/**
 * Renders a message with LaTeX math expressions and Markdown
 * Supports both inline math $...$ and display math $$...$$ or \[...\]
 */
export const MessageWithMath: React.FC<MessageWithMathProps> = ({ content }) => {
  // Pattern to match LaTeX expressions
  // Matches: $...$ for inline, $$...$$ or \[...\] for display
  const mathPattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^\$\n]+\$)/g;
  
  const renderContent = () => {
    const parts = content.split(mathPattern);
    
    return parts.map((part, index) => {
      // Check if this part is a math expression
      if (part.match(mathPattern)) {
        // Display math ($$...$$ or \[...\])
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          return <MathRenderer key={index} math={math} display={true} />;
        } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const math = part.slice(2, -2).trim();
          return <MathRenderer key={index} math={math} display={true} />;
        } 
        // Inline math ($...$)
        else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          return <MathRenderer key={index} math={math} display={false} />;
        }
      }
      
      // Regular text - process with Markdown
      return (
        <ReactMarkdown
          key={index}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={markdownComponents}
        >
          {part}
        </ReactMarkdown>
      );
    });
  };

  return <>{renderContent()}</>;
};
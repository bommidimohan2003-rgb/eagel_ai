import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/chat/CodeBlock';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none text-text-primary text-sm md:text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const value = String(children).replace(/\n$/, '');

            if (!inline && match) {
              return <CodeBlock language={match[1]} value={value} />;
            } else if (!inline && value.includes('\n')) {
              return <CodeBlock language="text" value={value} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-surface-200 text-primary border border-border font-mono text-[13px]"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3.5 last:mb-0 leading-relaxed text-text-primary">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-xl md:text-2xl font-bold text-text-primary mt-6 mb-3 pb-1 border-b border-border">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg md:text-xl font-bold text-text-primary mt-5 mb-2.5">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-text-primary mt-4 mb-2">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1.5 mb-3.5 text-text-primary">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1.5 mb-3.5 text-text-primary">{children}</ol>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 py-1 my-3 bg-surface-100 rounded-r-xl text-text-secondary italic">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-border">
                <table className="w-full text-left text-xs border-collapse">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return <th className="bg-surface-200 px-3 py-2 border-b border-border font-semibold text-text-primary">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2 border-b border-border text-text-secondary">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

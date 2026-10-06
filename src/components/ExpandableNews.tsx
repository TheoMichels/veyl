import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, Loader2, X } from 'lucide-react';

function extractText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (Array.isArray(node.children)) return node.children.map(extractText).join('');
  return '';
}

function isPureLink(node: any): boolean {
  if (!node || !Array.isArray(node.children)) return false;
  const elements = node.children.filter((c: any) => 
    c.type === 'element' || (c.type === 'text' && c.value && c.value.trim() !== '')
  );
  if (elements.length === 1) {
    if (elements[0].tagName === 'a') return true;
    if (elements[0].tagName === 'p' && Array.isArray(elements[0].children)) {
      const pElements = elements[0].children.filter((c: any) => 
        c.type === 'element' || (c.type === 'text' && c.value && c.value.trim() !== '')
      );
      return pElements.length === 1 && pElements[0].tagName === 'a';
    }
  }
  return false;
}

function appendButtonToChildren(children: React.ReactNode, button: React.ReactNode): React.ReactNode {
  const childArray = React.Children.toArray(children);
  for (let i = childArray.length - 1; i >= 0; i--) {
    const child = childArray[i];
    if (React.isValidElement(child) && child.type === 'p') {
      const pProps = child.props as any;
      const updatedP = React.cloneElement(
        child,
        { ...pProps, key: child.key || 'p-with-btn' },
        pProps.children,
        ' ',
        button
      );
      childArray[i] = updatedP;
      return childArray;
    }
  }
  return [...childArray, ' ', button];
}

interface ExpandedDetailsCardProps {
  isLoading: boolean;
  error: string | null;
  content: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function ExpandedDetailsCard({ isLoading, error, content, isOpen, onClose }: ExpandedDetailsCardProps) {
  if (!isOpen && !isLoading && !error) return null;

  return (
    <div className="mt-3.5 mb-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 border-l-4 border-l-indigo-500 dark:border-l-indigo-400 bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/20 dark:from-indigo-950/25 dark:via-neutral-900/40 dark:to-neutral-900/20 p-4 sm:p-5 shadow-sm text-sm not-prose">
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-indigo-100/70 dark:border-indigo-800/30">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-100 dark:fill-indigo-900/50" />
          <span>Approfondissement IA</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 px-1.5 py-0.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Fermer"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Fermer</span>
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2.5 py-2 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Recherche et synthèse en cours...</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {content && isOpen && (
        <div className="text-neutral-700 dark:text-neutral-300 space-y-2">
          <ReactMarkdown
            components={{
              h1: ({ ...props }) => <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-3.5 first:mt-0 mb-1.5" {...props} />,
              h2: ({ ...props }) => <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-3.5 first:mt-0 mb-1.5" {...props} />,
              h3: ({ ...props }) => <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-3.5 first:mt-0 mb-1.5" {...props} />,
              h4: ({ ...props }) => <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-3.5 first:mt-0 mb-1.5" {...props} />,
              p: ({ ...props }) => <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 my-2 first:mt-0 last:mb-0" {...props} />,
              ul: ({ ...props }) => <ul className="list-disc pl-5 my-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300" {...props} />,
              ol: ({ ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1 text-sm text-neutral-700 dark:text-neutral-300" {...props} />,
              li: ({ ...props }) => <li className="my-0.5 leading-relaxed" {...props} />,
              strong: ({ ...props }) => <strong className="font-semibold text-neutral-900 dark:text-neutral-100" {...props} />,
              a: ({ ...props }) => (
                <a
                  className="text-indigo-600 dark:text-indigo-400 underline hover:opacity-80 transition-opacity font-medium"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              blockquote: ({ ...props }) => (
                <blockquote
                  className="border-l-2 border-indigo-300 dark:border-indigo-700 pl-3 italic my-2 text-neutral-600 dark:text-neutral-400"
                  {...props}
                />
              ),
              code: ({ ...props }) => (
                <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-xs font-mono text-neutral-800 dark:text-neutral-200" {...props} />
              )
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

interface ExpandableListItemProps {
  children: React.ReactNode;
  node?: any;
  sectionTitle?: string;
  isSources?: boolean;
}

function ExpandableListItem({ children, node, sectionTitle, isSources }: ExpandableListItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLink = isPureLink(node);
  const shouldShowButton = !isSources && !isLink;

  const handleGoFurther = async () => {
    if (expandedContent) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const textToSearch = extractText(node);
      const queryText = sectionTitle 
        ? `Sujet : ${sectionTitle}\nPoint précis : ${textToSearch}`
        : textToSearch;

      const response = await fetch('/api/go-further', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: queryText })
      });
      if (!response.ok) throw new Error("Erreur lors de l'appel à l'API");
      const data = await response.json();
      setExpandedContent(data.content);
      setIsExpanded(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const actionButton = shouldShowButton ? (
    <button
      key="expand-btn"
      type="button"
      onClick={handleGoFurther}
      disabled={isLoading}
      title={isLoading ? 'Recherche en cours...' : (isExpanded ? 'Masquer' : 'Aller plus loin')}
      aria-label={isLoading ? 'Recherche en cours...' : (isExpanded ? 'Masquer' : 'Aller plus loin')}
      className="inline-flex items-center justify-center p-1 sm:p-1.5 ml-1.5 rounded-md bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-indigo-600 dark:text-neutral-500 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 align-middle not-prose"
    >
      <Sparkles className={`w-3.5 h-3.5 ${isExpanded ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950/50' : ''}`} />
    </button>
  ) : null;

  return (
    <li className="my-2.5">
      {actionButton ? appendButtonToChildren(children, actionButton) : children}

      <ExpandedDetailsCard
        isLoading={isLoading}
        error={error}
        content={expandedContent}
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
      />
    </li>
  );
}

export default function ExpandableNews({ chunk }: { chunk: string }) {
  const [isChunkLoading, setIsChunkLoading] = useState(false);
  const [chunkExpandedContent, setChunkExpandedContent] = useState<string | null>(null);
  const [isChunkExpanded, setIsChunkExpanded] = useState(false);
  const [chunkError, setChunkError] = useState<string | null>(null);

  // If the chunk doesn't start with a heading, just render it normally (e.g. intro or sources)
  const isHeadingBlock = /^#{2,3}\s/.test(chunk.trim());
  const isSourcesSection = /^(?:#{2,3}\s+)?sources/i.test(chunk.trim());
  const isNewsBlock = isHeadingBlock && !isSourcesSection;
  const hasBulletPoints = /^\s*[-*+]\s+/m.test(chunk);

  const titleMatch = chunk.match(/^#{2,3}\s+(.+)$/m);
  const sectionTitle = titleMatch ? titleMatch[1].trim() : '';

  if (!isNewsBlock) {
    return (
      <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-a:text-indigo-600 dark:prose-a:text-indigo-400 mb-6">
        <ReactMarkdown
          components={{
            a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
          }}
        >
          {chunk}
        </ReactMarkdown>
      </div>
    );
  }

  // Fallback handler if the section doesn't contain bullet points
  const handleChunkGoFurther = async () => {
    if (chunkExpandedContent) {
      setIsChunkExpanded(!isChunkExpanded);
      return;
    }
    setIsChunkLoading(true);
    setChunkError(null);
    try {
      const response = await fetch('/api/go-further', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk })
      });
      if (!response.ok) throw new Error("Erreur lors de l'appel à l'API");
      const data = await response.json();
      setChunkExpandedContent(data.content);
      setIsChunkExpanded(true);
    } catch (err: unknown) {
      setChunkError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsChunkLoading(false);
    }
  };

  const renderHeading = (Tag: 'h2' | 'h3', children: React.ReactNode, props: any) => {
    if (hasBulletPoints) {
      return <Tag {...props}>{children}</Tag>;
    }
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 mb-4">
        <Tag className="m-0" {...props}>{children}</Tag>
        <button 
          type="button"
          onClick={handleChunkGoFurther}
          disabled={isChunkLoading}
          title={isChunkLoading ? 'Recherche en cours...' : (isChunkExpanded ? 'Masquer' : 'Aller plus loin')}
          aria-label={isChunkLoading ? 'Recherche en cours...' : (isChunkExpanded ? 'Masquer' : 'Aller plus loin')}
          className="shrink-0 inline-flex items-center justify-center p-1.5 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 rounded-md transition-colors disabled:opacity-50 not-prose"
        >
          <Sparkles className={`w-4 h-4 ${isChunkExpanded ? 'text-indigo-600 dark:text-indigo-400 fill-indigo-100 dark:fill-indigo-950/50' : ''}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="mb-8 group relative">
      <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
        <ReactMarkdown
          components={{
            h2: ({ children, ...props }) => renderHeading('h2', children, props),
            h3: ({ children, ...props }) => renderHeading('h3', children, props),
            li: ({ children, node, ...props }) => (
              <ExpandableListItem
                node={node}
                sectionTitle={sectionTitle}
                isSources={isSourcesSection}
                {...props}
              >
                {children}
              </ExpandableListItem>
            ),
            a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
          }}
        >
          {chunk}
        </ReactMarkdown>
      </div>

      {!hasBulletPoints && (
        <ExpandedDetailsCard
          isLoading={isChunkLoading}
          error={chunkError}
          content={chunkExpandedContent}
          isOpen={isChunkExpanded}
          onClose={() => setIsChunkExpanded(false)}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function ExpandableNews({ chunk }: { chunk: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the chunk doesn't start with a heading, just render it normally (e.g. intro or sources)
  const isNewsBlock = /^###\s/.test(chunk.trim());

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

  // To put the button next to the title, we can either use a custom h3 component for this specific chunk,
  // or we can parse the title out. Using a custom component is easiest.
  
  const handleGoFurther = async () => {
    if (expandedContent) {
      setIsExpanded(!isExpanded);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/go-further', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chunk })
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

  return (
    <div className="mb-8 group relative">
      <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
        <ReactMarkdown
          components={{
            h3: ({ children, ...props }) => (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 mb-4">
                <h3 className="m-0" {...props}>{children}</h3>
                <button 
                  onClick={handleGoFurther}
                  disabled={isLoading}
                  className="shrink-0 text-sm px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Recherche...' : (expandedContent ? (isExpanded ? 'Masquer' : 'Voir plus') : 'Aller plus loin')}
                </button>
              </div>
            ),
            a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
          }}
        >
          {chunk}
        </ReactMarkdown>
      </div>
      
      {(isExpanded || error || isLoading) && (
        <div className="mt-4 p-4 rounded-lg bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 text-sm">
          {isLoading && <p className="text-indigo-600 dark:text-indigo-400 animate-pulse m-0">Recherche d&apos;informations supplémentaires en cours...</p>}
          {error && <p className="text-red-500 m-0">{error}</p>}
          {(expandedContent && isExpanded) && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300">
              <ReactMarkdown>{expandedContent}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

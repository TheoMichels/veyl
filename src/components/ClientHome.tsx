"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, RefreshCcw, Calendar, PanelLeft, PanelLeftClose, ChevronDown, ChevronRight, X, Cpu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

type Digest = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
};

type DayGroup = {
  dateStr: string;
  displayDate: string;
  iaDigest: Digest | null;
  luxDigest: Digest | null;
  techDigest: Digest | null;
};

export default function ClientHome({
  groupedDigests
}: {
  groupedDigests: DayGroup[];
}) {
  const [activeTab, setActiveTab] = useState<'ia' | 'lux' | 'tech'>('ia');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // States for toggle
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const [resIa, resLux, resTech] = await Promise.all([
        fetch('/api/cron/ia'),
        fetch('/api/cron/luxembourg'),
        fetch('/api/cron/tech')
      ]);

      if (!resIa.ok || !resLux.ok || !resTech.ok) {
        throw new Error('Une erreur est survenue lors de la génération de l\'une des veilles.');
      }
      setSelectedDate(null);
      router.refresh();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredDigests = React.useMemo(() => {
    return groupedDigests.filter(group => {
      if (activeTab === 'ia') return group.iaDigest !== null;
      if (activeTab === 'lux') return group.luxDigest !== null;
      if (activeTab === 'tech') return group.techDigest !== null;
      return false;
    });
  }, [groupedDigests, activeTab]);

  useEffect(() => {
    if (filteredDigests.length > 0) {
      const isValid = filteredDigests.some(g => g.dateStr === selectedDate);
      if (!isValid) {
        setSelectedDate(filteredDigests[0].dateStr);
      }
    } else if (selectedDate !== null) {
      setSelectedDate(null);
    }
  }, [filteredDigests, selectedDate]);

  const activeGroup = groupedDigests.find(g => g.dateStr === selectedDate);
  const currentIADigest = activeGroup?.iaDigest;
  const currentLuxDigest = activeGroup?.luxDigest;

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full w-full gap-8 relative">
      {/* Sidebar for dates */}
      <aside 
        className={`w-full md:w-64 flex-shrink-0 flex-col border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 pb-6 md:pb-0 md:pr-6 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'flex md:flex' : 'flex md:hidden'
        }`}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Votre veille</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Les synthèses par jour.</p>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mb-6 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <RefreshCcw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Génération...' : 'Générer la veille du jour'}
        </button>

        {/* Mobile Accordion Trigger - ONLY visible on mobile */}
        <div className="block md:hidden">
          <button 
            onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg font-medium text-neutral-900 dark:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>{activeGroup?.displayDate || 'Sélectionner une date'}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform ${isMobileHistoryOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* History List - Collapsible on mobile, always visible on desktop IF sidebar is open */}
        <div className={`flex-1 overflow-y-auto min-h-0 space-y-2 mt-4 md:mt-0 ${isMobileHistoryOpen ? 'block' : 'hidden md:block'}`}>
          <h2 className="hidden md:flex text-sm font-semibold text-neutral-900 dark:text-white mb-3 items-center gap-2">
            <Calendar className="w-4 h-4" />
            Historique
          </h2>
          {filteredDigests.length === 0 ? (
            <p className="text-sm text-neutral-500">Aucune veille disponible.</p>
          ) : (
            filteredDigests.map((group) => (
              <button
                key={group.dateStr}
                onClick={() => {
                  setSelectedDate(group.dateStr);
                  setIsMobileHistoryOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedDate === group.dateStr
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {group.displayDate}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-full space-y-6">
        <div className="flex items-center gap-4 w-full">
          {/* Desktop Sidebar Toggle Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex items-center justify-center p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={isSidebarOpen ? "Masquer le panneau latéral" : "Afficher le panneau latéral"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>

          <div className="flex flex-wrap md:flex-nowrap w-full md:w-fit gap-1 md:gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
            <button
              onClick={() => setActiveTab('ia')}
              className={`flex-1 basis-[calc(50%-4px)] md:basis-auto md:flex-none min-w-0 flex justify-center md:justify-start items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-md font-medium text-xs md:text-sm transition-colors ${
                activeTab === 'ia' 
                  ? 'bg-white dark:bg-neutral-950 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span className="truncate md:overflow-visible md:whitespace-normal">Intelligence Artificielle</span>
            </button>
            <button
              onClick={() => setActiveTab('lux')}
              className={`flex-1 basis-[calc(50%-4px)] md:basis-auto md:flex-none min-w-0 flex justify-center md:justify-start items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-md font-medium text-xs md:text-sm transition-colors ${
                activeTab === 'lux' 
                  ? 'bg-white dark:bg-neutral-950 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <span className="text-base leading-none flex-shrink-0">🇱🇺</span>
              <span className="truncate md:overflow-visible md:whitespace-normal">Marché IT Luxembourg</span>
            </button>
            <button
              onClick={() => setActiveTab('tech')}
              className={`flex-1 basis-[calc(50%-4px)] md:basis-auto md:flex-none min-w-0 flex justify-center md:justify-start items-center gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-md font-medium text-xs md:text-sm transition-colors ${
                activeTab === 'tech' 
                  ? 'bg-white dark:bg-neutral-950 text-green-600 dark:text-green-400 shadow-sm' 
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              <Cpu className="w-4 h-4 flex-shrink-0" />
              <span className="truncate md:overflow-visible md:whitespace-normal">Tech & Hardware</span>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm flex flex-col">
          {activeTab === 'ia' ? (
            <div className="flex flex-col h-full">
              <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                  <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  Actualité IA {activeGroup ? `- ${activeGroup.displayDate}` : ''}
                </h2>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {!currentIADigest ? (
                  <p className="text-neutral-500 italic">Aucune synthèse IA générée pour cette date.</p>
                ) : (
                  <div className="max-w-full">
                    <h3 className="font-semibold text-xl sm:text-2xl mb-2 text-neutral-900 dark:text-white">{currentIADigest.title}</h3>
                    <p className="text-sm text-neutral-500 mb-8">
                      Généré {formatDistanceToNow(new Date(currentIADigest.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                    <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                      >
                        {currentIADigest.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'lux' ? (
            <div className="flex flex-col h-full">
              <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                  <span className="text-xl leading-none">🇱🇺</span> 
                  Marché IT Luxembourg {activeGroup ? `- ${activeGroup.displayDate}` : ''}
                </h2>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {!currentLuxDigest ? (
                  <p className="text-neutral-500 italic">Aucune synthèse Luxembourg générée pour cette date.</p>
                ) : (
                  <div className="max-w-full">
                    <h3 className="font-semibold text-xl sm:text-2xl mb-2 text-neutral-900 dark:text-white">{currentLuxDigest.title}</h3>
                    <p className="text-sm text-neutral-500 mb-8">
                      Généré {formatDistanceToNow(new Date(currentLuxDigest.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                    <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-a:text-indigo-600 dark:prose-a:text-indigo-400">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                      >
                        {currentLuxDigest.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'tech' ? (
            <div className="flex flex-col h-full">
              <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-white">
                  <Cpu className="w-5 h-5 text-green-500 dark:text-green-400" />
                  Actualité Tech {activeGroup ? `- ${activeGroup.displayDate}` : ''}
                </h2>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                {!activeGroup?.techDigest ? (
                  <p className="text-neutral-500 italic">Aucune synthèse Tech générée pour cette date.</p>
                ) : (
                  <div className="max-w-full">
                    <h3 className="font-semibold text-xl sm:text-2xl mb-2 text-neutral-900 dark:text-white">{activeGroup.techDigest.title}</h3>
                    <p className="text-sm text-neutral-500 mb-8">
                      Généré {formatDistanceToNow(new Date(activeGroup.techDigest.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                    <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-a:text-green-600 dark:prose-a:text-green-400">
                      <ReactMarkdown
                        components={{
                          a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                      >
                        {activeGroup.techDigest.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

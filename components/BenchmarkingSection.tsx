import React from 'react';
import { CompetitorData, CompetitorInfo, GroundingChunk } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface BenchmarkingSectionProps {
  competitorData: CompetitorData | null | undefined;
  onNavigateToAnalyzer: (ticker: string) => void;
  currentTicker: string; // To avoid showing the current stock as a competitor of itself
}

const ExternalLinkIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.665l3-3z" />
    <path d="M8.603 17.397a.75.75 0 00-.977 1.138 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a2.5 2.5 0 013.536 3.536l-3 3a2.5 2.5 0 01-3.7-3.379z" />
  </svg>
);


export const BenchmarkingSection: React.FC<BenchmarkingSectionProps> = ({ competitorData, onNavigateToAnalyzer, currentTicker }) => {
  if (typeof competitorData === 'undefined') { // Still loading or not yet fetched
    return (
      <section aria-labelledby="benchmarking-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg">
        <h2 id="benchmarking-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
          Benchmarking: Principali Concorrenti
        </h2>
        <hr className="border-slate-700 my-4" />
        <LoadingSpinner size="h-6 w-6"><p className="ml-2 text-slate-300">Ricerca concorrenti in corso...</p></LoadingSpinner>
      </section>
    );
  }

  if (!competitorData || !competitorData.competitors || competitorData.competitors.length === 0) {
    return (
      <section aria-labelledby="benchmarking-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg">
        <h2 id="benchmarking-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
          Benchmarking: Principali Concorrenti
        </h2>
        <hr className="border-slate-700 my-4" />
        <p className="text-slate-400">Nessun dato sui concorrenti principali trovato o fornito dall'AI.</p>
         {competitorData?.searchSources && competitorData.searchSources.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-1">Fonti consultate (Google Search):</h3>
            <ul className="list-disc list-inside text-xs space-y-1">
              {competitorData.searchSources.map((source, index) =>
                source.web?.uri ? (
                  <li key={index}>
                    <a
                      href={source.web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 hover:underline break-all"
                      title={source.web.title || source.web.uri}
                    >
                      {source.web.title || source.web.uri} <ExternalLinkIcon className="inline w-3 h-3 ml-0.5"/>
                    </a>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}
      </section>
    );
  }

  const filteredCompetitors = competitorData.competitors.filter(
    comp => comp.ticker && comp.ticker.toUpperCase() !== currentTicker.toUpperCase()
  );

  return (
    <section aria-labelledby="benchmarking-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg">
      <h2 id="benchmarking-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
        Benchmarking: <span className="text-cyan-400">Principali Concorrenti</span>
      </h2>
      <p className="text-sm text-slate-400 mb-6">Identificati tramite AI e Google Search. Clicca su un ticker per analizzarlo.</p>
      <hr className="border-slate-700 my-4" />

      {filteredCompetitors.length === 0 ? (
         <p className="text-slate-400">Nessun concorrente distinto dall'azienda corrente è stato identificato.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompetitors.map((competitor: CompetitorInfo, index: number) => (
            <div key={index} className="p-3 bg-slate-700/50 rounded-lg border border-slate-600/70">
              <h3 className="text-md font-semibold text-sky-200 truncate" title={competitor.name}>
                {competitor.name || 'Nome non disponibile'}
              </h3>
              {competitor.ticker ? (
                <button
                  onClick={() => onNavigateToAnalyzer(competitor.ticker)}
                  className="mt-1 text-sm text-cyan-400 hover:text-cyan-300 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1 py-0.5 transition-colors"
                  title={`Analizza ${competitor.ticker}`}
                >
                  Ticker: {competitor.ticker}
                </button>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Ticker non disponibile</p>
              )}
            </div>
          ))}
        </div>
      )}

      {competitorData.searchSources && competitorData.searchSources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Fonti Dati Concorrenti (Google Search):</h3>
          <ul className="space-y-1 text-xs">
            {competitorData.searchSources.map((source: GroundingChunk, index: number) =>
              source.web?.uri ? (
                <li key={index} className="flex items-start">
                  <ExternalLinkIcon className="w-3 h-3 mr-1.5 mt-0.5 text-slate-500 flex-shrink-0" />
                  <a
                    href={source.web.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-500 hover:text-cyan-400 hover:underline break-all"
                    title={source.web.title || source.web.uri}
                  >
                    {source.web.title || source.web.uri}
                  </a>
                </li>
              ) : null
            )}
          </ul>
        </div>
      )}
    </section>
  );
};
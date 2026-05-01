
import React, { useState, useEffect, useCallback } from 'react';
import { ScreenerResultEntry, AiAnalysisEntry, AnalysisData, StockMetrics } from '../types';
import { KeyMetricsGrid } from '../components/KeyMetricsGrid';
import { DecisionMatrix } from '../components/DecisionMatrix';
import { LoadingSpinner } from '../components/LoadingSpinner';

type ActiveTab = 'screener' | 'ai';

interface DatabaseViewProps {
  onNavigateToAnalyzer: (ticker: string) => void;
}

const formatValueForDisplay = (value: number | string | undefined | null, digits: number = 2): string => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  if (typeof value === 'number') return value.toFixed(digits);
  return String(value);
};

// Icon components
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
  </svg>
);
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l.823-.823a.475.475 0 01.673 0l.813.813a.475.475 0 00.673 0l.823-.823a.475.475 0 01.673 0l.813.813a.475.475 0 00.673 0l.823-.823a.475.475 0 01.673 0l.813.813a.475.475 0 00.673 0l.823-.823a.475.475 0 01.673 0l.813.813a.475.475 0 00.673 0l.823-.823a.475.475 0 01.673 0l.823.823a1.651 1.651 0 010 1.18l-.823.823a.475.475 0 01-.673 0l-.813-.813a.475.475 0 00-.673 0l-.823.823a.475.475 0 01-.673 0l-.813-.813a.475.475 0 00-.673 0l-.823.823a.475.475 0 01-.673 0l-.813-.813a.475.475 0 00-.673 0l-.823.823a.475.475 0 01-.673 0L.664 10.59zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
  </svg>
);

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export const DatabaseView: React.FC<DatabaseViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('screener');
  const [screenerResults, setScreenerResults] = useState<ScreenerResultEntry[]>([]);
  const [aiAnalyses, setAiAnalyses] = useState<AiAnalysisEntry[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      if (activeTab === 'screener') {
        const savedScreenerJSON = localStorage.getItem('screenerSavedResults');
        setScreenerResults(savedScreenerJSON ? JSON.parse(savedScreenerJSON) : []);
      } else {
        const savedAiJSON = localStorage.getItem('aiSavedAnalyses');
        const parsedAiAnalyses: AiAnalysisEntry[] = savedAiJSON ? JSON.parse(savedAiJSON) : [];
        parsedAiAnalyses.sort((a, b) => {
            const mosA = typeof a.analysis.metrics.marginOfSafety === 'number' ? a.analysis.metrics.marginOfSafety : -Infinity;
            const mosB = typeof b.analysis.metrics.marginOfSafety === 'number' ? b.analysis.metrics.marginOfSafety : -Infinity;
            return mosB - mosA;
        });
        setAiAnalyses(parsedAiAnalyses);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati da localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]); // activeTab change will trigger loadData due to being in its dependency array

  useEffect(() => { // Effect to reload data when tab changes
    loadData();
  }, [activeTab, loadData]);


  const handleClearData = (type: ActiveTab) => {
    if (window.confirm(`Sei sicuro di voler cancellare tutti i dati salvati per "${type === 'screener' ? 'Risultati Stock Screener' : 'Analisi AI'}"?`)) {
      localStorage.removeItem(type === 'screener' ? 'screenerSavedResults' : 'aiSavedAnalyses');
      loadData(); 
    }
  };

  const handleViewDetails = (analysis: AnalysisData) => {
    setSelectedAnalysis(analysis);
    setIsModalOpen(true);
  };
  
  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return 'Data non valida';
    }
  };

  const renderScreenerResults = () => (
    <div className="space-y-4">
      <button 
        onClick={() => handleClearData('screener')}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50"
        disabled={screenerResults.length === 0}
      >
        Svuota Risultati Screener
      </button>
      {screenerResults.length === 0 ? (
        <p className="text-slate-400">Nessun risultato dello screener salvato.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-slate-700">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                {['Ticker', 'Nome', 'Settore', 'ROE (%)', 'P/E', 'P/B', 'D/E', 'Data', 'Nel Basket'].map(header => (
                  <th key={header} scope="col" className="px-3 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {screenerResults.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry, index) => {
                const { stockMetrics: sm, appliedCriteriaDetails: acd, passStatus: ps, isInBasket, timestamp } = entry;
                const metricDisplay = (value: number | string | undefined | null, criterion: number | undefined | null, passed: boolean, lowerIsBetter = false) => {
                    const displayValue = formatValueForDisplay(value);
                    const displayCriterion = criterion !== null && typeof criterion !== 'undefined' ? formatValueForDisplay(criterion) : 'N/A';
                    const criterionPrefix = lowerIsBetter ? '<=' : '>=';
                    return (
                        <div className={`p-1 rounded-md text-xs ${passed ? 'bg-green-700/30 text-green-300' : 'bg-red-700/30 text-red-300'}`}>
                           {displayValue} <span className="text-slate-400 text-[10px]">({criterion !== null ? criterionPrefix : ''}{displayCriterion})</span>
                        </div>
                    );
                };
                return (
                  <tr key={sm.ticker + timestamp + index} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => props.onNavigateToAnalyzer(sm.ticker)}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1 py-0.5"
                        title={`Analizza ${sm.ticker} in dettaglio`}
                      >
                        {sm.ticker}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">{sm.shortName || sm.companyName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">{sm.sector || 'N/A'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{metricDisplay(sm.roe, acd.minRoe, ps.roe)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{metricDisplay(sm.trailingPE, acd.maxPE, ps.pe, true)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{metricDisplay(sm.priceToBook, acd.maxPB, ps.pb, true)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">{metricDisplay(sm.debtToEquity, acd.maxDE, ps.de, true)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">{formatDate(timestamp)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {isInBasket ? <CheckCircleIcon className="w-5 h-5 text-green-400" /> : <XCircleIcon className="w-5 h-5 text-red-400" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAiAnalyses = () => (
    <div className="space-y-4">
      <button 
        onClick={() => handleClearData('ai')}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50"
        disabled={aiAnalyses.length === 0}
      >
        Svuota Analisi AI
      </button>
      {aiAnalyses.length === 0 ? (
        <p className="text-slate-400">Nessuna analisi AI salvata.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md border border-slate-700">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                {['Ticker', 'Nome Compagnia', 'Verdetto AI', 'Margine Sicurezza (%)', 'Data Salvataggio', 'Azioni'].map(header => (
                  <th key={header} scope="col" className="px-3 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {aiAnalyses.map((entry, index) => (
                <tr key={entry.analysis.metrics.ticker + entry.timestamp + index} className="hover:bg-slate-700/40 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-100">{entry.analysis.metrics.ticker}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300">{entry.analysis.metrics.companyName}</td>
                  <td className="px-3 py-2 text-sm text-slate-300 max-w-xs truncate" title={entry.analysis.aiReport.verdetto}>{entry.analysis.aiReport.verdetto}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-300 text-right">
                    {formatValueForDisplay(entry.analysis.metrics.marginOfSafety, 1)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">{formatDate(entry.timestamp)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleViewDetails(entry.analysis)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center"
                      title="Vedi dettagli analisi"
                    >
                      <EyeIcon className="w-5 h-5 mr-1"/> Dettagli
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-800 rounded-xl shadow-lg text-center">
        <LoadingSpinner />
        <p className="text-slate-300 mt-2">Caricamento dati dal database...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg text-slate-100">
      <header className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Database Analisi Salvate
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          Visualizza i risultati salvati dallo Stock Screener e le Analisi AI generate.
        </p>
      </header>

      <div className="mb-6 flex space-x-1 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('screener')}
          className={`px-3 py-2.5 sm:px-4 font-medium text-xs sm:text-sm rounded-t-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-50
            ${activeTab === 'screener' 
              ? 'border-b-2 border-cyan-400 text-cyan-300 bg-slate-700/40 focus:ring-cyan-400' 
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-700/20 focus:ring-slate-500'
            }`}
          aria-current={activeTab === 'screener' ? 'page' : undefined}
        >
          Risultati Stock Screener
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-3 py-2.5 sm:px-4 font-medium text-xs sm:text-sm rounded-t-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-opacity-50
            ${activeTab === 'ai' 
              ? 'border-b-2 border-cyan-400 text-cyan-300 bg-slate-700/40 focus:ring-cyan-400' 
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-700/20 focus:ring-slate-500'
            }`}
          aria-current={activeTab === 'ai' ? 'page' : undefined}
        >
          Analisi AI
        </button>
      </div>

      {activeTab === 'screener' ? renderScreenerResults() : renderAiAnalyses()}

      {isModalOpen && selectedAnalysis && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-analysis-modal-title"
        >
          <div 
            className="bg-slate-800 text-slate-200 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800/90 backdrop-blur-sm px-6 py-4 border-b border-slate-700 flex justify-between items-center z-10">
              <h2 id="ai-analysis-modal-title" className="text-xl sm:text-2xl font-bold text-cyan-400">
                Dettaglio Analisi AI: <span className="text-white">{selectedAnalysis.metrics.companyName} ({selectedAnalysis.metrics.ticker})</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
                aria-label="Chiudi modale"
              >
                <CloseIcon className="w-7 h-7" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <KeyMetricsGrid metrics={selectedAnalysis.metrics} />
              <hr className="border-slate-700" />
              <DecisionMatrix report={selectedAnalysis.aiReport} />
            </div>
            <div className="sticky bottom-0 bg-slate-800/90 backdrop-blur-sm px-6 py-3 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-colors duration-150"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

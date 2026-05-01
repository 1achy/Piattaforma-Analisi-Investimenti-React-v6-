
import React, { useState, useCallback, useEffect } from 'react';
import { StockMetrics, ScreenerCriteria, SectorAverageMetrics, ScreenerResultEntry, ScreenerPassStatus, AppliedCriteriaDetails } from '../types';
import { fetchStockData } from '../services/stockDataService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { parseSectorAveragesCSV } from '../utils/csvParser';

const formatMetricForTable = (value: number | string | undefined | null, digits: number = 2): string => {
  if (value === null || typeof value === 'undefined') return 'N/A';
  if (typeof value === 'number') {
    return value.toFixed(digits);
  }
  return String(value);
};

const getNumericMetricOrNull = (value: number | string | undefined | null): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    if (value.trim().toUpperCase() === 'N/A') {
      return null;
    }
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  return null; 
};

interface CurrentStockProcessingInfo {
  ticker: string;
  sector: string | null;
  appliedCriteria: ScreenerCriteria;
  criteriaSource: AppliedCriteriaDetails['criteriaSource'];
}


export const StockScreenerView: React.FC = () => {
  const [userCriteria, setUserCriteria] = useState<ScreenerCriteria>({ 
    minRoe: 15,    
    maxPE: 15.0,
    maxPB: 1.5,
    maxDE: 0.5,    
  });
  const [tickerInput, setTickerInput] = useState<string>('ENI.MI, RACE.MI, STM.MI, ISP.MI, UCG.MI, A2A.MI, AMP.MI, TIT.MI, SRL.MI, PRY.MI, STLAM.MI, MB.MI, TEN.MI, SPM.MI, MONC.MI, G.MI, ENEL.MI, HER.MI, BGN.MI, CNHI.MI, DIA.MI, ERG.MI, FNC.MI, IP.MI, IG.MI, LDO.MI, NEXI.MI, PST.MI, REC.MI, SGR.MI, TRN.MI, UNI.MI, BAMI.MI, BPE.MI, BMPS.MI, FBK.MI, MED.MI, AZM.MI, CPR.MI, BZU.MI');
  const [candidateStocks, setCandidateStocks] = useState<StockMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  
  const [sectorAverages, setSectorAverages] = useState<SectorAverageMetrics[]>([]);
  const [currentStockProcessingInfo, setCurrentStockProcessingInfo] = useState<CurrentStockProcessingInfo | null>(null);
  
  const [useDynamicCriteria, setUseDynamicCriteria] = useState<boolean>(true);

  useEffect(() => {
    const loadSectorData = async () => {
      const data = await parseSectorAveragesCSV('/data/sector_average_data.csv');
      setSectorAverages(data);
      if (data.length === 0 && useDynamicCriteria) {
          console.warn("Nessun dato medio di settore caricato. Lo screening utilizzerà solo i criteri predefiniti dall'utente se la modalità dinamica è attiva.");
      }
    };
    loadSectorData();
  }, [useDynamicCriteria]);


  const handleCriteriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? '' : parseFloat(value); 
    setUserCriteria(prev => ({ ...prev, [name]: numericValue === '' ? '' : numericValue }));
  };

  const handleCriteriaBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '') {
        setUserCriteria(prev => ({...prev, [name]: 0}));
    }
  }

  const handleStartScreening = useCallback(async () => {
    setIsLoading(true);
    setCandidateStocks([]);
    setErrorMessages([]);
    setCurrentStockProcessingInfo(null); 
    setProgressMessage('Avvio dello screening...');

    const tickers = tickerInput.split(',')
      .map(t => t.trim().toUpperCase())
      .filter(t => t);

    if (tickers.length === 0) {
      setErrorMessages(['Per favore, inserisci almeno un ticker.']);
      setIsLoading(false);
      setProgressMessage('');
      return;
    }

    const allScreenedEntries: ScreenerResultEntry[] = [];
    const currentErrors: string[] = [];

    const baseCriteria: ScreenerCriteria = {
        minRoe: typeof userCriteria.minRoe === 'number' ? userCriteria.minRoe : 0,
        maxPE: typeof userCriteria.maxPE === 'number' ? userCriteria.maxPE : 0,
        maxPB: typeof userCriteria.maxPB === 'number' ? userCriteria.maxPB : 0,
        maxDE: typeof userCriteria.maxDE === 'number' ? userCriteria.maxDE : 0,
    };

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      setProgressMessage(`Analisi ${i + 1} di ${tickers.length}: ${ticker}`);
      
      try {
        const stockDataResponse = await fetchStockData(ticker);

        if ('message' in stockDataResponse) {
          currentErrors.push(`Errore per ${ticker}: ${stockDataResponse.message}${stockDataResponse.isInsufficientData ? ' (Dati insufficienti)' : ''}`);
          setCurrentStockProcessingInfo(null); // Clear processing info on error for this stock
          // Potremmo voler salvare un'entry di errore qui se necessario per il DatabaseView
          continue;
        }
        
        const stock = stockDataResponse as StockMetrics;
        
        let actualCriteria: ScreenerCriteria = { ...baseCriteria };
        let criteriaSource: AppliedCriteriaDetails['criteriaSource'] = 'Predefiniti dall\'utente';
        
        if (useDynamicCriteria) {
            const stockSector = stock.sector;
            if (stockSector && sectorAverages.length > 0) {
              const sectorDefaults = sectorAverages.find(sa => sa.sector.toLowerCase() === stockSector.toLowerCase());
              if (sectorDefaults) {
                actualCriteria.minRoe = typeof sectorDefaults.roe === 'number' ? sectorDefaults.roe : baseCriteria.minRoe;
                actualCriteria.maxPE = typeof sectorDefaults.pe === 'number' ? sectorDefaults.pe : baseCriteria.maxPE;
                actualCriteria.maxPB = typeof sectorDefaults.pb === 'number' ? sectorDefaults.pb : baseCriteria.maxPB;
                actualCriteria.maxDE = typeof sectorDefaults.de === 'number' ? sectorDefaults.de : baseCriteria.maxDE;
                criteriaSource = 'Specifici del settore';
              }
            }
        } else {
            criteriaSource = 'Fissi (scelta utente)';
        }
        
        const appliedCriteriaDetails: AppliedCriteriaDetails = { ...actualCriteria, criteriaSource };
        setCurrentStockProcessingInfo({
            ticker: stock.ticker,
            sector: stock.sector,
            appliedCriteria: actualCriteria,
            criteriaSource
        });

        const roeValue = stock.roe; 
        const peValue = getNumericMetricOrNull(stock.trailingPE);
        const pbValue = getNumericMetricOrNull(stock.priceToBook);
        const deValue = getNumericMetricOrNull(stock.debtToEquity);
        
        const passStatus: ScreenerPassStatus = { roe: false, pe: false, pb: false, de: false };
        let isInBasket = false;

        if (peValue === null || pbValue === null || deValue === null) {
          currentErrors.push(`Dati chiave (P/E, P/B, D/E) mancanti o non numerici per ${ticker}. Impossibile applicare filtri.`);
          // Save an entry even if some data is missing, marking applicable checks
        } else {
            passStatus.roe = roeValue >= actualCriteria.minRoe;
            passStatus.pe = peValue > 0 && peValue <= actualCriteria.maxPE; 
            passStatus.pb = pbValue > 0 && pbValue <= actualCriteria.maxPB; 
            passStatus.de = deValue <= actualCriteria.maxDE;
            isInBasket = passStatus.roe && passStatus.pe && passStatus.pb && passStatus.de;
        }
        
        allScreenedEntries.push({
            stockMetrics: stock,
            appliedCriteriaDetails,
            passStatus,
            isInBasket,
            timestamp: new Date().toISOString()
        });

        if (isInBasket) {
          setCandidateStocks(prev => [...prev, stock].sort((a, b) => {
            const peA = getNumericMetricOrNull(a.trailingPE) ?? Infinity;
            const peB = getNumericMetricOrNull(b.trailingPE) ?? Infinity;
            return peA - peB;
          }));
        }
      } catch (error: any) {
        currentErrors.push(`Errore API non gestito per ${ticker}: ${error.message || 'Errore sconosciuto'}`);
      }
    }
    
    // Save all processed entries to localStorage
    try {
        const existingEntriesJSON = localStorage.getItem('screenerSavedResults');
        const existingEntries: ScreenerResultEntry[] = existingEntriesJSON ? JSON.parse(existingEntriesJSON) : [];
        // Add new entries, potentially replacing older entries for the same tickers if desired, or just append
        // For simplicity, appending all new results. A more complex merge/replace could be done.
        localStorage.setItem('screenerSavedResults', JSON.stringify([...existingEntries, ...allScreenedEntries]));
    } catch (storageError) {
        console.error("Errore nel salvataggio dei risultati dello screener in localStorage:", storageError);
        currentErrors.push("Errore nel salvataggio locale dei risultati dello screener.");
    }

    setErrorMessages(currentErrors);
    setIsLoading(false);
    const finalCandidateCount = allScreenedEntries.filter(e => e.isInBasket).length;
    setProgressMessage(finalCandidateCount > 0 ? `Screening completato. ${finalCandidateCount} titoli nel basket.` : 'Screening completato. Nessun titolo ha superato tutti i criteri.');
    setCurrentStockProcessingInfo(null);
  }, [tickerInput, userCriteria, sectorAverages, useDynamicCriteria]);

  const criteriaFields: { id: keyof ScreenerCriteria; label: string; step: string, description: string }[] = [
    { id: 'minRoe', label: 'ROE Minimo (%)', step: '0.1', description: 'Ritorno sul Patrimonio Minimo (es. 15 per 15%)' },
    { id: 'maxPE', label: 'P/E Massimo', step: '0.1', description: 'Rapporto Prezzo/Utili Massimo (es. 15)' },
    { id: 'maxPB', label: 'P/B Massimo', step: '0.1', description: 'Rapporto Prezzo/Valore Contabile Massimo (es. 1.5)' },
    { id: 'maxDE', label: 'D/E Massimo (Ratio)', step: '0.01', description: 'Rapporto Debito/Patrimonio Massimo (es. 0.5)' },
  ];

  return (
    <div className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg text-slate-100">
      <header className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Stock Screener <span className="text-cyan-400">"Value Investing"</span>
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          Filtra un elenco di azioni per identificare candidati promettenti. I criteri possono essere adattati automaticamente in base al settore o definiti manualmente.
        </p>
      </header>

      <section aria-labelledby="default-criteria-section-title" className="mb-8 p-4 sm:p-6 bg-slate-700/30 rounded-lg border border-slate-600/50">
        <h3 id="default-criteria-section-title" className="text-xl font-semibold text-white mb-4">
          Criteri di Selezione
        </h3>
        <div className="mb-6 p-3 bg-slate-700/50 rounded-md border border-slate-600">
          <label htmlFor="useDynamicCriteriaCheckbox" className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="useDynamicCriteriaCheckbox"
              checked={useDynamicCriteria}
              onChange={(e) => setUseDynamicCriteria(e.target.checked)}
              className="h-5 w-5 rounded border-slate-500 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800"
            />
            <span className="ml-3 text-sm text-slate-200">
              Applica criteri specifici del settore (se disponibili)
            </span>
          </label>
          <p className="ml-8 mt-1 text-xs text-slate-400">
            Se selezionato, i criteri sottostanti verranno usati come fallback qualora i dati di settore non fossero trovati o non applicabili.
            Se deselezionato, verranno usati solo i criteri fissi sottostanti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteriaFields.map(field => (
            <div key={field.id}>
              <label htmlFor={`user-${field.id}`} className="block text-sm font-medium text-slate-300 mb-1">
                {field.label} {useDynamicCriteria ? '(Fallback)' : '(Fisso)'}
              </label>
              <input
                type="number"
                id={`user-${field.id}`}
                name={field.id}
                value={userCriteria[field.id]}
                onChange={handleCriteriaChange}
                onBlur={handleCriteriaBlur}
                step={field.step}
                className="w-full px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors placeholder-slate-400"
                placeholder={field.description.match(/es\. (\d+(\.\d+)?)/)?.[1] || ''}
                aria-describedby={`user-${field.id}-description`}
              />
              <p id={`user-${field.id}-description`} className="mt-1 text-xs text-slate-400">
                {field.description}.
              </p>
            </div>
          ))}
        </div>
      </section>

      {isLoading && currentStockProcessingInfo && (
        <section aria-labelledby="applied-criteria-section-title" className="my-6 p-4 bg-sky-800/40 rounded-lg border border-sky-700/60">
          <h3 id="applied-criteria-section-title" className="text-lg font-semibold text-sky-200 mb-3">
            Criteri Applicati per il Titolo Corrente: <span className="text-sky-100 font-bold">{currentStockProcessingInfo.ticker}</span>
          </h3>
          <p className="text-sm text-sky-300 mb-1">
            <strong>Settore:</strong> {currentStockProcessingInfo.sector || 'N/D'}
          </p>
          <p className="text-sm text-sky-300 mb-3">
            <strong>Fonte Criteri:</strong> {currentStockProcessingInfo.criteriaSource} 
            {currentStockProcessingInfo.criteriaSource === 'Specifici del settore' && ` (${currentStockProcessingInfo.sector || 'Sconosciuto'})`}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><strong>ROE Min (%):</strong> <span className="font-mono text-sky-200">{formatMetricForTable(currentStockProcessingInfo.appliedCriteria.minRoe, 1)}</span></div>
            <div><strong>P/E Max:</strong> <span className="font-mono text-sky-200">{formatMetricForTable(currentStockProcessingInfo.appliedCriteria.maxPE, 2)}</span></div>
            <div><strong>P/B Max:</strong> <span className="font-mono text-sky-200">{formatMetricForTable(currentStockProcessingInfo.appliedCriteria.maxPB, 2)}</span></div>
            <div><strong>D/E Max:</strong> <span className="font-mono text-sky-200">{formatMetricForTable(currentStockProcessingInfo.appliedCriteria.maxDE, 2)}</span></div>
          </div>
        </section>
      )}

      <section aria-labelledby="ticker-input-section-title" className="mb-8">
        <h3 id="ticker-input-section-title" className="text-xl font-semibold text-white mb-3">
          Lista Ticker da Analizzare
        </h3>
        <textarea
          id="ticker-input-area"
          value={tickerInput}
          onChange={(e) => setTickerInput(e.target.value)}
          placeholder="Es. ENI.MI, AAPL, MSFT, GOOG (separati da virgola)"
          className="w-full h-24 px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors placeholder-slate-400"
          rows={3}
          aria-label="Lista dei ticker separati da virgola"
        />
         <p className="mt-1 text-xs text-slate-400">
            Inserisci i ticker separati da una virgola. Esempio: <code>A2A.MI, AMP.MI, AZM.MI</code>
        </p>
      </section>

      <button
        onClick={handleStartScreening}
        disabled={isLoading}
        className="w-full sm:w-auto px-8 py-3 mb-6 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="h-5 w-5" color="text-slate-900" />
            <span className="ml-2">Analizzando...</span>
          </>
        ) : (
          'Avvia Screening'
        )}
      </button>

      {progressMessage && !isLoading && ( 
        <div className={`my-4 p-3 rounded-md text-sm bg-slate-700/50 text-slate-300`} role="status">
          {progressMessage}
        </div>
      )}
       {isLoading && progressMessage && ( 
        <div className={`my-4 p-3 rounded-md text-sm bg-sky-700/30 text-sky-300`} role="status">
          {progressMessage}
        </div>
      )}

      {errorMessages.length > 0 && (
        <div className="my-4 p-3 bg-red-700/30 border border-red-500/50 rounded-lg text-red-300 space-y-1" role="alert">
          <p className="font-semibold text-sm">Sono stati riscontrati i seguenti problemi:</p>
          <ul className="list-disc list-inside text-xs">
            {errorMessages.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      
      {candidateStocks.length > 0 && !isLoading && (
        <section aria-labelledby="results-section-title" className="mt-8">
          <h3 id="results-section-title" className="text-xl sm:text-2xl font-bold text-white mb-4">
            Basket di Azioni Promettenti <span className="text-cyan-400">({candidateStocks.length})</span>
          </h3>
          <p className="text-slate-300 text-sm mb-4">
            Questi titoli hanno superato la pre-analisi e meritano un'indagine approfondita con il tool "Analista Valore AI".
            Ordinati per P/E crescente.
          </p>
          <div className="overflow-x-auto rounded-lg shadow-md border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50">
                <tr>
                  {['Ticker', 'Nome Compagnia', 'Settore', 'ROE (%)', 'P/E', 'P/B', 'D/E'].map(header => (
                    <th key={header} scope="col" className="px-4 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {candidateStocks.map((stock) => (
                  <tr key={stock.ticker} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-100">{stock.ticker}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{stock.shortName || stock.companyName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{stock.sector || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-right">{formatMetricForTable(stock.roe, 1)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-right">{formatMetricForTable(stock.trailingPE)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-right">{formatMetricForTable(stock.priceToBook)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-right">{formatMetricForTable(stock.debtToEquity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      
      {!isLoading && candidateStocks.length === 0 && progressMessage.startsWith("Screening completato.") && (
         <div className="mt-8 p-4 bg-slate-700/50 border border-slate-600/70 rounded-lg text-center">
            <p className="text-slate-300 font-semibold">Nessuna azione ha superato i criteri di selezione.</p>
            <p className="text-slate-400 text-sm mt-1">Prova ad allargare i filtri o controlla i ticker inseriti.</p>
        </div>
      )}

    </div>
  );
};

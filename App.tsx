import React, { useState, useCallback, useEffect } from 'react';
import { StockMetrics, AnalysisData, FetchStockDataError, StructuredAiReport, ActiveViewType, AiAnalysisEntry, CompetitorData, CompetitorInfo, AiCompetitorComparisonReport } from './types';
import { fetchStockData } from './services/stockDataService';
import { generateStockAnalysisReport, fetchCompetitorsWithGoogleSearch, generateCompetitorComparisonAnalysis } from './services/geminiAiService';
import { TickerInputForm } from './components/TickerInputForm';
import { DcfParameterInputs } from './components/DcfParameterInputs';
import { KeyMetricsGrid } from './components/KeyMetricsGrid';
import { LoadingSpinner } from './components/LoadingSpinner';
import { HistoricalTrendChart } from './components/HistoricalTrendChart';
import { BenchmarkingSection } from './components/BenchmarkingSection';
import { CompetitorComparisonSection } from './components/CompetitorComparisonSection'; // NUOVO
import { DecisionMatrix } from './components/DecisionMatrix';
import { QualitativeChecklistModal } from './components/QualitativeChecklistModal';
import { NavigationMenu } from './components/navigation/NavigationMenu';
import { StockScreenerView } from './views/StockScreenerView';
import { DatabaseView } from './views/DatabaseView';
import { FutureView } from './views/FutureView';

const App: React.FC = () => {
  const [ticker, setTicker] = useState<string>('ENI.MI');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<ActiveViewType>('analyzer');

  const [dcfDiscountRate, setDcfDiscountRate] = useState<number>(9);
  const [dcfGrowthRate, setDcfGrowthRate] = useState<number>(1.5);

  // *** DICHIARAZIONE DELLO STATO STOCKMETRICS MANCANTE - AGGIUNTA QUI ***
  const [stockMetrics, setStockMetrics] = useState<StockMetrics | null>(null);

  // --- Stati per il confronto competitor ---
  const [competitorDetailsLoading, setCompetitorDetailsLoading] = useState<Record<string, boolean>>({});
  const [competitorDetailsData, setCompetitorDetailsData] = useState<Record<string, StockMetrics | null>>({});
  const [isGeneratingCompetitorReport, setIsGeneratingCompetitorReport] = useState<boolean>(false);
  const [competitorAnalysisError, setCompetitorAnalysisError] = useState<string | null>(null);
  // --- Fine stati competitor ---

  // Usiamo useRef per mantenere il riferimento all'AbortController attivo per la richiesta principale
  const analyzeStockAbortControllerRef = React.useRef<AbortController | null>(null);


   const handleAnalyzeStock = useCallback(async () => {
     // Annulla qualsiasi richiesta principale precedente in corso prima di iniziarne una nuova
      if (analyzeStockAbortControllerRef.current) {
           console.log('Aborting previous analysis request...');
           analyzeStockAbortControllerRef.current.abort();
       }

      // Crea un nuovo AbortController per questa richiesta principale
      const abortController = new AbortController();
      analyzeStockAbortControllerRef.current = abortController; // Salva il riferimento
      const signal = abortController.signal;


    if (!ticker.trim()) {
      setErrorMessage("Il ticker non può essere vuoto.");
      return;
    }
    if (dcfDiscountRate <= dcfGrowthRate) {
      setErrorMessage("Il tasso di sconto (r) deve essere maggiore del tasso di crescita (g) per il modello DCF.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Recupero dati finanziari principali...');
    setErrorMessage(null);
    setAnalysisResult(null);
    // Pulisci anche gli stati correlati ai competitor all'inizio di una nuova analisi
    setCompetitorDetailsLoading({});
    setCompetitorDetailsData({});
    setIsGeneratingCompetitorReport(false);
    setCompetitorAnalysisError(null);
    // Pulisci lo stato stockMetrics precedente
    setStockMetrics(null);


    let metrics: StockMetrics;
    let aiReportData: StructuredAiReport | undefined; // Potrebbe non essere generato se i dati base sono insufficienti
    let competitorDataResult: CompetitorData | null = null;
    let fetchedCompetitorDetails: Record<string, StockMetrics | null> = {};
    let aiCompReport: AiCompetitorComparisonReport | null = null;

    try {
      console.log('Calling fetchStockData for main stock', { ticker, signalAborted: signal.aborted }); // Log signal status
      const stockDataResponse = await fetchStockData(ticker.trim().toUpperCase(), {
        dcfDiscountRate: dcfDiscountRate / 100,
        dcfGrowthRate: dcfGrowthRate / 100,
      }, signal); // Passa il segnale alla funzione fetchStockData

      console.log('fetchStockData for main stock finished', { ticker, stockDataResponse, signalAborted: signal.aborted }); // Log signal status


      // !!! IMPORTANTE: Gestisci la risposta di fetchStockData !!!
      // fetchStockData restituisce StockMetrics in caso di successo
      // o FetchStockDataError in caso di errore gestito (es. ticker non trovato, dati insufficienti)
      // o lancia un errore per problemi inattesi (es. errore di rete non gestito, abort)

      if ('isInsufficientData' in stockDataResponse && stockDataResponse.isInsufficientData) {
           // Questo blocco viene eseguito se fetchStockData ha restituito FetchStockDataError
           console.warn(stockDataResponse.message, stockDataResponse); // Log the error message from fetchStockData
           setErrorMessage(stockDataResponse.message);
           // Non abbiamo dati validi per impostare metrics, analysisResult rimane null o parziale
           // setStockMetrics(null); // Già pulito all'inizio della funzione
           setIsLoading(false); // Assicurati che isLoading sia false qui
           // Non procedere con le chiamate AI
           return; // Esci dalla funzione handleAnalyzeStock
      }

      // Se arriviamo qui, significa che fetchStockData ha restituito StockMetrics (successo)
      // Controlliamo anche che non sia un errore malformato (anche se il check above dovrebbe bastare)
       if ('message' in stockDataResponse && typeof stockDataResponse.message === 'string') {
            console.error('Received a success-like response with an error message:', stockDataResponse);
            setErrorMessage(stockDataResponse.message);
            setIsLoading(false);
            return;
       }

      metrics = stockDataResponse as StockMetrics; // La risposta è StockMetrics
      setStockMetrics(metrics); // *** Aggiorna lo stato stockMetrics con i dati ricevuti ***


      // Controlli sui dati necessari per l'analisi AI
      // Ora controlliamo su 'metrics' che abbiamo appena impostato e che viene dalla risposta fetchStockData
      if (!metrics.currentPrice || typeof metrics.normalizedEPS !== 'number' || metrics.normalizedEPS === 0 || (typeof metrics.intrinsicValue !== 'number' || metrics.intrinsicValue <= 0)) {
         const insufficientAiDataMessage = "Dati finanziari fondamentali insufficienti o non validi per questo ticker per procedere con l'analisi AI (Prezzo, EPS normalizzato o Valore Intrinseco calcolato mancanti/invalidi).";
         console.warn(insufficientAiDataMessage, metrics); // Log i dati metrics per debugging

         // Crea un report AI parziale per indicare che l'analisi non è possibile
         const partialReport: StructuredAiReport = {
            verdetto: "Analisi AI non possibile.",
            perche_si:"Alcuni dati finanziari recuperati.",
            perche_no:"Impossibile calcolare indicatori di valore fondamentali o mancano dati chiave per l'AI.",
            decisione_buffett:"L'analisi qualitativa richiede una solida base quantitativa che qui è incompleta."
         };

         // Imposta analysisResult con i metrics recuperati (anche se parziali per l'AI) e il report parziale
         // Non azzerare metrics qui, usa quelli appena ottenuti
         setAnalysisResult({metrics, aiReport: partialReport, competitorData: null, competitorDetails: {}, aiCompetitorComparisonReport: null });

         setIsLoading(false); // Finisci il caricamento anche se l'analisi AI non parte
         // Non procedere con le chiamate AI successive (ricerca competitor, report comparativo)
         return; // Esci dalla funzione handleAnalyzeStock dopo aver mostrato i dati parziali e l'errore AI
      }

      // Se i dati sono sufficienti per l'analisi AI...
      setLoadingMessage('Generazione report AI per azienda principale...');
      aiReportData = await generateStockAnalysisReport(metrics); // Ora questa chiamata dovrebbe andare a buon fine se la chiave API è valida

      // Procedi con la ricerca e l'analisi dei competitor SOLO se non è avvenuto un abort e i dati base sono sufficienti
      if (!signal.aborted) {
         setLoadingMessage('Ricerca concorrenti con Google Search...');
         // Assicurati di usare metrics.companyName o metrics.ticker che dovrebbero essere disponibili qui
         competitorDataResult = await fetchCompetitorsWithGoogleSearch(metrics.companyName || metrics.ticker, metrics.ticker);

         if (competitorDataResult && competitorDataResult.competitors.length > 0) {
           const competitorTickers = competitorDataResult.competitors
             .map(c => c.ticker)
             .filter(t => t && t.toUpperCase() !== metrics.ticker.toUpperCase()); // Escludi il ticker corrente

           if (competitorTickers.length > 0) {
               setLoadingMessage(`Recupero dati per ${competitorTickers.length} concorrenti...`);
               const promises = competitorTickers.map(async (compTicker) => {
                   if (signal.aborted) return { [compTicker]: null }; // Non recuperare se la richiesta principale è stata abortita

                   setCompetitorDetailsLoading(prev => ({ ...prev, [compTicker]: true }));
                   setLoadingMessage(`Recupero dettagli per ${compTicker}...`);
                   try {
                       // Passa il segnale anche a fetchStockData per i competitor se vuoi che siano abortiti con la richiesta principale
                       const compDataResponse = await fetchStockData(compTicker, undefined, signal);
                       if ('message' in compDataResponse) {
                           console.warn(`Errore nel recupero dati per concorrente ${compTicker}: ${compDataResponse.message}`);
                           // Usa la concatenazione di stringhe qui
                           setCompetitorAnalysisError(prev => prev ? prev + '\nNon è stato possibile caricare i dati per ' + compTicker + '.' : 'Non è stato possibile caricare i dati per ' + compTicker + '.');
                           return { [compTicker]: null };
                       }
                       return { [compTicker]: compDataResponse as StockMetrics };
                   } catch (compError: any) {
                       // Cattura gli errori di fetch dei singoli competitor
                       // Controlla se l'errore è un AbortError prima di mostrare un errore all'utente
                       if (compError.name === 'AbortError') {
                           console.log(`Fetch per concorrente ${compTicker} abortita.`);
                           return { [compTicker]: null }; // Non mostrare errore per abort
                       }
                      console.warn(`Errore fetch per concorrente ${compTicker}: ${compError.message}`);
                      // Usa la concatenazione di stringhe qui
                      setCompetitorAnalysisError(prev => prev ? prev + '\nErrore critico per ' + compTicker + '.' : 'Errore critico per ' + compTicker + '.');

                      return { [compTicker]: null };
                   } finally {
                       setCompetitorDetailsLoading(prev => ({ ...prev, [compTicker]: false }));
                   }
               });

               // Esegui le chiamate per i competitor in parallelo
               const results = await Promise.all(promises);
               results.forEach(res => {
                   fetchedCompetitorDetails = { ...fetchedCompetitorDetails, ...res };
               });
               setCompetitorDetailsData(fetchedCompetitorDetails); // Aggiorna lo stato dei dettagli competitor

               // Filtra solo i competitor con dati validi per l'analisi AI comparativa
               const validCompetitorsForAI = Object.values(fetchedCompetitorDetails).filter(cd => cd !== null) as StockMetrics[];

               if (validCompetitorsForAI.length > 0) {
                 setLoadingMessage('Generazione analisi comparativa AI...');
                 setIsGeneratingCompetitorReport(true);
                 try {
                   aiCompReport = await generateCompetitorComparisonAnalysis(metrics, validCompetitorsForAI);
                 } catch (compReportError: any) {
                    console.error("Errore generazione report comparativo AI:", compReportError);
                    // Usa la concatenazione di stringhe qui
                    setCompetitorAnalysisError(prev => prev ? prev + '\nErrore nella generazione del report comparativo AI: ' + compReportError.message : 'Errore nella generazione del report comparativo AI: ' + compReportError.message);

                    } finally {
                   setIsGeneratingCompetitorReport(false);
                 }
               } else {
                  // Usa la concatenazione di stringhe qui
                  setCompetitorAnalysisError(prev => prev ? prev + '\nNessun dato valido sui competitor per l\'analisi comparativa.' : 'Nessun dato valido sui competitor per l\'analisi comparativa.');

               }
           }
         }
      } // Fine if (!signal.aborted) per la ricerca competitor

      // Imposta il risultato finale dell'analisi principale
      // Assicurati che metrics sia quello ottenuto dalla fetch iniziale
      const currentAnalysisResult: AnalysisData = {
        metrics, // Metrics sempre inclusi se fetchStockData ha avuto successo
        aiReport: aiReportData, // Inclusi solo se l'analisi AI principale è stata generata
        competitorData: competitorDataResult, // Inclusi solo se la ricerca competitor è stata fatta
        competitorDetails: fetchedCompetitorDetails, // Inclusi solo se i dettagli competitor sono stati fetched
        aiCompetitorComparisonReport: aiCompReport // Inclusi solo se il report comparativo AI è stato generato
      };
      setAnalysisResult(currentAnalysisResult);

      // Salva in localStorage (assicurati che questa operazione sia sicura e non blocchi l'UI)
      try {
        const newEntry: AiAnalysisEntry = {
          analysis: currentAnalysisResult,
          timestamp: new Date().toISOString(),
        };
        const existingEntriesJSON = localStorage.getItem('aiSavedAnalyses');
        const existingEntries: AiAnalysisEntry[] = existingEntriesJSON ? JSON.parse(existingEntriesJSON) : [];
        localStorage.setItem('aiSavedAnalyses', JSON.stringify([...existingEntries, newEntry]));
        console.log("Analisi salvata in localStorage.");
      } catch (storageError) {
        console.error("Errore nel salvataggio dell'analisi AI in localStorage:", storageError);
        // Potresti voler mostrare un messaggio all'utente qui
      }


    } catch (error: any) {
      // Questo blocco cattura gli errori lanciati da fetchStockData (non gestiti internamente)
      // e da generateStockAnalysisReport, fetchCompetitorsWithGoogleSearch, generateCompetitorComparisonAnalysis
      console.error("Analysis catch block entered:", error);
      let displayError = "Si è verificato un errore durante l'analisi.";

      if (signal.aborted) {
           console.log('Analysis fetch request was aborted (caught in outer catch).');
            // Se la richiesta principale è stata abortita, non mostrare un errore all'utente
           setErrorMessage(null); // Assicurati che non venga mostrato un errore
           // Potresti voler resettare solo lo stato di caricamento nel finally
           // Il finally si occuperà di isLoading
      } else if (error instanceof Error) {
           // Gestisci gli errori generici (TypeError, ecc.) non dovuti all'abort
           displayError = error.message;

           if (error.message.includes('API key not valid')) {
               displayError = `Errore API: Chiave API Gemini non valida o mancante. (${error.message})`;
           } else if (error.message.includes('FETCH_ERROR')) {
               displayError = `Errore di rete API: Impossibile connettersi ai servizi Gemini. (${error.message})`;
           } else {
               // Errore generico non previsto
               displayError = `Errore imprevisto durante l'analisi: ${error.message}`;
           }
           setErrorMessage(displayError);
            // Non impostare analysisResult in caso di errore critico
            setAnalysisResult(null);
            setStockMetrics(null); // Pulisci anche stockMetrics in caso di errore critico


      } else {
          // Gestisci altri tipi di errori non Error instances
          console.error("Unknown error type caught:", error);
          setErrorMessage(`Si è verificato un errore sconosciuto durante l'analisi.`);
           setAnalysisResult(null);
           setStockMetrics(null); // Pulisci anche stockMetrics
      }

    } finally {
      console.log('handleAnalyzeStock finally block entered', { signalAborted: signal.aborted, isLoading }); // Log signal status in finally
       // Imposta isLoading a false SOLO se la richiesta NON è stata abortita.
       // Se è stata abortita, una nuova chiamata handleAnalyzeStock (se innescata)
       // gestirà il proprio stato di caricamento.
      if (!signal.aborted) {
         setIsLoading(false);
          console.log('Loading states set to false in finally.');
      } else {
           console.log('Loading states NOT set to false in finally because signal was aborted.');
      }
       // Resetta il riferimento all'AbortController solo se è quello che abbiamo avviato noi
       if (analyzeStockAbortControllerRef.current === abortController) {
            analyzeStockAbortControllerRef.current = null;
        }
        // Assicurati che gli stati di caricamento dei competitor siano resettati in ogni caso
        setCompetitorDetailsLoading({});
        setIsGeneratingCompetitorReport(false);
        setLoadingMessage(''); // Resetta il messaggio di caricamento
    }
  }, [ticker, dcfDiscountRate, dcfGrowthRate, setIsLoading, setStockMetrics, setAnalysisResult, setErrorMessage, isLoading, setCompetitorDetailsLoading, setCompetitorDetailsData, setIsGeneratingCompetitorReport, setCompetitorAnalysisError, analysisResult]); // Assicurati che tutte le dipendenze siano elencate


  // useEffect per la cleanup quando il componente si smonta.
  // Questo serve solo a garantire che la richiesta principale pendente venga annullata
  // se l'utente naviga via o il componente viene rimosso.
  useEffect(() => {
      console.log('App component mounted. useEffect cleanup function registered.'); // Log when mounted
      return () => {
           console.log('App component cleanup running. Aborting any pending main request.'); // Log on cleanup
           if (analyzeStockAbortControllerRef.current) {
               analyzeStockAbortControllerRef.current.abort();
               console.log('Pending main analysis request aborted during component cleanup.');
           }
           // Puoi aggiungere altre pulizie globali qui se necessario.
      };
  }, []); // Dipendenze vuote = cleanup solo allo smontaggio

  // Helper function per gestire il click sul pulsante Analizza
  const handleAnalyzeButtonClick = () => {
      if (ticker.trim()) { // Assicurati che il ticker non sia vuoto o solo spazi
          handleAnalyzeStock(); // Chiama la funzione principale di analisi
      } else {
          setErrorMessage("Inserisci un ticker valido per iniziare l'analisi.");
          setAnalysisResult(null); // Pulisci risultati precedenti
           setStockMetrics(null); // Pulisci anche stockMetrics
           setCompetitorDetailsData({}); // Pulisci dati competitor
           setCompetitorDetailsLoading({}); // Pulisci stato caricamento competitor
           setCompetitorAnalysisError(null); // Pulisci errore competitor
           setIsLoading(false); // Assicurati che non ci sia caricamento
           setIsGeneratingCompetitorReport(false);
           setLoadingMessage('');
      }
  };


  const navigateToAnalyzerWithTicker = useCallback((selectedTicker: string) => {
    setTicker(selectedTicker);
    setActiveView('analyzer');
    // Quando si naviga da un'altra vista, pulisci tutti gli stati correlati all'analisi precedente
    setAnalysisResult(null);
    setErrorMessage(null);
    setCompetitorDetailsData({});
    setCompetitorDetailsLoading({});
    setCompetitorAnalysisError(null);
    setIsGeneratingCompetitorReport(false);
    setIsLoading(false); // Assicurati che non ci sia uno stato di caricamento residuo
    setLoadingMessage('');
    setStockMetrics(null); // Pulisci anche stockMetrics

    // NON avviare automaticamente l'analisi qui. L'utente deve cliccare "Analizza" sulla vista Analyzer.
    // Se vuoi lanciare automaticamente l'analisi, devi aggiungere una logica separata,
    // magari un useEffect che si attiva quando cambia il ticker E la vista è 'analyzer'.
    // Ma per ora, seguiamo la logica di far cliccare l'utente.
  }, []);


  const anyCompetitorLoading = Object.values(competitorDetailsLoading).some(status => status);
  const showMainLoadingSpinner = isLoading || anyCompetitorLoading || isGeneratingCompetitorReport;


  const renderActiveView = () => {
    switch (activeView) {
      case 'analyzer':
        return (
          <>
            <p className="text-lg text-slate-300 mb-8">
              Ottieni un'analisi "value" basata su AI per i tuoi titoli. Inserisci un ticker e configura i parametri DCF.
            </p>
            <TickerInputForm
              ticker={ticker}
              setTicker={setTicker}
              onAnalyze={handleAnalyzeButtonClick} // Chiama la funzione helper
              isLoading={showMainLoadingSpinner}
            />
            <DcfParameterInputs
              discountRate={dcfDiscountRate}
              setDiscountRate={setDcfDiscountRate}
              growthRate={dcfGrowthRate}
              setGrowthRate={setDcfGrowthRate}
              isLoading={showMainLoadingSpinner}
            />
            {showMainLoadingSpinner && <LoadingSpinner className="my-8"><p className="ml-3 text-cyan-300">{loadingMessage || 'Analizzando...'}</p></LoadingSpinner>}

            {/* Mostra l'errore principale (da fetchStockData o altri errori critici) */}
            {errorMessage && !showMainLoadingSpinner && ( // Mostra errore principale solo se non c'è un caricamento in corso
              <div className="mt-8 p-4 bg-red-700/30 border border-red-500/50 rounded-lg text-red-300" role="alert">
                <p className="font-semibold">Errore Principale:</p>
                <p>{errorMessage}</p>
                 {/* Link alla checklist se pertinente */}
                <p><button onClick={() => setIsChecklistModalOpen(true)} className="text-cyan-400 hover:text-cyan-300 underline mt-2">Leggi la Checklist Qualitativa Essenziale</button></p>
              </div>
            )}

            {/* Mostra l'errore specifico dell'analisi comparativa (warning) */}
            {competitorAnalysisError && !showMainLoadingSpinner && analysisResult && ( // Mostra errore solo se non c'è caricamento e abbiamo un risultato parziale o completo
                 <div className="mt-4 p-3 bg-yellow-700/30 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm" role="alert">
                    <p className="font-semibold">Attenzione (Analisi Comparativa):</p>
                    <pre className="whitespace-pre-wrap">{competitorAnalysisError}</pre>
                 </div>
            )}


            {/* Mostra i risultati solo se analysisResult è disponibile e NON c'è un errore principale */}
            {/* Controlla che analysisResult E analysisResult.metrics siano disponibili prima di provare ad accedere a metrics */}
            {analysisResult && analysisResult.metrics && !errorMessage && !showMainLoadingSpinner && ( // Mostra risultati solo se il caricamento principale è finito e non ci sono errori principali
              <div className="mt-10 space-y-10">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Analisi per <span className="text-cyan-400">{analysisResult.metrics?.companyName || analysisResult.metrics?.ticker || ticker}</span> {/* Usa i dati disponibili */}
                   {analysisResult.metrics?.ticker && <span className="text-slate-400 text-xl"> ({analysisResult.metrics.ticker})</span>}
                </h2>
                <hr className="border-slate-700" />
                {/* Mostra le metriche chiave SOLO se sono disponibili */}
                {/* metrics è già controllato dall'if parent */}
                <KeyMetricsGrid metrics={analysisResult.metrics} />

                {/* Mostra i grafici storici SOLO se ci sono dati storici e almeno un tipo di dati storici */}
                {analysisResult.metrics.historicalData &&
                  (
                    (analysisResult.metrics.historicalData.revenue && Object.keys(analysisResult.metrics.historicalData.revenue).length > 0) ||
                    (analysisResult.metrics.historicalData.netIncome && Object.keys(analysisResult.metrics.historicalData.netIncome).length > 0) ||
                    (analysisResult.metrics.historicalData.totalDebt && Object.keys(analysisResult.metrics.historicalData.totalDebt).length > 0) ||
                     (analysisResult.metrics.historicalData.prices && analysisResult.metrics.historicalData.prices.length > 0) // Includi anche controllo per i prezzi
                  ) &&
                (
                  <HistoricalTrendChart
                    historicalData={analysisResult.metrics.historicalData}
                    companyName={analysisResult.metrics.companyName || analysisResult.metrics.ticker || ''} // Passa il nome dell'azienda o ticker
                  />
                )}
                {/* Sezione Benchmarking */}
                {/* Passa metrics.ticker solo se metrics è disponibile */}
                <BenchmarkingSection
                  competitorData={analysisResult.competitorData}
                  onNavigateToAnalyzer={navigateToAnalyzerWithTicker}
                  currentTicker={analysisResult.metrics?.ticker || ''}
                />
                {/* Sezione Confronto Competitor */}
                {/* Passa mainCompanyMetrics solo se metrics è disponibile */}
                <CompetitorComparisonSection
                    mainCompanyMetrics={analysisResult.metrics}
                    competitorData={analysisResult.competitorData}
                    competitorDetailsData={analysisResult.competitorDetails || {}}
                    aiCompetitorComparisonReport={analysisResult.aiCompetitorComparisonReport}
                    isLoadingReport={isGeneratingCompetitorReport}
                    isLoadingDetails={anyCompetitorLoading}
                />
                 {/* Mostra la Decision Matrix SOLO se il report AI principale è disponibile */}
                 {analysisResult.aiReport && <DecisionMatrix report={analysisResult.aiReport} />}

                {/* Per debugging: mostra l'oggetto completo analysisResult */}
                {/* <pre className="text-xs bg-slate-800 p-4 rounded-lg overflow-auto">{JSON.stringify(analysisResult, null, 2)}</pre> */}


              </div>
            )}
          </>
        );
      case 'screener':
        return <StockScreenerView />; // Assicurati che StockScreenerView non abbia dipendenze dallo stato di App che ora gestiamo in modo diverso
      case 'database':
        return <DatabaseView onNavigateToAnalyzer={navigateToAnalyzerWithTicker} />; // Passa la funzione per navigare e pre-impostare il ticker
      case 'future':
        return <FutureView />; // Assicurati che FutureView non abbia dipendenze dallo stato di App che ora gestiamo in modo diverso
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="bg-slate-800 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Piattaforma Analisi Investimenti <span className="text-cyan-400">(React v6)</span>
          </h1>
        </div>
      </header>

      <NavigationMenu activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveView()}
      </main>

      <footer className="bg-slate-800 text-center py-4 mt-auto">
        <p className="text-sm text-slate-400">
          Powered by React, Tailwind CSS, Recharts, and Gemini API.
        </p>
        <button
            onClick={() => setIsChecklistModalOpen(true)}
            className="text-sm text-cyan-400 hover:text-cyan-300 underline mt-2 focus:outline-none"
            aria-label="Apri checklist qualitativa"
        >
            Leggi la Checklist Qualitativa Essenziale
        </button>
      </footer>

      <QualitativeChecklistModal
        isOpen={isChecklistModalOpen}
        onClose={() => setIsChecklistModalOpen(false)}
      />
    </div>
  );
};

export default App;

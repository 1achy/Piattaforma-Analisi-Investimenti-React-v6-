import React from 'react';
import { StockMetrics, CompetitorData, AiCompetitorComparisonReport, AiComparisonKeyArea } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface CompetitorComparisonSectionProps {
  mainCompanyMetrics: StockMetrics;
  competitorData: CompetitorData | null | undefined; // Used to get competitor tickers/names
  competitorDetailsData: Record<string, StockMetrics | null>; // Ticker -> StockMetrics
  aiCompetitorComparisonReport: AiCompetitorComparisonReport | null | undefined;
  isLoadingReport: boolean;
  isLoadingDetails: boolean;
}

const formatDisplayValue = (value: number | string | null | undefined, unit: string = "", digits: number = 1): string => {
  if (value === null || typeof value === 'undefined' || value === "N/A" || (typeof value === 'number' && isNaN(value)) ) {
    return "N/A";
  }
  if (typeof value === 'number') {
    return `${value.toFixed(digits)}${unit}`;
  }
  // If it's a string that's a number, try to format. Otherwise, return as is.
  const num = parseFloat(value);
  if (!isNaN(num)) {
      return `${num.toFixed(digits)}${unit}`;
  }
  return `${value}${unit}`; // Value might already have % or be some other string
};

const getNumericValue = (value: any): number | null => {
  if (value === null || typeof value === 'undefined') return null;
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    if (value.toUpperCase() === 'N/A') return null;
    const num = parseFloat(value.replace('%', '')); // Remove % if present for parsing
    return isNaN(num) ? null : num;
  }
  return null;
};

const getCellColorClass = (
  currentValue: number | null,
  allValuesInRow: (number | null)[],
  higherIsBetter: boolean
): string => {
  if (currentValue === null) return 'text-slate-200'; // Default for N/A

  const numericValues = allValuesInRow.filter(v => v !== null) as number[];
  if (numericValues.length < 2) return 'text-slate-200'; // Not enough data for comparison

  const minVal = Math.min(...numericValues);
  const maxVal = Math.max(...numericValues);

  if (minVal === maxVal) return 'text-yellow-300'; // All valid values are the same

  let normalized = (currentValue - minVal) / (maxVal - minVal);
  if (isNaN(normalized)) return 'text-slate-200'; // Should not happen if currentValue is not null & minVal!==maxVal

  if (!higherIsBetter) {
    normalized = 1 - normalized;
  }

  if (normalized <= 0.2) return 'text-red-400';
  if (normalized <= 0.4) return 'text-orange-400';
  if (normalized <= 0.6) return 'text-yellow-300';
  if (normalized <= 0.8) return 'text-lime-400';
  return 'text-green-400';
};


interface ComparisonMetricConfig {
  metricKey: keyof StockMetrics;
  label: string;
  unit?: string;
  digits?: number;
  higherIsBetter: boolean; 
}
interface ComparisonAreaConfig {
  key: AiComparisonKeyArea;
  title: string;
  question: string;
  metrics: Array<ComparisonMetricConfig>;
}

const comparisonAreasConfig: ComparisonAreaConfig[] = [
  {
    key: 'Valutazione',
    title: "1. Valutazione: \"Qual è l'Azienda più a Buon Mercato?\"",
    question: "Confronto dei multipli di mercato (P/E, EV/EBITDA, P/B) e del rendimento da dividendo per identificare potenziali sottovalutazioni.",
    metrics: [
      { metricKey: 'trailingPE', label: 'P/E Ratio (TTM)', higherIsBetter: false },
      { metricKey: 'enterpriseToEbitda', label: 'EV/EBITDA', higherIsBetter: false },
      { metricKey: 'priceToBook', label: 'P/B Ratio', higherIsBetter: false },
      { metricKey: 'dividendYield', label: 'Dividend Yield', unit: '%', digits: 2, higherIsBetter: true },
    ],
  },
  {
    key: 'Redditività',
    title: "2. Redditività e Qualità: \"Qual è l'Azienda Migliore nel suo Business?\"",
    question: "Analisi della capacità di generare profitti (ROE, Margini) per valutare l'efficienza e la forza del modello di business.",
    metrics: [
      { metricKey: 'roe', label: 'ROE', unit: '%', digits: 1, higherIsBetter: true },
      { metricKey: 'netProfitMargin', label: 'Margine Netto', unit: '%', digits: 1, higherIsBetter: true },
      { metricKey: 'grossMargin', label: 'Margine Lordo', unit: '%', digits: 1, higherIsBetter: true },
    ],
  },
  {
    key: 'SaluteFinanziaria',
    title: "3. Stato di Salute Finanziario: \"Qual è l'Azienda più Solida e Meno Rischiosa?\"",
    question: "Esame della struttura finanziaria (Debito/Equity, Current Ratio) per determinare la solidità e la liquidità.",
    metrics: [
      { metricKey: 'debtToEquity', label: 'Debito/Equity', digits: 2, higherIsBetter: false },
      { metricKey: 'currentRatio', label: 'Current Ratio', digits: 2, higherIsBetter: true },
    ],
  },
  {
    key: 'Crescita',
    title: "4. Crescita: \"Quale Azienda si sta Espandendo più Velocemente?\"",
    question: "Valutazione dei tassi di crescita dei ricavi e degli utili per identificare le aziende con le migliori prospettive future.",
    metrics: [
      { metricKey: 'revenueGrowth', label: 'Crescita Ricavi (TTM)', unit: '%', digits: 1, higherIsBetter: true },
      { metricKey: 'earningsGrowth', label: 'Crescita Utili (TTM)', unit: '%', digits: 1, higherIsBetter: true },
    ],
  },
  {
    key: 'EfficienzaOperativa',
    title: "5. Efficienza Operativa: \"Chi gestisce le proprie risorse in modo più efficiente?\"",
    question: "Analisi dell'efficienza nella gestione delle scorte e nell'utilizzo degli asset per generare vendite.",
    metrics: [
      { metricKey: 'inventoryTurnover', label: 'Rotazione Scorte', digits: 2, higherIsBetter: true },
      { metricKey: 'assetTurnover', label: 'Rotazione Asset', digits: 2, higherIsBetter: true },
    ],
  },
];


export const CompetitorComparisonSection: React.FC<CompetitorComparisonSectionProps> = ({
  mainCompanyMetrics,
  competitorData,
  competitorDetailsData,
  aiCompetitorComparisonReport,
  isLoadingReport,
  isLoadingDetails,
}) => {
  if (!competitorData || competitorData.competitors.length === 0) {
    return null; 
  }

  const validCompetitorsWithDetails = competitorData.competitors
    .filter(c => c.ticker && c.ticker.toUpperCase() !== mainCompanyMetrics.ticker.toUpperCase())
    .map(c => ({
      info: c,
      metrics: competitorDetailsData[c.ticker] || null,
    }))
    .filter(comp => comp.metrics !== null);


  if (isLoadingDetails && validCompetitorsWithDetails.length === 0 && !Object.values(competitorDetailsData).some(d => d !== null)) {
     return (
      <section aria-labelledby="competitor-comparison-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg mt-10">
        <h2 id="competitor-comparison-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
          Analisi Comparativa Dettagliata con i Concorrenti
        </h2>
        <hr className="border-slate-700 my-4" />
        <LoadingSpinner size="h-6 w-6"><p className="ml-2 text-slate-300">Caricamento dati dettagliati dei concorrenti...</p></LoadingSpinner>
      </section>
    );
  }
  
  if (validCompetitorsWithDetails.length === 0) {
     return (
      <section aria-labelledby="competitor-comparison-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg mt-10">
        <h2 id="competitor-comparison-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
          Analisi Comparativa Dettagliata con i Concorrenti
        </h2>
        <hr className="border-slate-700 my-4" />
        <p className="text-slate-400">Nessun dato dettagliato disponibile per i concorrenti per un confronto completo.</p>
      </section>
    );
  }


  return (
    <section aria-labelledby="competitor-comparison-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg mt-10">
      <h2 id="competitor-comparison-title" className="text-xl sm:text-2xl font-bold text-white mb-3">
        Analisi Comparativa Dettagliata: <span className="text-cyan-400">{mainCompanyMetrics.shortName || mainCompanyMetrics.companyName}</span> vs Concorrenti
      </h2>
      <hr className="border-slate-700 mb-6" />

      {isLoadingReport && (
        <div className="py-4">
          <LoadingSpinner size="h-6 w-6">
            <p className="ml-2 text-slate-300">Generazione sintesi AI del confronto...</p>
          </LoadingSpinner>
        </div>
      )}

      <div className="space-y-8">
        {comparisonAreasConfig.map((area) => (
          <div key={area.key} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <h3 className="text-lg sm:text-xl font-semibold text-sky-300 mb-1">{area.title}</h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-4 italic">{area.question}</p>

            {aiCompetitorComparisonReport && aiCompetitorComparisonReport[area.key] && (
              <div className="mb-4 p-3 bg-slate-600/30 rounded-md border border-slate-500/40">
                <h4 className="text-sm font-semibold text-sky-200 mb-1">Sintesi AI:</h4>
                <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                  {aiCompetitorComparisonReport[area.key]}
                </p>
              </div>
            )}
            {!aiCompetitorComparisonReport && isLoadingReport && (
                <div className="mb-4 p-3 bg-slate-600/30 rounded-md border border-slate-500/40 text-center">
                     <LoadingSpinner size="h-5 w-5"><p className="ml-2 text-xs text-slate-300">Caricamento sintesi AI...</p></LoadingSpinner>
                </div>
            )}
             {aiCompetitorComparisonReport && !aiCompetitorComparisonReport[area.key] && !isLoadingReport && (
                <div className="mb-4 p-3 bg-yellow-600/20 rounded-md border border-yellow-500/30">
                     <p className="text-xs text-yellow-300">Sintesi AI per quest'area non ancora disponibile o non generata.</p>
                </div>
            )}


            <h4 className="text-sm font-semibold text-slate-200 mb-2">Tabella Dati Comparativi:</h4>
            <div className="overflow-x-auto rounded-md border border-slate-600">
              <table className="min-w-full divide-y divide-slate-600 text-xs sm:text-sm">
                <thead className="bg-slate-700/60">
                  <tr>
                    <th scope="col" className="sticky left-0 bg-slate-700/60 px-3 py-2 text-left font-medium text-cyan-300 z-10">Metrica</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-cyan-300">{mainCompanyMetrics.ticker} (Principale)</th>
                    {validCompetitorsWithDetails.map(comp => (
                      <th key={comp.info.ticker} scope="col" className="px-3 py-2 text-right font-medium text-cyan-300">
                        {comp.info.ticker} ({comp.info.name.substring(0,15)}{comp.info.name.length > 15 ? '...' : ''})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-600">
                  {area.metrics.map(metricInfo => {
                    const currentRowNumericalValues: (number | null)[] = [
                      getNumericValue(mainCompanyMetrics[metricInfo.metricKey]),
                      ...validCompetitorsWithDetails.map(comp => getNumericValue(comp.metrics?.[metricInfo.metricKey]))
                    ];

                    const mainCompanyNumericValue = getNumericValue(mainCompanyMetrics[metricInfo.metricKey]);
                    const mainCompanyColorClass = getCellColorClass(mainCompanyNumericValue, currentRowNumericalValues, metricInfo.higherIsBetter);

                    return (
                      <tr key={metricInfo.metricKey} className="hover:bg-slate-700/30">
                        <td className="sticky left-0 bg-slate-800 group-hover:bg-slate-700/30 px-3 py-2 font-medium text-slate-300 z-10">{metricInfo.label}</td>
                        <td className={`px-3 py-2 text-right ${mainCompanyColorClass}`}>
                          {formatDisplayValue(mainCompanyMetrics[metricInfo.metricKey] as string | number | null, metricInfo.unit, metricInfo.digits)}
                        </td>
                        {validCompetitorsWithDetails.map(comp => {
                          const competitorNumericValue = getNumericValue(comp.metrics?.[metricInfo.metricKey]);
                          const competitorColorClass = getCellColorClass(competitorNumericValue, currentRowNumericalValues, metricInfo.higherIsBetter);
                          return (
                            <td key={`${comp.info.ticker}-${metricInfo.metricKey}`} className={`px-3 py-2 text-right ${competitorColorClass}`}>
                              {comp.metrics ? formatDisplayValue(comp.metrics[metricInfo.metricKey] as string | number | null, metricInfo.unit, metricInfo.digits) : 'N/A'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
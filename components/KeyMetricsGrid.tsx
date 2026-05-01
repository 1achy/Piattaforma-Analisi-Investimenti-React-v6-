import React from 'react';
import { StockMetrics } from '../types';
import { MetricChip } from './MetricChip';

interface KeyMetricsGridProps {
  metrics: StockMetrics;
}

const formatNumberDisplay = (value: number | string | null | undefined, digits: number = 2, unit: string = ""): string => {
  if (value === null || typeof value === 'undefined' || (typeof value === 'string' && value.toUpperCase() === "N/A")) return "N/A";
  if (typeof value === 'number') {
    if (isNaN(value)) return "N/A";
    return `${value.toFixed(digits)}${unit}`;
  }
  return `${value}${unit}`; // For strings that are not "N/A"
};


export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({ metrics }) => {
  const formatValue = (value: any, defaultValue: string = "N/A"): string => {
    if (value === null || typeof value === 'undefined' || String(value).trim() === "" || Number.isNaN(value)) return defaultValue;
    if (typeof value === 'number') return value.toFixed(1); // Default to 1 decimal for ROE etc.
    return String(value);
  };
  
  return (
    <section aria-labelledby="key-metrics-title" className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg">
      <h2 id="key-metrics-title" className="text-xl sm:text-2xl font-bold text-white mb-6">
        Metriche Chiave Selezionate
      </h2>
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
        <MetricChip label="Prezzo Corrente" value={`€ ${metrics.currentPrice.toFixed(2)}`} />
        <MetricChip label="Valore Intrinseco (Min.)" value={`€ ${metrics.intrinsicValue.toFixed(2)}`} />
        <MetricChip
          label="Margine Sicurezza"
          value={`${metrics.marginOfSafety.toFixed(1)} %`}
          isSafe={metrics.marginOfSafety > 30}
          isWarning={metrics.marginOfSafety > 0 && metrics.marginOfSafety <= 30}
          isDanger={metrics.marginOfSafety <= 0}
        />
        <MetricChip label="EPS Normalizzato" value={`€ ${metrics.normalizedEPS.toFixed(2)}`} isForwardLike />
        <MetricChip label="ROE" value={`${metrics.roe.toFixed(1)} %`} />
        
        {metrics.analystConsensus?.rating && (
          <MetricChip 
            label="Consenso Analisti" 
            value={formatValue(metrics.analystConsensus.rating)} 
            isForwardLike
          />
        )}
         {metrics.analystConsensus?.targetPrice && (
          <MetricChip 
            label="Target Price Analisti" 
            value={`€ ${metrics.analystConsensus.targetPrice.toFixed(2)}`} 
            isForwardLike
          />
        )}
      </div>

      <hr className="border-slate-700 my-6" />

      <div>
        <h3 className="text-lg font-semibold text-sky-300 mb-3">Dettaglio Calcolo Valore Intrinseco</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
            <p className="text-slate-400">Mod. Utili (P/E)</p>
            <p className="text-sky-200 font-semibold text-base">{formatNumberDisplay(metrics.intrinsicValuePE, 2, " €")}</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
            <p className="text-slate-400">Mod. Patrimonio (P/B)</p>
            <p className="text-sky-200 font-semibold text-base">{formatNumberDisplay(metrics.intrinsicValueBV, 2, " €")}</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-md border border-slate-600/70">
            <p className="text-slate-400">Mod. DCF Semplificato</p>
            <p className="text-sky-200 font-semibold text-base">{formatNumberDisplay(metrics.intrinsicValueDCF, 2, " €")}</p>
            {metrics.dcfDiscountRateUsed !== null && metrics.dcfGrowthRateUsed !== null && (
                <p className="text-xs text-slate-500 mt-1">
                    (r: {formatNumberDisplay(metrics.dcfDiscountRateUsed * 100, 1, "%")}, g: {formatNumberDisplay(metrics.dcfGrowthRateUsed * 100, 1, "%")})
                </p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2 italic">
          Il "Valore Intrinseco (Min.)" mostrato sopra è il minore tra i valori positivi dei modelli calcolati.
        </p>
      </div>
    </section>
  );
};
// types.ts

export interface HistoricalData {
  // Keep these properties as they are in your Node.js historical data
  revenue?: Record<string, number | null>; // Key: ISO date string, Value: amount or null
  netIncome?: Record<string, number | null>; // Key: ISO date string, Value: amount or null
  totalDebt?: Record<string, number | null>; // Key: ISO date string, Value: amount or null.
  prices?: {
    date: Date; // Node.js returns ISO date string, we'll convert it to Date object in fetchStockData
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    adjClose?: number | null;
    volume?: number | null;
  }[];
}

export interface AnalystConsensusData {
  // This data is NOT in your Node.js backend response, keep it but it will be null
  firm?: string | null;
  rating?: string | null;
  targetPrice?: number | null;
}

// Modified BackendData to reflect Node.js response structure
// Based on your Node.js curl output, the top-level object only contains historicalData
export interface BackendData {
  // Most properties from the Python backend are not present in the Node.js backend response
  // Keep historicalData as it is the main data provided by Node.js backend
  historicalData?: HistoricalData | null;

  // If your Node.js backend also returns the ticker at the top level, uncomment this:
  // ticker?: string;
}


// StockMetrics interface - this defines the data your frontend components use.
// Properties not provided by the Node.js backend will need to be handled (e.g., display N/A)
export interface StockMetrics {
  ticker: string; // This will be set in fetchStockData based on the request
  companyName?: string | null; // Node.js backend doesn't provide this directly
  shortName?: string | null; // Node.js backend doesn't provide this directly
  currentPrice: number | null; // Will likely be derived from historical data or null

  // Intrinsic Value section - Needs frontend calculation based on historicalData
  intrinsicValue: number | null;
  intrinsicValuePE?: number | null;
  intrinsicValueBV?: number | null;
  intrinsicValueDCF?: number | null;
  dcfDiscountRateUsed?: number | null;
  dcfGrowthRateUsed?: number | null;

  marginOfSafety: number | null;

  // Metrics not provided by Node.js backend - will be null or derived if possible
  roe?: number | string | null;
  trailingPE?: number | string | null;
  forwardPE?: number | string | null;
  pegRatio?: number | string | null;
  priceToBook?: number | string | null;
  payoutRatio?: number | string | null;
  beta?: number | string | null;
  normalizedEPS?: number | null;
  analystConsensus?: AnalystConsensusData | null; // Will be null
  debtToEquity?: number | string | null;
  sector?: string | null;

  // --- Nuove metriche per confronto competitor --- - Not provided by Node.js backend
  enterpriseToEbitda?: number | string | null;
  dividendYield?: number | string | null;
  netProfitMargin?: number | string | null;
  grossMargin?: number | string | null;
  currentRatio?: number | string | null;
  revenueGrowth?: number | string | null;
  earningsGrowth?: number | string | null;
  inventoryTurnover?: number | string | null;
  assetTurnover?: number | string | null;
  // --- Fine nuove metriche ---

  historicalData?: HistoricalData; // Keep historical data

  isInsufficientData: boolean; // Determine based on presence of historical data
  message?: string; // For error messages
}

// Keep these interfaces as they are for frontend analysis logic
export interface StructuredAiReport {
  verdetto: string;
  perche_si: string;
  perche_no: string;
  decisione_buffett: string;
}

export interface CompetitorInfo {
  name: string;
  ticker: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface CompetitorData {
  competitors: CompetitorInfo[];
  searchSources?: GroundingChunk[] | null;
}

export type AiComparisonKeyArea = 'Valutazione' | 'Redditività' | 'SaluteFinanziaria' | 'Crescita' | 'EfficienzaOperativa';

export interface AiCompetitorComparisonReport {
  Valutazione?: string;
  Redditività?: string;
  SaluteFinanziaria?: string;
  Crescita?: string;
  EfficienzaOperativa?: string;
}

export interface AnalysisData {
  metrics: StockMetrics;
  aiReport: StructuredAiReport;
  competitorData?: CompetitorData | null;
  competitorDetails?: Record<string, StockMetrics | null>;
  aiCompetitorComparisonReport?: AiCompetitorComparisonReport | null;
}

// Keep FetchStockDataError as is
export interface FetchStockDataError {
  message: string;
  isInsufficientData?: boolean;
}

// Keep these interfaces as they are
export type ActiveViewType = 'analyzer' | 'screener' | 'database' | 'future';

export interface ScreenerCriteria {
  minRoe: number;
  maxPE: number;
  maxPB: number;
  maxDE: number;
}

export interface SectorAverageMetrics {
  sector: string;
  pe: number | null;
  pb: number | null;
  roe: number | null;
  de: number | null;
}

export interface ScreenerPassStatus {
  roe: boolean;
  pe: boolean;
  pb: boolean;
  de: boolean;
}

export interface AppliedCriteriaDetails extends ScreenerCriteria {
  criteriaSource: 'Predefiniti dall\'utente' | 'Specifici del settore' | 'Fissi (scelta utente)';
}

export interface ScreenerResultEntry {
  stockMetrics: StockMetrics;
  appliedCriteriaDetails: AppliedCriteriaDetails;
  passStatus: ScreenerPassStatus;
  isInBasket: boolean;
  timestamp: string;
}

export interface AiAnalysisEntry {
  analysis: AnalysisData;
  timestamp: string;
}

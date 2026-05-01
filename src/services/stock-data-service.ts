// src/services/stock-data-service.ts
import { StockMetrics, FetchStockDataError, HistoricalData } from '../types';
// import yahooFinance from 'yahoo-finance2'; // This line is not needed in the frontend service

// Simplified local interfaces based on expected data structure from yahoo-finance2
// interface SimplifiedQuoteSummary { // This interface is not strictly needed here as we map to BackendData
//   [key: string]: any; // Allow any properties for flexibility
// }

// Interface defining the expected structure from the Python backend
interface BackendData {
  ticker: string;
  companyName: string | null;
  shortName: string | null;
  sector: string | null;
  currentPrice: number | null;
  roe: number | null; // As percentage from backend
  payoutRatio: number | null; // As percentage from backend
  beta: number | null;
  debtToEquity: number | null; // As ratio from backend
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  normalizedEPS: number | null;
  analystConsensus?: {
    rating: string | null;
    targetPrice: number | null;
  } | null;
  historicalData?: HistoricalData | null;

  // Nuove metriche attese dal backend
  enterpriseToEbitda?: number | null;
  dividendYield?: number | null; // Backend dovrebbe fornire come percentuale (es. 2.5 per 2.5%)
  netProfitMargin?: number | null; // Backend dovrebbe fornire come percentuale
  grossMargin?: number | null; // Backend dovrebbe fornire come percentuale (potrebbe essere 'grossMargins')
  currentRatio?: number | null;
  revenueGrowth?: number | null; // Backend dovrebbe fornire come percentuale (TTM)
  earningsGrowth?: number | null; // Backend dovrebbe fornire come percentuale (TTM)
  inventoryTurnover?: number | null;
  assetTurnover?: number | null;
}

// Simplified interface for historical data items
// interface SimplifiedHistoricalDataItem { // This interface is not strictly needed here as we map to HistoricalDataPoint
//   date: Date;
//   low: number;
//   close: number;
//   adjClose: number | undefined;
//   volume: number;
// }

const BACKEND_URL = 'http://localhost:5000/api/stockdata'; // Assicurati che il server backend sia in esecuzione su questa porta

// Interface for the overall backend response, which might include an error
interface BackendApiResponse extends BackendData {
  error?: string; // For errors specific from backend logic
}

interface FetchStockDataOptions {
  dcfDiscountRate?: number; // e.g., 0.09 for 9%
  dcfGrowthRate?: number; // e.g., 0.015 for 1.5%
}

const cleanAndFormatMetric = (value: number | null | undefined, toFixedDigits: number = 2): number | null => {
  if (typeof value === 'number' && !isNaN(value)) {
    return parseFloat(value.toFixed(toFixedDigits));
  }
 return null;
};


export const fetchStockData = async (
  ticker: string,
  options?: FetchStockDataOptions,
  signal?: AbortSignal // Add signal parameter here
): Promise<StockMetrics | FetchStockDataError> => {
  const upperTicker = ticker.toUpperCase();
  try {
    const url = `${BACKEND_URL}/${upperTicker}`;
    console.log(`Fetching data from backend: ${url}`); // Log the URL being fetched
    const response = await fetch(url, { signal }); // Pass the signal to the fetch call

    if (!response.ok) {
      const errorText = await response.text(); // Get potential error message from backend
      console.error(`Backend response not OK for ${upperTicker}: ${response.status} - ${errorText}`);
      let message = `Errore del server (${response.status}). Riprova più tardi.`;
      if (response.status === 404) {
        message = `Ticker '${upperTicker}' non trovato o dati insufficienti. Verifica il simbolo del ticker.`;
      } else if (errorText) {
        // If backend provided an error message, use it.
        // We might need to parse different error formats depending on backend
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            message = `Errore dal backend: ${errorJson.error}`;
          } else {
            message = `Errore dal backend: ${errorText}`; // Fallback to raw text
          }
        } catch (e) {
          message = `Errore dal backend: ${errorText}`; // Fallback to raw text if not JSON
        }
      }
      return { message, isInsufficientData: true };
    }

    const backendData: BackendApiResponse = await response.json();

    // Check for backend-specific errors in the response body
    if (backendData.error) {
        console.error(`Backend returned an error for ${upperTicker}: ${backendData.error}`);
        return { message: `Errore dal backend: ${backendData.error}`, isInsufficientData: true };
    }

    // Basic check for essential data from backend
    if (!backendData || typeof backendData.currentPrice !== 'number' || backendData.currentPrice <= 0) {
       const message = `Dati non trovati o insufficienti per '${upperTicker}' dal backend.`;
       console.warn(message, backendData); // Log the received data for inspection
       return { message, isInsufficientData: true };
    }

    // Map backend data to frontend StockMetrics type
    const stockMetrics: StockMetrics = {
      ticker: backendData.ticker,
      companyName: backendData.companyName,
      shortName: backendData.shortName,
      sector: backendData.sector,
      currentPrice: cleanAndFormatMetric(backendData.currentPrice, 2) as number,
      roe: cleanAndFormatMetric(backendData.roe, 1), // Assuming backend sends percentage
      payoutRatio: cleanAndFormatMetric(backendData.payoutRatio, 1), // Assuming backend sends percentage
      beta: cleanAndFormatMetric(backendData.beta, 2),
      debtToEquity: cleanAndFormatMetric(backendData.debtToEquity, 2), // Assuming backend sends ratio
      trailingPE: cleanAndFormatMetric(backendData.trailingPE, 2),
      forwardPE: cleanAndFormatMetric(backendData.forwardPE, 2),
      pegRatio: cleanAndFormatMetric(backendData.pegRatio, 2),
      priceToBook: cleanAndFormatMetric(backendData.priceToBook, 2),
      normalizedEPS: cleanAndFormatMetric(backendData.normalizedEPS, 2) as number,
      analystConsensus: backendData.analystConsensus ? {
        rating: backendData.analystConsensus.rating,
        targetPrice: cleanAndFormatMetric(backendData.analystConsensus.targetPrice, 2),
      } : null,
      historicalData: backendData.historicalData ? { // Ensure historicalData mapping is correct
        revenue: backendData.historicalData.revenue ?? null,
        netIncome: backendData.historicalData.netIncome ?? null,
        totalDebt: backendData.historicalData.totalDebt ?? null,
        prices: backendData.historicalData.prices ? backendData.historicalData.prices.map(item => ({
          date: new Date(item.date), // Ensure date is a Date object
          open: cleanAndFormatMetric(item.open, 2) as number | undefined,
          high: cleanAndFormatMetric(item.high, 2) as number | undefined,
          low: cleanAndFormatMetric(item.low, 2),
          close: cleanAndFormatMetric(item.close, 2),
          adjClose: cleanAndFormatMetric(item.adjClose, 2),
          volume: cleanAndFormatMetric(item.volume, 0), // Volume typically integer
        })) : [],
      } : null,

      // Mapping for the new metrics
      enterpriseToEbitda: cleanAndFormatMetric(backendData.enterpriseToEbitda, 2),
      dividendYield: cleanAndFormatMetric(backendData.dividendYield, 2), // Assuming percentage
      netProfitMargin: cleanAndFormatMetric(backendData.netProfitMargin, 1), // Assuming percentage
      grossMargin: cleanAndFormatMetric(backendData.grossMargin, 1), // Assuming percentage
      currentRatio: cleanAndFormatMetric(backendData.currentRatio, 2),
      revenueGrowth: cleanAndFormatMetric(backendData.revenueGrowth, 1), // Assuming percentage
      earningsGrowth: cleanAndFormatMetric(backendData.earningsGrowth, 1), // Assuming percentage
      inventoryTurnover: cleanAndFormatMetric(backendData.inventoryTurnover, 2),
      assetTurnover: cleanAndFormatMetric(backendData.assetTurnover, 2),

      // AI Analysis Model (Simplified) - These will likely need to be calculated client-side
      // unless your backend returns them. Based on the BackendData interface,
      // the backend does not seem to calculate these.
      // For now, we will set them to defaults or null if not provided by backend.
      // You will need to implement the AI analysis logic in the frontend based on the fetched data.
      intrinsicValue: 0, // Placeholder - Needs frontend calculation
      intrinsicValuePE: null, // Placeholder - Needs frontend calculation
      intrinsicValueBV: null, // Placeholder - Needs frontend calculation
      intrinsicValueDCF: null, // Placeholder - Needs frontend calculation
      dcfDiscountRateUsed: options?.dcfDiscountRate ?? 0.09,
      dcfGrowthRateUsed: options?.dcfGrowthRate ?? 0.015,
      marginOfSafety: 0, // Placeholder - Needs frontend calculation

      // isInsufficientData should be determined based on essential metrics
      isInsufficientData: typeof backendData.currentPrice !== 'number' || backendData.currentPrice <= 0 || !backendData.companyName,
    };

    // You will need to add the AI analysis logic here in the frontend
    // using the fetched stockMetrics data.

    return stockMetrics;

  } catch (error: any) {
    // Check if the error is due to abortion
    if (error.name === 'AbortError') {
        console.log('Fetch request aborted.');
        throw error; // Re-throw the AbortError
    }
    console.error(`Error fetching stock data for ${upperTicker} from backend:`, error); // Log the error

    let message = "Si è verificato un errore durante la comunicazione con il server.";
    if (error instanceof TypeError) {
      // This often indicates a network error (e.g., server not reachable, CORS issues)
      message = `Errore di rete: Impossibile raggiungere il server backend a ${BACKEND_URL}. Assicurati che il server sia in esecuzione e accessibile.`;
    } else if (error && error.message) {
      message = `Errore: ${error.message}`;
    }
    return { message, isInsufficientData: true };
  }
};

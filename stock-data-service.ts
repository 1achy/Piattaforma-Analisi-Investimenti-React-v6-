// src/services/stock-data-service.ts
'use server';

import yahooFinance from 'yahoo-finance2';
// Removed specific type imports for HistoricalHistoryResult, Quote, and QuoteSummaryResult

export interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

async function getCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  if (cache.has(cacheKey)) {
    const entry = cache.get(cacheKey)!;
    if (Date.now() < entry.expiry) {
      return entry.data as T;
    }
    cache.delete(cacheKey); // Expired
  }

  const data = await fetchFn();
  if (data) {
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_DURATION_MS });
  }
  return data;
}

export async function getHistoricalData(
  ticker: string,
  period: '1y' | '6mo' | '3mo' = '1y', // Default to 1 year
  interval: '1d' | '1wk' | '1mo' = '1d' // Default to 1 day
): Promise<HistoricalDataPoint[]> {
  const cacheKey = `historical-${ticker}-${period}-${interval}`;

  try {
    const rawData = await getCachedData<any>(cacheKey, () => // Using any type as specific types are removed
      yahooFinance.historical(ticker, { period1: getPeriodStartDate(period), interval })
    );

    if (!rawData || rawData.length === 0) {
      console.warn(`No historical data found for ${ticker} with period ${period} and interval ${interval}`);
      return [];
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for comparison

    return rawData.map((item: any) => ({ // Using any type for item
      date: new Date(item.date), // Ensure item.date is treated as a Date object
      open: item.open ?? 0,
      high: item.high ?? 0,
      low: item.low ?? 0,
      close: item.close ?? 0,
      volume: item.volume ?? 0,
      adjClose: item.adjClose
    }))
    .filter((item: HistoricalDataPoint) => { // Filter using defined interface
      // Ensure essential data exists and filter out any dates in the future
      return typeof item.open === 'number' && typeof item.high === 'number' && typeof item.low === 'number' && typeof item.close === 'number' && item.date instanceof Date && !isNaN(item.date.getTime()) && item.date <= today;
    });

  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error);
    // Consider re-throwing or returning a specific error structure if needed by the caller
    throw new Error(`Failed to fetch historical data for ${ticker}. Reason: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getPeriodStartDate(period: '1y' | '6mo' | '3mo'): string {
    const date = new Date();
    switch (period) {
        case '1y':
            date.setFullYear(date.getFullYear() - 1);
            break;
        case '6mo':
            date.setMonth(date.getMonth() - 6);
            break;
        case '3mo':
            date.setMonth(date.getMonth() - 3);
            break;
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}


export async function getStockInfo(ticker: string): Promise<any | null> { // Using any type as specific types are removed
  const cacheKey = `stock-info-${ticker}`;
  try {
    const stockInfo = await getCachedData<any>(cacheKey, () =>
      yahooFinance.quoteSummary(ticker, { modules: ["price", "summaryProfile"] })
    );
    return stockInfo?.price ?? null; // Using optional chaining

  } catch (error) {
    console.error(`Error fetching stock info for ${ticker}:`, error);
    return null;
  }
}
import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import yahooFinance from 'yahoo-finance2';

const app = express(); // Create an Express application instance
const port = 5000;

app.use(cors({ origin: '*' }));

const cache = new NodeCache({ stdTTL: 900 }); // 15 minutes TTL

app.get('/api/stockdata/:ticker_symbol', async (req, res) => {
  const tickerSymbol = req.params.ticker_symbol;
  console.log(`Request received for ${tickerSymbol}`);

  const cachedData = cache.get(tickerSymbol);
  if (cachedData) {
    console.log(`Returning cached data for ${tickerSymbol}`);
    return res.json(cachedData);
  }

  try {
    const quoteSummary = await yahooFinance.quoteSummary(tickerSymbol, {
      modules: [
        "price",
        "summaryProfile",
        "financialData",
        "summaryDetail",
        "defaultKeyStatistics",
        "recommendationTrend",
        "assetProfile",
        // *** AGGIUNGI QUESTI MODULI PER I DATI STORICI FINANZIARI ***
        "incomeStatementHistory",
        "balanceSheetHistory"
        // Puoi aggiungere altri moduli se necessario, ad esempio "cashflowStatementHistory"
      ]
    });

    const historicalDataRawPrices = await yahooFinance.historical(tickerSymbol, {
      period1: '2015-01-01', // Start date for historical data (adjust as needed)
      interval: '1d' // Daily interval
    });

    // Check if essential data is present (still checking price data for basic validity)
    if (!quoteSummary || !quoteSummary.price || (!quoteSummary.price.regularMarketPrice && !quoteSummary.price.currentPrice)) {
      return res.status(404).json({ error: `Dati di prezzo non trovati o insufficienti per '${tickerSymbol}'. Verifica che il ticker sia corretto.` });
    }

    // --- Data Extraction and Cleaning ---
    const cleanValue = (value) => {
        if (value === null || value === undefined) {
            return null;
        }
         // Non convertire le date qui, il frontend le convertirà
        if (typeof value === 'number' && isNaN(value)) {
            return null;
        }
        return value;
    };

    const priceData = quoteSummary.price || {};
    const summaryProfileData = quoteSummary.summaryProfile || {};
    const financialData = quoteSummary.financialData || {};
    const summaryDetail = quoteSummary.summaryDetail || {};
    const defaultKeyStatistics = quoteSummary.defaultKeyStatistics || {};
    const recommendationTrend = quoteSummary.recommendationTrend || {};
    const assetProfile = quoteSummary.assetProfile || {};
    const incomeStatementHistory = quoteSummary.incomeStatementHistory || {};
    const balanceSheetHistory = quoteSummary.balanceSheetHistory || {};


    const currentPrice = cleanValue(priceData.currentPrice || priceData.regularMarketPrice);
    // Assicurati di ottenere normalizedEPS dal modulo corretto se disponibile, altrimenti usa trailingEPS
    const normalizedEPS = cleanValue(defaultKeyStatistics.normalizedEPS || summaryDetail.trailingEPS);

    // *** Historical Data Processing - Combina tutti i dati storici qui ***
    const historicalData = {
        // Mappa i dati storici finanziari annuali
        revenue: incomeStatementHistory.incomeStatementHistory ? incomeStatementHistory.incomeStatementHistory.reduce((acc, item) => {
             if (item.endDate && item.totalRevenue !== undefined) {
                 acc[item.endDate.toISOString().split('T')[0]] = cleanValue(item.totalRevenue); // Usa la data come chiave
             }
             return acc;
        }, {}) : {},
        netIncome: incomeStatementHistory.incomeStatementHistory ? incomeStatementHistory.incomeStatementHistory.reduce((acc, item) => {
            if (item.endDate && item.netIncome !== undefined) {
                 acc[item.endDate.toISOString().split('T')[0]] = cleanValue(item.netIncome);
             }
            return acc;
        }, {}) : {},
        totalDebt: balanceSheetHistory.balanceSheetStatements ? balanceSheetHistory.balanceSheetStatements.reduce((acc, item) => {
             if (item.endDate && item.totalDebt !== undefined) {
                 acc[item.endDate.toISOString().split('T')[0]] = cleanValue(item.totalDebt);
             }
            return acc;
        }, {}) : {},
        // Mappa i dati storici dei prezzi giornalieri
        prices: historicalDataRawPrices ? historicalDataRawPrices.map(item => ({
            date: item.date, // Mantieni Date object o converti in stringa ISO
            open: cleanValue(item.open),
            high: cleanValue(item.high),
            low: cleanValue(item.low),
            close: cleanValue(item.close),
            adjClose: cleanValue(item.adjClose),
            volume: cleanValue(item.volume),
        })) : [] // Assicurati che sia un array vuoto se non ci sono dati
    };


    const stockData = {
      ticker: tickerSymbol,
      companyName: cleanValue(summaryProfileData.longName || priceData.shortName),
      shortName: cleanValue(priceData.shortName),
      sector: cleanValue(summaryProfileData.sector || assetProfile.sector),
      currentPrice: currentPrice,

      // Quality and risk metrics
      roe: cleanValue(financialData.returnOnEquity),
      // Controlla dove si trova payoutRatio (financialData o summaryDetail) e converti in percentuale se necessario
      payoutRatio: cleanValue(financialData.payoutRatio !== undefined ? financialData.payoutRatio * 100 : summaryDetail.payoutRatio !== undefined ? summaryDetail.payoutRatio * 100 : null),
      beta: cleanValue(summaryDetail.beta), // Beta is usually in summaryDetail
      debtToEquity: cleanValue(financialData.debtToEquity), // Financial data
      currentRatio: cleanValue(financialData.currentRatio), // Financial data

      // Valuation metrics
      trailingPE: cleanValue(summaryDetail.trailingPE), // Summary detail
      forwardPE: cleanValue(summaryDetail.forwardPE), // Summary detail
      pegRatio: cleanValue(summaryDetail.pegRatio), // Summary detail
      priceToBook: cleanValue(summaryDetail.priceToBook), // Summary detail
      normalizedEPS: normalizedEPS, // Estratto sopra
      enterpriseToEbitda: cleanValue(financialData.enterpriseToEbitda), // Financial data
      // Controlla dove si trova dividendYield (financialData o summaryDetail) e converti in percentuale se necessario
      dividendYield: cleanValue(financialData.dividendYield !== undefined ? financialData.dividendYield * 100 : summaryDetail.dividendYield !== undefined ? summaryDetail.dividendYield * 100 : null),


      // Efficiency and operational metrics
      // Controlla dove si trovano profitMargins e grossMargins (financialData) e converti in percentuale
      netProfitMargin: cleanValue(financialData.profitMargins !== undefined ? financialData.profitMargins * 100 : null),
      grossMargin: cleanValue(financialData.grossMargins !== undefined ? financialData.grossMargins * 100 : null),
      // Controlla dove si trovano revenueGrowth e earningsGrowth (financialData) e converti in percentuale
      revenueGrowth: cleanValue(financialData.revenueGrowth !== undefined ? financialData.revenueGrowth * 100 : null),
      earningsGrowth: cleanValue(financialData.earningsGrowth !== undefined ? financialData.earningsGrowth * 100 : null),
      inventoryTurnover: cleanValue(defaultKeyStatistics.inventoryTurnover), // Default key statistics
      assetTurnover: cleanValue(financialData.assetTurnover), // Financial data

      // Analyst consensus
      analystConsensus: {
          // Semplifica il rating basato sui dati Strong Buy e Buy
          rating: recommendationTrend.trend?.[0] ? cleanValue(recommendationTrend.trend[0].strongBuy + recommendationTrend.trend[0].buy) : null,
          targetPrice: recommendationTrend.trend?.[0] ? cleanValue(recommendationTrend.trend[0].targetMeanPrice) : null // Recommendation trend
      },

      // Historical Data - Questo è l'oggetto historicalData completo creato sopra
      historicalData: historicalData
    };

    cache.set(tickerSymbol, stockData);
    console.log(`Data for ${tickerSymbol} successfully processed and cached.`); // Log successful processing

    res.json(stockData);

  } catch (error) {
    // Log the error for debugging
    console.error(`Error fetching data for ${tickerSymbol}:`, error);
    // Check for rate limit error specifically
    if (error.message && error.message.includes('rate limit')) {
      return res.status(429).json({ error: `Yahoo Finance ha limitato le richieste. La cache è stata appena creata, attendi qualche minuto prima di riprovare.` });
    }
    if (error.message && error.message.includes('Failed to get crumbs')) {
        // Specific handling for crumbs error
      return res.status(429).json({ error: `Errore nel recupero dati da Yahoo Finance. Riprova più tardi. (${error.message})` });
    }
    // Handling for ticker not found or no data from Yahoo Finance
     if (error.message && (error.message.includes('Could not find ticker') || error.message.includes('No data received'))) {
         return res.status(404).json({ error: `Ticker '${tickerSymbol}' non trovato o dati non disponibili da Yahoo Finance.` });
     }

    res.status(500).json({ error: `Si è verificato un errore interno del server durante l\'elaborazione di ${tickerSymbol}.` });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});

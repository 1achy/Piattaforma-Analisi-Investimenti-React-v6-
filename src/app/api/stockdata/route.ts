// src/app/api/stockdata/[tickerSymbol]/route.ts
import { NextResponse } from 'next/server';
import { fetchStockData } from '../../../../services/stockDataService'; // Assicurati che il percorso relativo sia corretto

// Define the GET handler for the API route
export async function GET({ params }: { params: { tickerSymbol: string } }) {
  const tickerSymbol = params.tickerSymbol.toUpperCase(); // Extract ticker from dynamic segment and standardize
  console.log(`API: Received request for ticker: ${tickerSymbol}`);

  if (!tickerSymbol) {
 return NextResponse.json({ error: "Ticker symbol missing from path" }, { status: 400 });
  }

  try {
    const stockData = await fetchStockData(tickerSymbol);

    if (!stockData || ('message' in stockData && (stockData.message.includes("Dati non trovati o insufficienti") || stockData.message.includes("Errore dal server: Errore HTTP: 404")))) {
      return NextResponse.json({ error: `Dati non trovati o insufficienti per '${tickerSymbol}'. Verifica che il ticker sia corretto.` }, { status: 404 });
    }

    if ('message' in stockData) { // Handle other errors returned by fetchStockData
      return NextResponse.json({ error: `Errore nel recupero dati per ${tickerSymbol}: ${stockData.message}` }, { status: 500 });
    }

    // Data is valid StockMetrics
    return NextResponse.json(stockData);
  } catch (error) {
 console.error(`API: Error fetching data for ${tickerSymbol}:`, error);

    // Provide more specific error messages based on the error type if possible
    if (error instanceof Error) {
         if (error.message.includes("Dati non trovati o insufficienti") || error.message.includes("Failed to fetch")) {
             return NextResponse.json({ error: error.message }, { status: 404 });
         }
    }
       return NextResponse.json({ error: `Si è verificato un errore interno del server durante l'elaborazione di ${tickerSymbol}.` }, { status: 500 });
    }
  }
// You can define other HTTP methods (POST, PUT, DELETE, etc.) here if needed
// export async function POST(request: Request) { ... }
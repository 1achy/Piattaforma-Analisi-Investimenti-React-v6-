import express, { Request, Response, Router } from 'express';
import { getAllStockData } from '/src/services/stock-data-service'; // Assicurati che il percorso sia corretto

const router: Router = express.Router();

router.get('/api/stockdata/:tickerSymbol', async (req: Request, res: Response) => {
  const tickerSymbol = req.params.tickerSymbol.toUpperCase(); // Converti in maiuscolo per standardizzazione
  console.log(`Received request for ticker: ${tickerSymbol}`);

  try {
    const stockData = await getAllStockData(tickerSymbol);
    res.json(stockData);
  } catch (error) {
    console.error(`Error fetching data for ${tickerSymbol}:`, error);
    // Adatta il messaggio di errore e lo stato in base al tipo di errore
    if (error instanceof Error) {
         if (error.message.includes("Dati non trovati o insufficienti")) {
             res.status(404).json({ error: error.message });
         } else {
             res.status(500).json({ error: "Si è verificato un errore interno del server." });
         }
    } else {
       res.status(500).json({ error: "Si è verificato un errore interno del server." });
    }
  }
});

export default router;
import express, { Request, Response, Router } from 'express';
import { getAllStockData } from '../services/stock-data-service'; // Assicurati che il percorso sia corretto

const router: Router = express.Router();

router.get('/api/stockdata/:tickerSymbol', async (req: Request, res: Response) => {
  const tickerSymbol = req.params.tickerSymbol.toUpperCase(); // Converti in maiuscolo per standardizzazione
  console.log(`Received request for ticker: ${tickerSymbol}`);

  try {
    const stockData = await getAllStockData(tickerSymbol);
    res.json(stockData);
  } catch (error) {
    console.error(`Error fetching data for ${tickerSymbol}:`, error);
    // Adatta il messaggio di errore e lo stato in base al tipo di errore
    if (error instanceof Error) {
         if (error.message.includes("Dati non trovati o insufficienti")) {
             res.status(404).json({ error: error.message });
         } else {
             res.status(500).json({ error: "Si è verificato un errore interno del server." });
         }
    } else {
       res.status(500).json({ error: "Si è verificato un errore interno del server." });
    }
  }
});

export default router;
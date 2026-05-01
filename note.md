I Parametri del Calcolo: Una Spiegazione Dettagliata
L'applicazione "Analista Valore AI" non si affida a un solo metodo, ma calcola il valore intrinseco di un'azione utilizzando tre diversi approcci per poi scegliere la stima più conservativa. Ogni modello si basa su una combinazione di dati reali (recuperati da Yahoo Finance) e ipotesi di valutazione (parametri fissati nel codice per mantenere un approccio prudente, ispirato al value investing).

Ecco una scomposizione dettagliata dei parametri usati per ogni modello.

Modello 1: Valore basato sugli Utili (P/E Multiples)
Obiettivo: Stimare il valore dell'azione ipotizzando che il mercato la valuti a un multiplo "giusto" e conservativo dei suoi profitti reali.

Formula nel Codice: Valore = EPS Normalizzato * P/E Obiettivo

Parametro

Valore Utilizzato

Descrizione

Dato di Input





EPS Normalizzato

Calcolato dai dati

È l'Utile Normalizzato per Azione. Viene calcolato prendendo l'utile al netto di voci straordinarie e dividendolo per il numero di azioni in circolazione. Questo ci dà una visione più pulita della reale capacità di guadagno dell'azienda.

Ipotesi di Valutazione





P/E Obiettivo

8.5

È un Rapporto Prezzo/Utili che consideriamo "equo" e conservativo. Un valore di 8.5, ispirato alla formula originale di Benjamin Graham, è adatto per aziende mature e stabili e ci protegge da valutazioni eccessivamente ottimistiche.

Modello 2: Valore basato sul Patrimonio (Book Value)
Obiettivo: Determinare il valore "tangibile" dell'azione, ovvero quanto spetterebbe agli azionisti se l'azienda venisse liquidata oggi.

Formula nel Codice: Valore = Valore Contabile per Azione (BVPS)

Parametro

Valore Utilizzato

Descrizione

Dato di Input





BVPS

Calcolato dai dati

È il Valore Contabile per Azione. Si calcola dividendo il "Patrimonio Netto" (Total Stockholder Equity) per il numero di azioni. Rappresenta una solida base di valutazione.

Modello 3: Valore basato sui Flussi di Cassa (DCF Semplificato)
Obiettivo: Calcolare il valore attuale di tutti i flussi di cassa futuri che l'azienda si prevede genererà. È il metodo teoricamente più corretto.

Formula nel Codice: Valore = FCFPS / (Tasso di Sconto - Tasso di Crescita)

Parametro

Valore Utilizzato

Descrizione

Dato di Input





FCFPS

Calcolato dai dati

È il Flusso di Cassa Libero per Azione (Free Cash Flow Per Share). Rappresenta la cassa reale che rimane all'azienda dopo le spese operative e gli investimenti.

Ipotesi di Valutazione





Tasso di Sconto (r)

9% (0.09)

Rappresenta il rendimento annuo minimo che un investitore si aspetta per compensare il rischio dell'investimento. Un valore del 9% è uno standard conservativo nel settore.

Tasso di Crescita (g)

1.5% (0.015)

È la stima della crescita perpetua dei flussi di cassa dell'azienda. Per essere prudenti, questo valore è molto basso, inferiore alla crescita media a lungo termine del PIL globale.

Il Passo Finale: La Scelta Conservativa
Una volta calcolati questi tre valori, il nostro algoritmo non fa una media. Per massimizzare il margine di sicurezza, seleziona automaticamente il valore più basso tra i tre. Questo ci assicura che la nostra valutazione finale sia sempre basata sullo scenario più prudente.
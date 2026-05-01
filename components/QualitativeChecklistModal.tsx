
import React, { useEffect } from 'react';

interface QualitativeChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloseIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);


export const QualitativeChecklistModal: React.FC<QualitativeChecklistModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="checklist-title"
    >
      <div 
        className="bg-slate-800 text-slate-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="sticky top-0 bg-slate-800/90 backdrop-blur-sm px-6 py-4 border-b border-slate-700 flex justify-between items-center z-10">
          <h2 id="checklist-title" className="text-xl sm:text-2xl font-bold text-cyan-400">
            Checklist Qualitativa Essenziale
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-cyan-400 transition-colors"
            aria-label="Chiudi modale"
          >
            <CloseIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 text-sm sm:text-base leading-relaxed">
          <p>
            La tua applicazione "Analista Valore AI" è un motore quantitativo di prim'ordine. Ti dice se un'azione è numericamente attraente. Ma per prendere una decisione di acquisto con vera fiducia, devi integrare quei dati con il tuo giudizio umano e rispondere a domande che i numeri da soli non possono risolvere.
          </p>
          <p>
            Usa i risultati della tua app come punto di partenza e poi completa la tua analisi con questa checklist qualitativa.
          </p>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-sky-300">✅ 1. Capire il Business e il suo "Moat" (Vantaggio Competitivo)</h3>
            <p>
              I dati dell'app, come un ROE elevato, suggeriscono la presenza di un buon business. Il tuo compito è capire <strong>perché</strong> lo è.
            </p>
            <div className="pl-4 border-l-2 border-slate-700 space-y-2 py-1">
              <p><strong>Il Test dell'Idiota:</strong> Saresti in grado di spiegare a un bambino come questa azienda fa soldi in meno di due minuti? Se la risposta è no, probabilmente sei fuori dal tuo "cerchio di competenza". (Principio fondamentale di Buffett).</p>
              <p><strong>Qual è il Vantaggio Competitivo (Moat)?</strong> Perché i clienti scelgono questa azienda e non i suoi concorrenti?</p>
              <ul className="list-disc list-outside ml-5 space-y-1 text-slate-300">
                <li><strong>Brand Forte:</strong> (Es. Ferrari, Coca-Cola) I clienti sono disposti a pagare di più per il marchio?</li>
                <li><strong>Costi di Transizione (Switching Costs):</strong> (Es. Microsoft Windows) È difficile o costoso per un cliente passare a un concorrente?</li>
                <li><strong>Effetto Rete (Network Effect):</strong> (Es. Visa, Facebook) Il servizio diventa più utile man mano che più persone lo usano?</li>
                <li><strong>Vantaggio di Costo:</strong> (Es. Amazon) L'azienda può produrre o distribuire a un costo inferiore rispetto a tutti gli altri?</li>
                <li><strong>Brevetti o Licenze Esclusive:</strong> (Es. Aziende farmaceutiche)</li>
              </ul>
              <p><strong>Quanto è Durevole il Moat?</strong> Questo vantaggio competitivo sarà ancora valido tra 10-20 anni, o una nuova tecnologia potrebbe distruggerlo?</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-sky-300">✅ 2. Valutare la Qualità e l'Integrità del Management</h3>
            <p>
              Buffett dice che investe in aziende che anche un idiota può gestire, ma preferisce di gran lunga un management eccellente.
            </p>
            <div className="pl-4 border-l-2 border-slate-700 space-y-2 py-1">
              <p><strong>Leggi la Lettera agli Azionisti:</strong> Leggi le ultime 2-3 lettere annuali del CEO. Il linguaggio è chiaro, diretto e onesto? Il management ammette gli errori o dà sempre la colpa a fattori esterni?</p>
              <p><strong>Allocazione del Capitale:</strong> Come usa il management i profitti generati dall'azienda (il Free Cash Flow)?</p>
              <ul className="list-disc list-outside ml-5 space-y-1 text-slate-300">
                <li><strong>Acquisizioni:</strong> Fanno acquisizioni intelligenti che si integrano bene nel business o pagano troppo per espandersi in settori che non capiscono?</li>
                <li><strong>Buyback (Riacquisto di Azioni):</strong> Riacquistano azioni proprie solo quando il prezzo è basso (creando valore per gli azionisti) o anche quando è alto?</li>
                <li><strong>Dividendi:</strong> Il Payout Ratio che vedi nella tua app è sostenibile? Lascia abbastanza denaro per reinvestire nella crescita?</li>
              </ul>
              <p><strong>"Skin in the Game":</strong> I dirigenti possiedono una quantità significativa di azioni della società? Se il loro patrimonio è legato al successo dell'azienda, le loro decisioni saranno più allineate a quelle degli azionisti.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-sky-300">✅ 3. Analisi di Scenario e "Pre-Mortem"</h3>
            <p>
              La tua app ti dà una stima del valore intrinseco basata sui dati attuali. Il tuo compito è pensare al futuro.
            </p>
            <div className="pl-4 border-l-2 border-slate-700 space-y-2 py-1">
              <p><strong>Lo Scenario Peggiore (Bear Case):</strong> Cosa dovrebbe succedere per far crollare il prezzo e invalidare la tua tesi? Immagina tra un anno che il tuo investimento sia stato un disastro. Quali sono state le cause? (Es. una nuova legge, l'arrivo di un concorrente aggressivo, un cambiamento tecnologico). Questo esercizio ti aiuta a vedere i rischi che potresti aver ignorato.</p>
              <p><strong>Lo Scenario Migliore (Bull Case):</strong> Cosa deve accadere affinché l'azione raggiunga la parte alta della tua stima di valore? (Es. successo di un nuovo prodotto, espansione in un nuovo mercato).</p>
              <p><strong>Test di Resilienza:</strong> Come si comporterebbe l'azienda in una grave recessione? E con un'inflazione al 5%?</p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-sky-300">Conclusione: Il Tuo Ruolo come Investitore</h3>
            <p>
              L'app "Analista Valore AI" fa il lavoro di un analista quantitativo. Ti fornisce un elenco di candidati promettenti e un'analisi numerica.
            </p>
            <p>
              Il tuo ruolo è quello di agire come un investigatore e un manager di portafoglio. Usi quei dati per approfondire la storia, capire la qualità del business e del management, e infine prendere una decisione basata su una tesi completa, non solo su un P/E basso.
            </p>
            <p>
              <strong>Se l'analisi quantitativa della tua app (il "Cosa") si allinea con la tua analisi qualitativa (il "Perché"), allora hai trovato un potenziale grande investimento.</strong>
            </p>
          </section>
        </div>
        <div className="sticky bottom-0 bg-slate-800/90 backdrop-blur-sm px-6 py-3 border-t border-slate-700 flex justify-end">
            <button
                onClick={onClose}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-colors duration-150"
            >
                Chiudi
            </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface TickerInputFormProps {
  ticker: string;
  setTicker: (ticker: string) => void;
  // onAnalyze prop is no longer needed if the button doesn't trigger analysis
  // onAnalyze: () => void;
  isLoading: boolean;
}

// Remove onAnalyze from props destructuring
export const TickerInputForm: React.FC<TickerInputFormProps> = ({ ticker, setTicker, isLoading }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Remove the call to onAnalyze()
    // onAnalyze();
    // The analysis is now triggered by state changes and useEffect in App.tsx
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-4"
    >
      <div className="flex-grow w-full sm:w-auto">
        <label htmlFor="ticker-input" className="sr-only">
          Stock Ticker
        </label>
        <input
          id="ticker-input"
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Es. ENI.MI, AAPL"
          className="w-full px-4 py-3 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-150 placeholder-slate-400 text-base"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="h-5 w-5" color="text-slate-900" />
            <span className="ml-2">Analizzando...</span>
          </>
        ) : (
          'Analizza'
        )}
      </button>
    </form>
  );
};

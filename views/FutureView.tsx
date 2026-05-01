
import React, { useState, useEffect, useCallback } from 'react';
import { SectorAverageMetrics } from '../types';
import { parseSectorAveragesCSV } from '../utils/csvParser';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const FutureView: React.FC = () => {
  const [sectorData, setSectorData] = useState<SectorAverageMetrics[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await parseSectorAveragesCSV('/data/sector_average_data.csv');
      if (data.length === 0) {
        setErrorMessage("Nessun dato di settore trovato o il file CSV è vuoto/malformato. Controlla il file '/data/sector_average_data.csv'.");
      }
      setSectorData(data);
    } catch (error) {
      console.error("Errore nel caricamento dei dati di settore:", error);
      setErrorMessage(`Impossibile caricare i dati medi di settore. ${error instanceof Error ? error.message : 'Errore sconosciuto.'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (
    index: number,
    metricKey: keyof Omit<SectorAverageMetrics, 'sector'>,
    value: string
  ) => {
    setSectorData(prevData => {
      const newData = [...prevData];
      const item = { ...newData[index] };
      
      if (value.trim().toUpperCase() === 'N/A' || value.trim() === '') {
        item[metricKey] = null;
      } else {
        const numValue = parseFloat(value.replace(',', '.')); // Handle comma as decimal separator
        item[metricKey] = isNaN(numValue) ? null : numValue;
      }
      newData[index] = item;
      return newData;
    });
  };

  const formatNumberForInput = (value: number | null): string => {
    if (value === null || typeof value === 'undefined') return 'N/A';
    return String(value);
  };

  const convertDataToCSV = (): string => {
    const headers = ['Settore', 'P/E Medio', 'P/B Medio', 'ROE Medio (%)', 'D/E Medio'];
    const rows = sectorData.map(item => [
      item.sector,
      item.pe !== null ? item.pe.toString() : 'N/A',
      item.pb !== null ? item.pb.toString() : 'N/A',
      item.roe !== null ? `${item.roe.toString()}%` : 'N/A', // Add % back for ROE
      item.de !== null ? item.de.toString() : 'N/A',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const handleDownloadCSV = () => {
    const csvString = convertDataToCSV();
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'modifiche_medie_settore.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  
  const metricColumns: { key: keyof Omit<SectorAverageMetrics, 'sector'>; label: string; placeholder?: string }[] = [
    { key: 'pe', label: 'P/E Medio', placeholder: 'es. 15.0' },
    { key: 'pb', label: 'P/B Medio', placeholder: 'es. 1.5' },
    { key: 'roe', label: 'ROE Medio (%)', placeholder: 'es. 15.5 (per 15.5%)' },
    { key: 'de', label: 'D/E Medio', placeholder: 'es. 0.5' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 bg-slate-800 rounded-xl shadow-lg text-center">
        <LoadingSpinner />
        <p className="text-slate-300 mt-2">Caricamento dati di settore...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 bg-red-800/30 border border-red-600/50 rounded-xl shadow-lg text-red-300" role="alert">
        <h2 className="text-xl font-semibold text-white mb-3">Errore</h2>
        <p>{errorMessage}</p>
        <button 
            onClick={fetchData} 
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors"
        >
            Riprova Caricamento
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg text-slate-100">
      <header className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Gestione Medie di Settore
        </h2>
        <p className="text-slate-300 text-sm sm:text-base">
          Visualizza e modifica i valori medi di P/E, P/B, ROE e D/E per ciascun settore.
          Le modifiche possono essere scaricate come un nuovo file CSV.
        </p>
         <p className="text-slate-400 text-xs mt-1">
          Nota: Per rendere le modifiche persistenti nell'applicazione, il file <code>public/data/sector_average_data.csv</code> dovrà essere sostituito manually con il file scaricato (se si esegue il progetto localmente).
        </p>
      </header>

      {sectorData.length === 0 && !isLoading && (
        <p className="text-slate-400 text-center py-5">Nessun dato di settore da visualizzare. Controlla il file CSV sorgente.</p>
      )}

      {sectorData.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg shadow-md border border-slate-700 mb-6">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-700/50">
                <tr>
                  <th scope="col" className="sticky left-0 bg-slate-700/50 px-4 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider z-10">
                    Settore
                  </th>
                  {metricColumns.map(col => (
                    <th key={col.key} scope="col" className="px-4 py-3 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {sectorData.map((item, index) => (
                  <tr key={item.sector + index} className="hover:bg-slate-700/40 transition-colors">
                    <td className="sticky left-0 bg-slate-800 hover:bg-slate-700/40 px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-100 z-10">
                      {item.sector}
                    </td>
                    {metricColumns.map(col => (
                      <td key={col.key} className="px-4 py-2 whitespace-nowrap text-sm">
                        <input
                          type="text" // Using text to allow "N/A" and better control over parsing
                          value={formatNumberForInput(item[col.key])}
                          onChange={(e) => handleInputChange(index, col.key, e.target.value)}
                          placeholder={col.placeholder || "N/A o numero"}
                          className="w-full px-2 py-1 bg-slate-700 text-slate-100 border border-slate-600 rounded-md focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors placeholder-slate-500 text-sm"
                          aria-label={`Valore per ${item.sector} - ${col.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 transition-all duration-150 ease-in-out"
          >
            Download Modifiche (.csv)
          </button>
        </>
      )}
    </div>
  );
};
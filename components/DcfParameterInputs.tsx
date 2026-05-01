import React from 'react';

interface DcfParameterInputsProps {
  discountRate: number;
  setDiscountRate: (value: number) => void;
  growthRate: number;
  setGrowthRate: (value: number) => void;
  isLoading: boolean;
}

export const DcfParameterInputs: React.FC<DcfParameterInputsProps> = ({
  discountRate,
  setDiscountRate,
  growthRate,
  setGrowthRate,
  isLoading,
}) => {
  const handleRateChange = (
    setter: (value: number) => void,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setter(numValue);
    } else if (value === "") {
      setter(0); // Or handle empty string as you see fit, e.g., keep previous value or set to a default.
    }
  };

  return (
    <div className="mt-4 p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700/50">
      <h3 className="text-md font-semibold text-sky-300 mb-3">
        Parametri Modello DCF Semplificato
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="dcf-discount-rate"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Tasso di Sconto (r) %
          </label>
          <input
            id="dcf-discount-rate"
            type="number"
            value={discountRate}
            onChange={(e) => handleRateChange(setDiscountRate, e.target.value)}
            placeholder="Es. 9"
            className="w-full px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-150 placeholder-slate-400"
            disabled={isLoading}
            step="0.1"
            aria-describedby="dcf-discount-rate-description"
          />
          <p id="dcf-discount-rate-description" className="mt-1 text-xs text-slate-400">
            Tasso di rendimento richiesto (es. 9 per 9%).
          </p>
        </div>
        <div>
          <label
            htmlFor="dcf-growth-rate"
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Tasso di Crescita (g) %
          </label>
          <input
            id="dcf-growth-rate"
            type="number"
            value={growthRate}
            onChange={(e) => handleRateChange(setGrowthRate, e.target.value)}
            placeholder="Es. 1.5"
            className="w-full px-3 py-2 bg-slate-700 text-slate-100 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-150 placeholder-slate-400"
            disabled={isLoading}
            step="0.1"
            aria-describedby="dcf-growth-rate-description"
          />
          <p id="dcf-growth-rate-description" className="mt-1 text-xs text-slate-400">
            Tasso di crescita perpetua atteso (es. 1.5 per 1.5%). Deve essere minore di (r).
          </p>
        </div>
      </div>
      {discountRate <= growthRate && (
        <p className="mt-3 text-xs text-red-400">
          Attenzione: Il tasso di sconto (r) deve essere maggiore del tasso di crescita (g).
        </p>
      )}
    </div>
  );
};
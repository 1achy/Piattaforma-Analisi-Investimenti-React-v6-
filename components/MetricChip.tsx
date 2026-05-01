
import React from 'react';

interface MetricChipProps {
  label: string;
  value: string;
  isSafe?: boolean;
  isWarning?: boolean;
  isDanger?: boolean;
  isForwardLike?: boolean; // For metrics like Forward P/E, EPS
}

export const MetricChip: React.FC<MetricChipProps> = ({
  label,
  value,
  isSafe = false,
  isWarning = false,
  isDanger = false,
  isForwardLike = false,
}) => {
  let chipClasses = 'bg-slate-700 border-slate-600';
  let valueClasses = 'text-cyan-400';
  let labelClasses = 'text-slate-300';

  if (isSafe) {
    chipClasses = 'bg-green-500/20 border-green-500/40';
    valueClasses = 'text-green-300';
    labelClasses = 'text-green-400/80';
  } else if (isWarning) {
    chipClasses = 'bg-yellow-500/20 border-yellow-500/40';
    valueClasses = 'text-yellow-300';
    labelClasses = 'text-yellow-400/80';
  } else if (isDanger) {
    chipClasses = 'bg-red-500/20 border-red-500/40';
    valueClasses = 'text-red-300';
    labelClasses = 'text-red-400/80';
  } else if (isForwardLike) {
    valueClasses = 'text-sky-300'; // A slightly different blue for forward-looking/special items
  }

  return (
    <div
      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg border text-sm sm:text-base transition-colors duration-150 ${chipClasses}`}
    >
      <span className={`${labelClasses} mr-1.5`}>{label}:</span>
      <span className={`${valueClasses} font-semibold`}>{value}</span>
    </div>
  );
};
    
import React from 'react';

interface LoadingSpinnerProps {
  size?: string; // e.g., 'h-8 w-8'
  color?: string; // e.g., 'text-cyan-500'
  className?: string; // additional classes
  children?: React.ReactNode; // For adding text next to spinner
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'h-8 w-8', 
  color = 'text-cyan-400',
  className = '',
  children
}) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg
        className={`animate-spin ${size} ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {children && <div className="ml-3 text-sm text-slate-300">{children}</div>}
    </div>
  );
};

import React from 'react';
import { StructuredAiReport } from '../types';

interface DecisionMatrixProps {
  report: StructuredAiReport;
}

interface AnalysisCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  iconColorClass: string;
  className?: string;
}

const GavelIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75Zm0 10.5a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75ZM2 8.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 8.25Zm1.045 5.274a.75.75 0 0 1 .041-.519l.75-1.5a.75.75 0 0 1 1.462.002l.75 1.5a.75.75 0 0 1-.502.961l-3.25 1a.75.75 0 0 1-.2-.003Zm10.089-.002L11.5 14.526l-.294.09L13.04 12.5a.75.75 0 0 1 1.463 0l1.833 3.666a.75.75 0 0 1-.502.961l-3.25 1a.75.75 0 0 1-.493-.957Z" clipRule="evenodd" />
  </svg>
);

const ThumbUpIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M1 8.25a1.25 1.25 0 1 1 2.5 0v7.5a1.25 1.25 0 1 1-2.5 0v-7.5ZM5.23 7.523a.75.75 0 0 1 .927-.03L8.5 9.06l1.325-1.326a.75.75 0 0 1 1.06 1.06L9.562 10.12l1.233 1.233a.75.75 0 0 1-1.06 1.06L8.5 11.182l-1.233 1.233a.75.75 0 0 1-1.06-1.06l1.325-1.325L6.158 8.583a.75.75 0 0 1-.927-1.06ZM17.5 8C16.806 8 16.14 7.643 15.69 7.039a3.722 3.722 0 0 0-3.19-1.539H9.75a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 .75.75h2.75a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 1 0-1.5h2.75a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 1 0-1.5h2.75a.75.75 0 0 0 0-1.5H9.75V7.25h2.73a2.222 2.222 0 0 1 1.838.932A2.25 2.25 0 0 1 17.5 10.5V15h.75a.75.75 0 0 0 .75-.75V8.75a.75.75 0 0 0-.75-.75Z" />
  </svg>
);

const ThumbDownIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M1 11.75a1.25 1.25 0 1 1 2.5 0v-7.5a1.25 1.25 0 1 1-2.5 0v7.5ZM5.23 12.477a.75.75 0 0 1 .927.03L8.5 10.94l1.325 1.325a.75.75 0 0 1 1.06-1.06L9.562 9.879l1.233-1.233a.75.75 0 0 1-1.06-1.06L8.5 8.818l-1.233-1.233a.75.75 0 0 1-1.06 1.06L7.532 9.97l-1.375 1.375a.75.75 0 0 1-.927 1.132ZM17.5 12c-.694 0-1.36-.357-1.81-.961a3.722 3.722 0 0 0-3.19.001H9.75a.75.75 0 0 0-.75.75V15a.75.75 0 0 0 .75.75h2.75a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 1 0-1.5h2.75a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 1 0-1.5h2.75a.75.75 0 0 0 0-1.5H9.75v-.039h2.73a2.222 2.222 0 0 1 1.838-.932A2.25 2.25 0 0 1 17.5 9.5V5h-.75a.75.75 0 0 0-.75.75v6.5a.75.75 0 0 0 .75.75Z" />
  </svg>
);

const AcademicCapIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
    <path d="M7.722 4.155A1.75 1.75 0 0 1 8.85 3.337h2.3c.513 0 .993.214 1.329.58a1.75 1.75 0 0 1 .792 1.393v.015c0 .324.088.647.251.931h2.228a.75.75 0 0 1 .75.75v1.25a.75.75 0 0 1-.75.75h-2.228a1.75 1.75 0 0 1-.251.931v.015c0 .59-.268 1.138-.718 1.494l-3.25 2.5a.75.75 0 0 1-.914 0l-3.25-2.5a1.75 1.75 0 0 1-.718-1.494v-.015a1.75 1.75 0 0 1-.251-.931H2.25a.75.75 0 0 1-.75-.75V6.75a.75.75 0 0 1 .75-.75h2.228c.163-.284.251-.607.251-.931v-.015c0-.528.214-1.028.593-1.393ZM12.5 14.5a.75.75 0 0 1 .75.75v.008c0 .878-.504 1.664-1.29 2.046l-.012.006h-.018a1.802 1.802 0 0 1-1.859 0h-.018l-.012-.006A2.25 2.25 0 0 1 8.75 15.258v-.008A.75.75 0 0 1 9.5 14.5h3Z" />
  </svg>
);


const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, content, icon, iconColorClass, className }) => {
  const formattedContent = content.split(/\n-|\n•/).map(item => item.trim()).filter(item => item);

  return (
    <div className={`p-4 sm:p-6 bg-slate-800 rounded-xl shadow-lg border border-slate-700/50 ${className}`}>
      <div className="flex items-center mb-3">
        {React.isValidElement(icon) ? 
          React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-6 h-6 mr-3 ${iconColorClass}` }) :
          null
        }
        <h3 className={`text-lg sm:text-xl font-semibold ${iconColorClass}`}>{title}</h3>
      </div>
      {formattedContent.length > 1 || (content.includes("- ") || content.includes("• ")) ? ( // Check if content seems like a list
        <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm sm:text-base leading-relaxed">
          {formattedContent.map((item, index) => (
            <li key={index}>{item.replace(/^(- |• )/, "")}</li> // Remove leading bullet if present
          ))}
        </ul>
      ) : (
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">{content}</p>
      )}
    </div>
  );
};


export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({ report }) => {
  if (!report || !report.verdetto) {
    return <p className="text-slate-400">Report AI non disponibile o incompleto.</p>;
  }

  return (
    <section aria-labelledby="decision-matrix-title">
      <h2 id="decision-matrix-title" className="text-xl sm:text-2xl font-bold text-white mb-6 sr-only">
        Matrice Decisionale AI
      </h2>
      <div className="space-y-4 sm:space-y-6">
        <AnalysisCard
          title="Verdetto dell'Analista AI"
          content={report.verdetto}
          icon={<GavelIcon />}
          iconColorClass="text-cyan-400"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <AnalysisCard
            title="Perché Sì"
            content={report.perche_si}
            icon={<ThumbUpIcon />}
            iconColorClass="text-green-400"
          />
          <AnalysisCard
            title="Perché No"
            content={report.perche_no}
            icon={<ThumbDownIcon />}
            iconColorClass="text-red-400"
          />
        </div>
        <AnalysisCard
          title="Decisione Finale secondo Buffett"
          content={report.decisione_buffett}
          icon={<AcademicCapIcon />}
          iconColorClass="text-amber-400"
        />
      </div>
    </section>
  );
};

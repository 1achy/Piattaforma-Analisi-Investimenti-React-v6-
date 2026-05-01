
import React from 'react';
import { ActiveViewType } from '../../types';

interface NavigationMenuProps {
  activeView: ActiveViewType;
  setActiveView: (view: ActiveViewType) => void;
}

interface NavItemProps {
  label: string;
  view: ActiveViewType;
  isActive: boolean;
  onClick: (view: ActiveViewType) => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, view, isActive, onClick }) => {
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex-1 py-3 px-2 sm:py-4 sm:px-3 text-center font-medium rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50
        ${isActive 
          ? 'bg-cyan-500 text-slate-900 shadow-md focus:ring-cyan-500' 
          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-cyan-300 focus:ring-slate-500'
        }
        text-xs sm:text-sm md:text-base`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </button>
  );
};

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ activeView, setActiveView }) => {
  const navItems: { label: string; view: ActiveViewType }[] = [
    { label: 'Analista Valore AI', view: 'analyzer' },
    { label: 'Stock Screener', view: 'screener' }, // UPDATED label and view
    { label: 'Database Analisi', view: 'database' },
    { label: 'Medie di Settore', view: 'future' }, // CHANGED LABEL
  ];

  return (
    <nav className="bg-slate-800 shadow-sm sticky top-0 z-40"> 
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3">
        <div className="flex space-x-2 sm:space-x-3 md:space-x-4">
          {navItems.map(item => (
            <NavItem
              key={item.view}
              label={item.label}
              view={item.view}
              isActive={activeView === item.view}
              onClick={setActiveView}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};
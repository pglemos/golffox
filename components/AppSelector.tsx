
import React from 'react';
import type { AppView } from '../types';
import { APP_VIEWS, GOLFFOX_LOGO_BASE64 } from '../constants';

interface AppSelectorProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
}

const AppSelector: React.FC<AppSelectorProps> = ({ currentView, setCurrentView }) => {
  return (
    <div className="w-full bg-golffox-blue-dark text-white p-2 sm:p-3 flex items-center justify-between shadow-lg z-10">
      <div className="flex items-center">
        {/* FIX: Use Base64 logo to prevent broken image icon. */}
        <img src={GOLFFOX_LOGO_BASE64} alt="Golffox Logo" className="h-6 sm:h-8 mr-2 sm:mr-3" />
        <h1 className="text-lg sm:text-xl font-bold">Protótipo Golffox</h1>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 bg-black/20 rounded-lg p-1">
        {/* FIX: Cast Object.values result to AppView[] to resolve type errors. */}
        {(Object.values(APP_VIEWS) as AppView[]).map((view) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 ${
              currentView === view
                ? 'bg-golffox-orange-primary text-white shadow'
                : 'text-golffox-gray-light hover:bg-white/10'
            }`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AppSelector;

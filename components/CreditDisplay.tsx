
import React from 'react';
import { useCredits } from '../contexts/CreditContext';
import { Zap, Crown, Info } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const CreditDisplay: React.FC = () => {
  const { credits, isPremium, setShowSubscriptionModal } = useCredits();
  const { darkMode } = useSettings();

  // Estimate days left based on avg consumption of ~15 credits/day for active users
  const daysLeft = Math.max(1, Math.floor(credits / 15));

  if (isPremium) {
      return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700/50 rounded-full shadow-sm">
              <Crown size={14} className="text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">Premium</span>
          </div>
      );
  }

  const isLow = credits < 20;

  return (
    <div className="group relative">
        <button 
            onClick={() => setShowSubscriptionModal(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all active:scale-95 ${
                isLow 
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400' 
                : 'bg-white border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}
        >
            <div className={`p-0.5 rounded-full ${isLow ? 'bg-rose-200 dark:bg-rose-800' : 'bg-indigo-100 dark:bg-indigo-900'}`}>
                <Zap size={12} className={isLow ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'} fill="currentColor" />
            </div>
            <span className="text-xs font-bold font-mono">{credits}</span>
        </button>

        {/* Hover Tooltip */}
        <div className="absolute top-full right-0 mt-2 w-48 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</span>
                <span className={`text-xs font-bold ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>{credits} CR</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                    className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, credits)}%` }} 
                />
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
                ~{daysLeft} days of usage remaining based on your activity.
            </p>
        </div>
    </div>
  );
};

export default CreditDisplay;

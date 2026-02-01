
import React from 'react';
import { useCredits } from '../contexts/CreditContext';
import { useSettings } from '../contexts/SettingsContext';
import { X, Check, Crown } from 'lucide-react';

const SubscriptionModal: React.FC = () => {
  const { showSubscriptionModal, closeSubscriptionModal, subscribe, credits } = useCredits();
  const { t } = useSettings();

  if (!showSubscriptionModal) return null;

  const features = [
      "Unlimited Workout Generation",
      "Advanced Body Visualizer Tools",
      "Weekly PDF Progress Reports",
      "Unlimited Coach Injury Analysis",
      "Priority Access to Features"
  ];

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fade-in">
        <div className="w-full max-w-md bg-white rounded-[40px] overflow-hidden shadow-2xl animate-scale-in relative border border-white/20">
            <button 
                onClick={() => closeSubscriptionModal()}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-900 transition-all z-20 active:scale-90"
            >
                <X size={20} strokeWidth={3} />
            </button>

            {/* Banner Section */}
            <div className="bg-slate-900 text-white p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/30 border border-primary/30 text-primary-200 text-[10px] font-black uppercase tracking-widest mb-6">
                        <Crown size={12} fill="currentColor" /> Premium Protocol
                    </div>
                    <h2 className="text-4xl font-black mb-3 tracking-tighter">Elite Performance.</h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                        {credits <= 0 
                         ? "You've reached your free allocation. Unlock full access to maintain your physique evolution." 
                         : "Upgrade to premium to bypass all credit limitations and unlock professional tools."}
                    </p>
                </div>
            </div>

            {/* List Section */}
            <div className="p-10">
                <div className="space-y-5 mb-10">
                    {features.map((feat, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-100">
                                <Check size={12} strokeWidth={4} />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{feat}</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => subscribe()}
                    className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-lg shadow-2xl shadow-primary/30 hover:bg-primaryDark transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                    <Crown size={22} className="fill-white/20" /> Start Premium Plan
                </button>
                
                <p className="text-center text-[10px] font-black text-slate-400 mt-6 uppercase tracking-widest">
                    No hidden fees • Instant activation • Cancel anytime
                </p>
            </div>
        </div>
    </div>
  );
};

export default SubscriptionModal;

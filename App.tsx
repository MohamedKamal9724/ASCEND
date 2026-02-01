
import React, { useState, useEffect, useRef } from 'react';
import { AppView, BodyStats, UserProfile, GeneratedPlan, Equipment, Injury, VisualizerMode, InBodyData, CREDIT_COSTS } from './types';
import Onboarding from './components/Onboarding';
import BodyVisualizer, { MuscleData } from './components/BodyVisualizer';
import Slider from './components/Slider';
import Dashboard from './components/Dashboard';
import EquipmentSelector from './components/EquipmentSelector';
import Auth from './components/Auth';
import SettingsModal from './components/SettingsModal';
import SubscriptionModal from './components/SubscriptionModal';
import CreditDisplay from './components/CreditDisplay';
import FounderDashboard from './components/FounderDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { CreditProvider, useCredits } from './contexts/CreditContext';
import { generateFitnessPlan } from './services/geminiService';
import { saveFullProfile, loadUserData, clearUserData } from './services/storageService';
import { 
  Loader2, Zap, ArrowRight, Activity, RotateCcw, ScanLine, Layers, 
  Target, Cloud, CheckCircle, Fingerprint, Lock, Camera, 
  ChevronDown, ChevronUp, SlidersHorizontal, List, X, Info,
  Maximize2, Minimize2, Sparkles, Shield, Rotate3D
} from 'lucide-react';

const INITIAL_BODY: BodyStats = {
  traps: 1.0, shoulders: 1.0, chest: 1.0, arms: 1.0, forearms: 1.0,
  lats: 1.0, abs: 1.0, obliques: 1.0, glutes: 1.0, legs: 1.0, calves: 1.0, waist: 1.0, bodyFat: 20
};

const calculateInitialStats = (profile: UserProfile): BodyStats => {
  const { gender, height, weight } = profile;
  const bmi = weight / (Math.pow(height / 100, 2));
  let baseScale = 1 + ((bmi - 22) * 0.02);
  let fat = gender === 'male' ? 14 + (bmi - 22) : 23 + (bmi - 22);
  baseScale = Math.max(0.7, Math.min(1.5, baseScale));
  fat = Math.max(6, Math.min(45, fat));

  return { 
      ...INITIAL_BODY, 
      bodyFat: Math.round(fat), 
      chest: baseScale, 
      shoulders: baseScale, 
      arms: baseScale, 
      legs: baseScale,
      waist: 1 + (fat > 20 ? (fat - 20) * 0.03 : 0)
  };
};

const SyncIndicator = () => {
    const { syncStatus } = useAuth();
    if (syncStatus === 'synced') return null;
    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl animate-in slide-in-from-top-4">
            {syncStatus === 'syncing' ? (
                <>
                    <Loader2 size={14} className="text-primary animate-spin" />
                    <span className="text-xs font-bold text-slate-700">Syncing...</span>
                </>
            ) : syncStatus === 'error' ? (
                <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-red-500">Offline Mode</span>
                </>
            ) : null}
        </div>
    );
};

const BioSynthesisLoader = ({ progress }: { progress: number }) => {
    return (
        <div className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-white/90 backdrop-blur-2xl animate-fade-in text-slate-900 p-6">
            <div className="w-full max-w-sm border border-slate-100 rounded-[48px] p-10 bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                {/* High-tech Scanning Line Effect */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent top-0 animate-[scan_4s_ease-in-out_infinite]" />
                
                <div className="flex justify-between items-center mb-12">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-[900] tracking-tighter flex items-center gap-2 italic">
                            <Activity className="text-primary animate-pulse" size={20} /> BIO-SYNTHESIS
                        </h2>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] ml-7">System Architecture</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-8 py-2">
                    {/* Centered Large Percentage Text */}
                    <div className="flex flex-col items-center justify-center select-none">
                        <div className="flex items-baseline group-hover:scale-110 transition-transform duration-500">
                            <span className="text-7xl font-[900] text-slate-900 tracking-tighter tabular-nums leading-none">
                                {progress}
                            </span>
                            <span className="text-2xl font-black text-primary ml-1">%</span>
                        </div>
                    </div>

                    {/* Horizontal Progress Slider Bar */}
                    <div className="w-full space-y-3">
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50 relative p-0.5 shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-primary via-indigo-500 to-indigo-400 rounded-full transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                                style={{ width: `${progress}%` }}
                            >
                                {/* Gloss effect on the bar */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
                                {/* Pulsing tip glow */}
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(79,70,229,0.8)] blur-[2px] animate-pulse" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center px-1 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
                             <span>Initialization</span>
                             <span>Architecture Sync</span>
                        </div>
                    </div>

                    <div className="text-center space-y-4 pt-6">
                        <div className="inline-flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                             <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Architecting Protocol</p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.15em] max-w-[240px] mx-auto leading-relaxed opacity-80">
                            Synthesizing elite nutrition and high-frequency training cycles.
                        </p>
                    </div>
                </div>
                
                {/* Tech corner accents */}
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-primary/5 to-transparent rounded-tl-[80px]" />
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-br-[80px]" />
            </div>
            
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    20% { opacity: 0.6; }
                    80% { opacity: 0.6; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { spendCredits, isPremium, credits } = useCredits();
  const { t, language, notificationsEnabled, reminderTime, notificationPermission, hydrationEnabled, hydrationInterval } = useSettings();
  
  const [view, setView] = useState<AppView>('onboarding');
  const [lastView, setLastView] = useState<AppView>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentBody, setCurrentBody] = useState<BodyStats>(INITIAL_BODY);
  const [targetBody, setTargetBody] = useState<BodyStats>(INITIAL_BODY);
  const [mode, setMode] = useState<'current' | 'target'>('current');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('standard');
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front'); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  );
  
  const [activeControl, setActiveControl] = useState<string>('bodyFat');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [adjustingMuscle, setAdjustingMuscle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'comp' | 'upper' | 'lower'>('comp');
  
  const lastReminderRef = useRef<string | null>(null);
  const lastHydrationRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
        setIsDesktop(window.matchMedia('(min-width: 1024px)').matches);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Workout Reminders
  useEffect(() => {
    if (!notificationsEnabled || notificationPermission !== 'granted') return;
    const checkReminder = () => {
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      if (timeStr === reminderTime && lastReminderRef.current !== timeStr) {
        lastReminderRef.current = timeStr;
        new Notification("ASCEND Protocol", {
          body: "Time for your scheduled workout! Let's evolve your physique.",
          icon: "/favicon.ico"
        });
      }
    };
    const interval = setInterval(checkReminder, 30000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, reminderTime, notificationPermission]);

  // Hydration Reminders
  useEffect(() => {
    if (!hydrationEnabled || notificationPermission !== 'granted') return;
    
    const checkHydration = () => {
        const now = Date.now();
        const intervalMs = hydrationInterval * 3600000;
        
        if (!lastHydrationRef.current) {
            lastHydrationRef.current = now;
            return;
        }

        if (now - lastHydrationRef.current >= intervalMs) {
            lastHydrationRef.current = now;
            new Notification("Hydration Protocol", {
                body: "Optimization check: Consume 250ml water to maintain metabolic velocity.",
                icon: "/favicon.ico"
            });
        }
    };

    const interval = setInterval(checkHydration, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [hydrationEnabled, hydrationInterval, notificationPermission]);

  useEffect(() => {
    if (user && isAuthenticated) {
        const saved = loadUserData(user.id);
        if (saved) {
            if (saved.profile && Object.keys(saved.profile).length > 0) setUserProfile(saved.profile);
            if (saved.currentBody) setCurrentBody(saved.currentBody);
            if (saved.targetBody) setTargetBody(saved.targetBody);
            if (saved.plan) {
                setPlan(saved.plan);
                setView('dashboard');
            } else if (saved.profile && saved.profile.name) {
                setView('calibration'); 
            } else {
                setView('onboarding');
            }
        }
    } else if (!isAuthenticated && !loading) {
        setView('onboarding');
    }
  }, [isAuthenticated, user, loading]);

  const handleOnboardingComplete = (profile: UserProfile) => {
    const completeProfile = { ...profile, email: user?.email };
    setUserProfile(completeProfile);
    const initial = calculateInitialStats(completeProfile);
    setCurrentBody(initial);
    let calculatedTarget = { ...initial };
    if (profile.goal === 'muscle_gain') {
        Object.keys(calculatedTarget).forEach(key => {
            if (typeof calculatedTarget[key] === 'number' && key !== 'bodyFat' && key !== 'waist') {
                calculatedTarget[key] = Math.max(1.15, (calculatedTarget[key] as number) * 1.25);
            }
        });
        calculatedTarget.bodyFat = Math.max(10, calculatedTarget.bodyFat - 2); 
        calculatedTarget.waist = 0.98;
    } else if (profile.goal === 'fat_loss') {
        calculatedTarget.bodyFat = Math.max(10, calculatedTarget.bodyFat - 12); 
        calculatedTarget.waist = 0.85; 
        calculatedTarget.abs = 1.35;
    } else if (profile.goal === 'recomp') {
        Object.keys(calculatedTarget).forEach(key => {
            if (typeof calculatedTarget[key] === 'number' && key !== 'bodyFat' && key !== 'waist') {
                calculatedTarget[key] = (calculatedTarget[key] as number) * 1.15;
            }
        });
        calculatedTarget.bodyFat = 12;
        calculatedTarget.waist = 0.9;
    }
    setTargetBody(calculatedTarget);
    setMode('current');
    setView('calibration');
    if (user) saveFullProfile(user.id, completeProfile, initial, calculatedTarget);
  };

  const startSynthesis = async (equipment: Equipment, injuries: Injury[], days: string[], availableMeals: string[], inbody?: InBodyData) => {
    if (!userProfile || !user) return;
    const canAfford = await spendCredits(CREDIT_COSTS.GENERATE_PLAN, 'Protocol Generation');
    if (!canAfford) return;
    const updatedProfile = { ...userProfile, equipment, injuries, availableDays: days, availableMeals, inbodyData: inbody };
    setUserProfile(updatedProfile);
    
    setIsGenerating(true);
    setGenProgress(0);

    // Simulated progress increment
    const interval = setInterval(() => {
        setGenProgress(prev => {
            if (prev >= 95) return prev;
            return prev + Math.floor(Math.random() * 5) + 1;
        });
    }, 400);

    try {
        const generated = await generateFitnessPlan(updatedProfile, currentBody, targetBody, 'balanced');
        clearInterval(interval);
        setGenProgress(100);
        
        // Short pause at 100%
        await new Promise(r => setTimeout(r, 600));

        setPlan(generated);
        saveFullProfile(user.id, updatedProfile, currentBody, targetBody, generated);
        setIsGenerating(false);
        setView('dashboard');
    } catch (err) {
        clearInterval(interval);
        console.warn("[System Message] Protocol Synthesis Interrupted:", err);
        setIsGenerating(false);
        // Error is suppressed from UI as requested
    }
  };

  const handleReset = () => {
    if (user) clearUserData(user.id);
    setView('onboarding');
    setPlan(null);
    setUserProfile(null);
    setCurrentBody(INITIAL_BODY);
    setTargetBody(INITIAL_BODY);
    setMode('current');
    setBodyView('front');
  };

  const frontMuscles = ['traps', 'shoulders', 'chest', 'arms', 'forearms', 'abs', 'obliques', 'legs', 'calves'];
  const backMuscles = ['traps', 'shoulders', 'lats', 'arms', 'forearms', 'waist', 'glutes', 'legs', 'calves'];
  
  const muscleKeys = bodyView === 'front' ? frontMuscles : backMuscles;
  const upperBody = ['traps', 'shoulders', 'chest', 'lats', 'arms', 'forearms', 'abs', 'obliques', 'waist'];
  const lowerBody = ['glutes', 'legs', 'calves'];

  const updateBodyStat = (key: string, value: number) => {
      if (mode === 'current') {
          setCurrentBody(prev => ({ ...prev, [key]: value }));
      } else {
          setTargetBody(prev => ({ ...prev, [key]: value }));
      }
  };

  const selectControl = (key: string) => {
      setActiveControl(key);
      if (key !== 'bodyFat') {
          setAdjustingMuscle(key);
      } else {
          setAdjustingMuscle(null);
      }
      setIsSelectorOpen(false);
  };

  const handleMuscleTapped = (muscle: MuscleData | null) => {
      if (muscle) {
          const mKey = muscle.name.toLowerCase();
          setAdjustingMuscle(mKey);
          setActiveControl(mKey); 
          if (upperBody.includes(mKey)) setActiveTab('upper');
          else if (lowerBody.includes(mKey)) setActiveTab('lower');
      }
  };

  const toggleFounderDashboard = () => {
      if (view === 'founder_dashboard') setView(lastView);
      else {
          setLastView(view);
          setView('founder_dashboard');
      }
  };

  if (view === 'founder_dashboard' && user?.isFounder) {
      return <FounderDashboard onBack={toggleFounderDashboard} />;
  }

  // Null safe value accessor for calibration
  const getCalibrationValue = (key: string) => {
      const stats = mode === 'current' ? currentBody : targetBody;
      return (stats && stats[key] !== undefined) ? stats[key] : (key === 'bodyFat' ? 20 : 1.0);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-background text-text overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <SettingsModal onReset={handleReset} />
      <SubscriptionModal />
      <SyncIndicator />
      
      {user?.isFounder && (
          <button 
             onClick={toggleFounderDashboard}
             className="fixed bottom-6 right-6 z-[9999] w-12 h-12 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-slate-700 hover:scale-110 transition-transform"
             title="Founder Console"
          >
              <Shield size={20} />
          </button>
      )}

      {loading ? (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-[100]">
            <Loader2 className="animate-spin text-primary mb-4" size={40}/>
            <p className="text-sm font-bold text-textMuted tracking-widest uppercase animate-pulse">Initializing Interface</p>
        </div>
      ) : !isAuthenticated ? (
        <div className="w-full flex-1">
             <Auth />
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col lg:flex-row h-screen">
            {view === 'dashboard' && plan && userProfile ? (
                 <Dashboard plan={plan} userProfile={userProfile} currentBody={currentBody} onReset={handleReset} initialDifficulty="balanced" />
            ) : (
                <div className="w-full flex-1 flex flex-col lg:flex-row h-full">
                    {view === 'onboarding' && (
                        <div className="fixed inset-0 z-[150] bg-white overflow-y-auto">
                            <Onboarding onComplete={handleOnboardingComplete} />
                        </div>
                    )}
                    {view === 'constraints' && (
                        <div className="fixed inset-0 z-[150] bg-white overflow-y-auto">
                            <EquipmentSelector onComplete={startSynthesis} />
                        </div>
                    )}

                    {view === 'calibration' && (
                        <div className="w-full flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                            {!isDesktop && (
                                <div className="lg:hidden flex flex-col h-[100dvh] bg-slate-50 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full z-20 p-5 pt-2 flex justify-between items-start pointer-events-none">
                                         <div className="pointer-events-auto flex flex-col gap-2">
                                             <div className="scale-75 origin-top-left"><CreditDisplay /></div>
                                             <div>
                                                 <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                     <Zap size={10} className="text-amber-500 fill-amber-500" /> Calibration
                                                 </div>
                                                 <h2 className="text-xl font-black italic tracking-tighter text-slate-900 leading-none mt-0.5 shadow-sm">
                                                     {mode === 'current' ? 'BASELINE' : 'TARGET'}
                                                 </h2>
                                             </div>
                                         </div>
                                         <button 
                                             onClick={() => setMode(m => m === 'current' ? 'target' : 'current')} 
                                             className="pointer-events-auto bg-white/90 backdrop-blur-md border border-slate-200 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                                         >
                                             {mode === 'current' ? 'Switch to Target' : 'Switch to Current'}
                                         </button>
                                    </div>
                                    <div className="absolute inset-0 z-10">
                                        <div className="w-full h-full pb-40 flex items-center justify-center relative">
                                             <BodyVisualizer 
                                                 stats={currentBody} 
                                                 targetStats={mode === 'target' ? targetBody : undefined} 
                                                 gender={userProfile?.gender || 'male'} 
                                                 mode={visualizerMode} 
                                                 view={bodyView}
                                                 onSelect={handleMuscleTapped}
                                                 adjustingMuscle={activeControl === 'bodyFat' ? null : activeControl}
                                                 disableAnimation={false}
                                             />
                                             
                                             {/* Mobile Upper-Right Toggle Button */}
                                             <div className="absolute right-4 top-20 z-30 flex flex-col gap-2">
                                                 <button 
                                                     onClick={() => setBodyView(v => v === 'front' ? 'back' : 'front')}
                                                     className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-xl flex flex-col items-center gap-1 active:scale-95 transition-all pointer-events-auto"
                                                 >
                                                     <Rotate3D size={20} className="text-slate-900" />
                                                     <span className="text-[8px] font-black uppercase tracking-tighter text-slate-900">
                                                         {bodyView === 'front' ? 'BACK' : 'FRONT'}
                                                     </span>
                                                 </button>
                                             </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-4 right-4 z-30">
                                        <div className="bg-white/90 backdrop-blur-xl border border-white/40 p-5 rounded-[28px] shadow-2xl shadow-slate-900/10">
                                            <div className="flex justify-between items-center mb-4">
                                                 <button 
                                                     onClick={() => setIsSelectorOpen(true)}
                                                     className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-700 transition-colors"
                                                 >
                                                     <List size={14} />
                                                     <span className="uppercase tracking-wider text-[10px]">
                                                         {activeControl === 'bodyFat' ? t('calibBodyFat') : (t('muscles')[activeControl] || activeControl)}
                                                     </span>
                                                 </button>
                                                 <div className="text-sm font-black text-primary">
                                                     {activeControl === 'bodyFat' 
                                                        ? `${Math.round(getCalibrationValue('bodyFat'))}%`
                                                        : getCalibrationValue(activeControl).toFixed(2)
                                                     }
                                                 </div>
                                            </div>
                                            <div className="mb-5 px-1">
                                                 <Slider 
                                                     label="" 
                                                     min={activeControl === 'bodyFat' ? 5 : 0.6}
                                                     max={activeControl === 'bodyFat' ? 45 : 1.6}
                                                     step={activeControl === 'bodyFat' ? 1 : 0.01}
                                                     value={getCalibrationValue(activeControl)}
                                                     onChange={(v) => updateBodyStat(activeControl, v)}
                                                     formatValue={() => ''} 
                                                 />
                                            </div>
                                            <button 
                                                onClick={() => mode === 'current' ? setMode('target') : setView('constraints')}
                                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                            >
                                                {mode === 'current' ? <>Next Step <ArrowRight size={16}/></> : <>Proceed to Finalize <ArrowRight size={16}/></>}
                                            </button>
                                        </div>
                                    </div>
                                    {isSelectorOpen && (
                                        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsSelectorOpen(false)}>
                                            <div className="absolute bottom-4 left-4 right-4 bg-white rounded-[32px] p-6 shadow-2xl animate-slide-up max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Select Parameter</h3>
                                                    <button onClick={() => setIsSelectorOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X size={18} /></button>
                                                </div>
                                                <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Composition</h4>
                                                            <button 
                                                                onClick={() => selectControl('bodyFat')}
                                                                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between ${activeControl === 'bodyFat' ? 'bg-primary/5 border-primary text-primary' : 'bg-slate-50 border-slate-100 text-slate-600'}`}
                                                            >
                                                                <span className="font-bold text-sm">{t('calibBodyFat')}</span>
                                                                {activeControl === 'bodyFat' && <CheckCircle size={18} />}
                                                            </button>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                                                <span>Musculature ({bodyView === 'front' ? 'Front' : 'Back'})</span>
                                                                <button onClick={() => setBodyView(v => v === 'front' ? 'back' : 'front')} className="text-primary hover:underline">Switch View</button>
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {muscleKeys.map(m => (
                                                                    <button
                                                                        key={m}
                                                                        onClick={() => selectControl(m)}
                                                                        className={`p-4 rounded-2xl border text-left flex items-center justify-between ${activeControl === m ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-200 text-slate-600'}`}
                                                                    >
                                                                        <span className="font-bold text-xs">{t('muscles')[m]}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {isDesktop && (
                                <div className="hidden lg:flex flex-1 relative flex-col items-center justify-center bg-slate-50 overflow-hidden">
                                    <div className="absolute top-4 left-4 z-50">
                                        <CreditDisplay />
                                    </div>
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-indigo-50/20 to-slate-100 pointer-events-none" />
                                    <div className="absolute top-10 left-10 z-20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="px-2 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-md">Phase 01</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Calibration</div>
                                        </div>
                                        <h2 className="text-5xl font-black italic tracking-tighter text-slate-900">{mode === 'current' ? 'BASELINE' : 'TARGET'}</h2>
                                    </div>
                                    <div className="absolute top-10 right-10 z-20 bg-white p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex gap-2">
                                        <button onClick={() => setMode('current')} className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'current' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Current Physics</button>
                                        <button onClick={() => setMode('target')} className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${mode === 'target' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>Target Goal</button>
                                    </div>
                                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                        <div className="relative w-full h-full flex items-center justify-center pointer-events-auto pb-20 pt-24 px-6">
                                                <div className="relative w-full max-w-[500px] h-full flex items-center justify-center">
                                                    <div className="absolute top-1/2 -right-24 -translate-y-1/2 flex flex-col gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-2xl border border-slate-100 shadow-lg">
                                                        <button onClick={() => setBodyView('front')} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-1 ${bodyView === 'front' ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}><span className="text-[10px] font-black uppercase tracking-widest">Front</span></button>
                                                        <div className="h-px w-full bg-slate-200 mx-2" />
                                                        <button onClick={() => setBodyView('back')} className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-1 ${bodyView === 'back' ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}><span className="text-[10px] font-black uppercase tracking-widest">Back</span></button>
                                                    </div>
                                                    <BodyVisualizer stats={currentBody} targetStats={mode === 'target' ? targetBody : undefined} gender={userProfile?.gender || 'male'} mode={visualizerMode} view={bodyView} onSelect={handleMuscleTapped} adjustingMuscle={adjustingMuscle} disableAnimation={false} />
                                                </div>
                                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-6 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm whitespace-nowrap">
                                                    <div className="text-center"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('obAge')}</div><div className="text-lg font-black text-slate-900">{userProfile?.age}</div></div>
                                                    <div className="w-px h-8 bg-slate-200" /><div className="text-center"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('obHeight')}</div><div className="text-lg font-black text-slate-900">{userProfile?.height} <span className="text-xs font-bold text-slate-400">cm</span></div></div>
                                                    <div className="w-px h-8 bg-slate-200" /><div className="text-center"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('obWeight')}</div><div className="text-lg font-black text-slate-900">{userProfile?.weight} <span className="text-xs font-bold text-slate-400">kg</span></div></div>
                                                    <div className="w-px h-8 bg-slate-200" /><div className="text-center"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Body Fat</div><div className="text-lg font-black text-primary">{mode === 'current' ? currentBody.bodyFat : targetBody.bodyFat}<span className="text-xs font-bold text-primary">%</span></div></div>
                                                </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {isDesktop && (
                                <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-white border-l border-slate-100 flex-col h-full relative z-[150] shadow-[-10px_0_40px_rgba(0,0,0,0.02)]">
                                    <div className="p-8 pb-4"><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-1"><SlidersHorizontal size={20} /> Parameters</h3><p className="text-xs text-slate-500 font-medium">Fine-tune your physiological metrics.</p></div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 space-y-8">
                                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Layers size={14} className="text-primary"/> {t('calibComp')}</h3>
                                            <Slider label={t('calibBodyFat')} min={5} max={45} value={mode === 'current' ? currentBody.bodyFat : targetBody.bodyFat} onChange={v => updateBodyStat('bodyFat', v)} formatValue={v => `${Math.round(v)}%`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-6 px-2"><h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-secondary"/> {t('calibMuscle')}</h3><span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">{bodyView} View</span></div>
                                            <div className="space-y-3">
                                                {muscleKeys.map(k => (
                                                    <div key={k} className={`p-4 rounded-2xl transition-all ${adjustingMuscle === k ? 'bg-primary/5 border border-primary/20 ring-2 ring-primary/10' : 'bg-white border border-slate-100 hover:border-slate-200'}`}>
                                                        <Slider label={t('muscles')[k]} min={0.6} max={1.6} value={mode === 'current' ? currentBody[k] : targetBody[k]} onChange={v => updateBodyStat(k, v)} onStart={() => setAdjustingMuscle(k)} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 border-t border-slate-100 bg-white/50 backdrop-blur-lg">
                                        <button onClick={() => mode === 'current' ? setMode('target') : setView('constraints')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98] group">
                                            {mode === 'current' ? <>{t('calibTarget')} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></> : <>Proceed to Finalize <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      )}
      {isGenerating && <BioSynthesisLoader progress={genProgress} />}
    </div>
  );
};

const App: React.FC = () => (
    <SettingsProvider>
        <AuthProvider>
            <CreditProvider>
                <AppContent />
            </CreditProvider>
        </AuthProvider>
    </SettingsProvider>
);
export default App;

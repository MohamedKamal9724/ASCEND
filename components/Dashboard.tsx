
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedPlan, UserProfile, BodyStats, CREDIT_COSTS, MealAnalysis, ActiveInjury } from '../types';
import { 
  LayoutDashboard, Utensils, Settings, 
  ChevronRight, Send, CheckCircle2, Clock, CheckCircle, Lock, Quote, TrendingUp, Activity, Menu, X,
  Loader2, Edit2, RotateCcw, Check, User, Crown, CreditCard, Sparkles, AlertCircle, Zap, Camera, Upload, ScanLine, XCircle, RefreshCw,
  Flame, Droplets, Wheat, Cookie, ArrowRight, Tag, ShieldAlert, HeartPulse, Trophy, PartyPopper, Target, Scale, FlameKindling, LineChart, 
  TrendingDown, Info, LogOut
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import InjuryReportingModal from './InjuryReportingModal';
import { sendReportViaEmail } from '../services/reportGenerator';
import { useSettings } from '../contexts/SettingsContext';
import { useCredits } from '../contexts/CreditContext';
import { useAuth } from '../contexts/AuthContext';
import { analyzeMealImage, restorePlan } from '../services/geminiService';
import { AscendLogo } from './Auth';
import { getGlobalPromos, saveFullProfile, loadUserData, incrementPromoUses } from '../services/storageService';
import CreditDisplay from './CreditDisplay';

interface DashboardProps {
  plan: GeneratedPlan;
  userProfile: UserProfile;
  currentBody: BodyStats;
  onReset: () => void;
  initialDifficulty: string;
}

const CelebrationOverlay: React.FC<{ 
    type: 'week' | 'program' | 'recovery'; 
    onClose: () => void;
    weekNumber?: number;
}> = ({ type, onClose, weekNumber }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 6000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const config = {
        week: {
            icon: PartyPopper,
            title: `WEEK ${weekNumber} COMPLETE`,
            subtitle: "Biomechanical adaptation achieved.",
            color: "text-primary",
            bg: "bg-primary/10"
        },
        program: {
            icon: Trophy,
            title: "PROTOCOL ACCOMPLISHED",
            subtitle: "Elite transformation state attained.",
            color: "text-amber-500",
            bg: "bg-amber-500/10"
        },
        recovery: {
            icon: HeartPulse,
            title: "BETTER TO SEE YOU WELL AGAIN",
            subtitle: "Recovery protocol terminated. Ready for action.",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        }
    }[type];

    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[400] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-2 h-2 rounded-full animate-float opacity-40"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'][i % 4],
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${3 + Math.random() * 4}s`
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 animate-scale-in">
                <div className={`w-24 h-24 ${config.bg} ${config.color} rounded-[32px] flex items-center justify-center mb-8 mx-auto shadow-2xl animate-pulse`}>
                    <Icon size={48} strokeWidth={2.5} />
                </div>
                <h2 className="text-3xl md:text-6xl font-[900] italic tracking-tighter text-slate-900 uppercase mb-4 leading-tight">
                    {config.title}
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-xs md:text-base">
                    {config.subtitle}
                </p>
                
                <button 
                    onClick={onClose}
                    className="mt-12 px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    Return to Protocol
                </button>
            </div>
        </div>
    );
};

const MealScanner: React.FC<{ plan: GeneratedPlan }> = ({ plan }) => {
    const { t } = useSettings();
    const { spendCredits, isPremium } = useCredits();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        setScanError(null);
        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setTimeout(() => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            }, 100);
        } catch (err) {
            console.error(err);
            setScanError("Unable to access camera. Please allow permissions.");
            setCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const captureImage = async () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const base64 = canvas.toDataURL('image/jpeg');
                setPreview(base64);
                stopCamera();
                await processImage(base64.split(',')[1], 'image/jpeg');
            }
        }
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setScanError(null);
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const result = ev.target?.result as string;
            setPreview(result);
            await processImage(result.split(',')[1], file.type);
        };
        reader.readAsDataURL(file);
    };

    const processImage = async (base64: string, mimeType: string) => {
        const canAfford = await spendCredits(CREDIT_COSTS.MEAL_SCAN, 'Meal Analysis');
        if (!canAfford) {
            setPreview(null);
            return;
        }

        setIsAnalyzing(true);
        setAnalysis(null);
        setScanError(null);

        try {
            const result = await analyzeMealImage(base64, mimeType, plan.nutrition);
            if (result.error) {
                // Keep this one as it's a validation error from AI
                setScanError(result.error);
                setPreview(null);
            } else {
                setAnalysis(result);
            }
        } catch (err) {
            console.warn("[System Message] Meal Analysis Failed:", err);
            // Suppress visible error for user as requested
            setPreview(null);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetScan = () => {
        setAnalysis(null);
        setPreview(null);
        setScanError(null);
        stopCamera();
    };

    return (
        <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                    <ScanLine size={20} className="text-primary" /> {t('scanMeal')}
                </h3>
                {!isPremium && !analysis && (
                     <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-bold">{CREDIT_COSTS.MEAL_SCAN} CR</span>
                )}
            </div>

            {cameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
                        <div className="flex justify-end">
                            <button onClick={stopCamera} className="p-2 bg-black/50 text-white rounded-full backdrop-blur-md">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex justify-center mb-2">
                             <button 
                                onClick={captureImage} 
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform"
                             >
                                 <div className="w-12 h-12 bg-white rounded-full" />
                             </button>
                        </div>
                    </div>
                </div>
            ) : !preview ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={startCamera}
                            className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 group"
                        >
                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
                                <Camera size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 group-hover:text-primary">Take Photo</span>
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-3 group"
                        >
                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
                                <Upload size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 group-hover:text-primary">{t('eqUpload')}</span>
                        </button>
                    </div>
                    {scanError && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                            <p className="text-[10px] font-bold text-rose-600 leading-snug">{scanError}</p>
                        </div>
                    )}
                    <div className="col-span-2 text-center mt-2">
                        <p className="text-[10px] text-slate-400 font-medium">{t('scanDesc')}</p>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
                </div>
            ) : (
                <div className="animate-fade-in space-y-6">
                    <div className="relative h-56 rounded-2xl overflow-hidden group shadow-lg text-left">
                        <img src={preview} alt="Meal" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button 
                            onClick={resetScan}
                            className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-colors"
                        >
                            <X size={16} />
                        </button>
                        {isAnalyzing && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
                                <Loader2 className="text-primary animate-spin mb-3" size={40} />
                                <span className="text-xs font-black text-primary uppercase tracking-widest animate-pulse">{t('analyzing')}</span>
                            </div>
                        )}
                    </div>

                    {analysis && (
                        <div className="space-y-4 animate-slide-up text-left">
                            <div className={`p-5 rounded-2xl border flex items-center gap-4 ${
                                analysis.verdict === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                analysis.verdict === 'caution' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                'bg-red-50 border-red-100 text-red-700'
                            }`}>
                                <div className={`p-3 rounded-full shrink-0 ${
                                    analysis.verdict === 'approved' ? 'bg-emerald-100' :
                                    analysis.verdict === 'caution' ? 'bg-amber-100' :
                                    'bg-red-100'
                                }`}>
                                    {analysis.verdict === 'approved' ? <CheckCircle2 size={24} /> : 
                                     analysis.verdict === 'caution' ? <AlertCircle size={24} /> : 
                                     <XCircle size={24} />}
                                </div>
                                <div>
                                    <div className="text-sm font-black uppercase tracking-wider mb-0.5">
                                        {analysis.verdict === 'approved' ? t('verdictApproved') : 
                                         analysis.verdict === 'caution' ? t('verdictCaution') : 
                                         t('verdictRejected')}
                                    </div>
                                    <div className="text-sm font-medium opacity-90 leading-tight">{analysis.name}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">KCAL</div>
                                    <div className="text-lg font-black text-slate-800">{analysis.calories}</div>
                                </div>
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                                    <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">PRO</div>
                                    <div className="text-lg font-black text-blue-700">{analysis.protein}g</div>
                                </div>
                                <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl text-center">
                                    <div className="text-[9px] text-orange-400 font-black uppercase tracking-widest mb-1">CARB</div>
                                    <div className="text-lg font-black text-orange-700">{analysis.carbs}g</div>
                                </div>
                                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-2xl text-center">
                                    <div className="text-[9px] text-yellow-500 font-black uppercase tracking-widest mb-1">FAT</div>
                                    <div className="text-lg font-black text-yellow-700">{analysis.fats}g</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ plan: initialPlan, userProfile: initialUserProfile, currentBody, onReset }) => {
  const { t, language, openSettings } = useSettings();
  const { spendCredits, isPremium, credits, purchaseCredits, subscribe, updateLocalCredits } = useCredits();
  const { user, logout } = useAuth();
  
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [plan, setPlan] = useState<GeneratedPlan>(initialPlan);
  const [activeTab, setActiveTab] = useState<'overview' | 'nutrition' | 'analytics' | 'profile'>('overview');
  const [isInjuryModalOpen, setIsInjuryModalOpen] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [currentWeek, setCurrentWeek] = useState(1);
  const [completedWorkouts, setCompletedWorkouts] = useState<Record<string, boolean>>({});
  const [completedMeals, setCompletedMeals] = useState<Record<number, boolean>>({});

  const [isRestoring, setIsRestoring] = useState(false);
  const [celebration, setCelebration] = useState<{ show: boolean, type: 'week' | 'program' | 'recovery', week?: number }>({ show: false, type: 'week' });

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // --- LOGIC: COMPLETION CHECK ---
  const isWeekComplete = React.useMemo(() => {
      if (!plan?.workout) return false;
      
      const exercisesDone = plan.workout.every((day, dIdx) => {
          if (day.isRecoveryDay) return true;
          return (day.exercises || []).every((_, eIdx) => completedWorkouts[`w${currentWeek}-d${dIdx}-e${eIdx}`]);
      });

      const mealsDone = (plan.nutrition.meals || []).every((_, mIdx) => completedMeals[mIdx]);

      return exercisesDone && mealsDone;
  }, [plan, currentWeek, completedWorkouts, completedMeals]);

  const consistencyScore = React.useMemo(() => {
    if (!plan?.workout || !plan?.nutrition?.meals) return 0;
    const totalExercises = plan.workout.reduce((acc, day) => acc + (day.isRecoveryDay ? 0 : (day.exercises?.length || 0)), 0);
    const doneExercises = Object.values(completedWorkouts).filter(Boolean).length;
    const totalMeals = plan.nutrition.meals.length;
    const doneMeals = Object.values(completedMeals).filter(Boolean).length;
    
    const divisor = (totalExercises + totalMeals);
    if (divisor === 0) return 100;
    return Math.round(((doneExercises + doneMeals) / divisor) * 100);
  }, [plan, completedWorkouts, completedMeals]);

  const massVelocity = (currentWeek * 0.45).toFixed(1);

  const chartData = React.useMemo(() => {
      const data = [];
      const startWeight = userProfile.weight;
      const weeks = plan?.timelineWeeks || 12;
      for (let i = 0; i <= weeks; i++) {
          data.push({
              name: `W${i}`,
              actual: i <= currentWeek ? startWeight - (i * 0.45) : null,
              target: startWeight - (i * 0.5),
          });
      }
      return data;
  }, [userProfile, plan, currentWeek]);

  const handleFinishWeek = async () => {
      if (!isWeekComplete && !plan.isRecoveryPlan) return;

      if (plan.isRecoveryPlan) {
          setIsRestoring(true);
          try {
              const restored = userProfile.originalPlan || plan;
              const originalWeek = userProfile.originalWeek || 1;
              const updatedProfile = { ...userProfile, isRecoveryMode: false, originalPlan: undefined, originalWeek: undefined };
              
              setPlan(restored);
              setUserProfile(updatedProfile);
              setCurrentWeek(originalWeek);
              setCompletedWorkouts({});
              setCompletedMeals({});
              
              saveFullProfile(user!.id, updatedProfile, currentBody, currentBody, restored);
              setCelebration({ show: true, type: 'recovery' });
              setActiveTab('overview');
          } finally {
              setIsRestoring(false);
          }
          return;
      }

      if (currentWeek < (plan?.timelineWeeks || 0)) {
          setCelebration({ show: true, type: 'week', week: currentWeek });
          setCurrentWeek(prev => prev + 1);
          setCompletedWorkouts({});
          setCompletedMeals({});
          window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
          setCelebration({ show: true, type: 'program' });
      }
  };

  const handleInjuryUpdate = (newPlan: GeneratedPlan, injury: ActiveInjury | null) => {
      const updatedProfile = { 
          ...userProfile, 
          isRecoveryMode: true, 
          originalPlan: plan, 
          originalWeek: currentWeek 
      };
      
      setUserProfile(updatedProfile);
      setPlan(newPlan);
      setCurrentWeek(1);
      setCompletedWorkouts({});
      setCompletedMeals({});
      
      saveFullProfile(user!.id, updatedProfile, currentBody, currentBody, newPlan);
      setActiveTab('overview');
      setIsInjuryModalOpen(false);
  };

  const handleSendReport = async () => {
      const canAfford = await spendCredits(CREDIT_COSTS.SEND_REPORT, 'Weekly Report');
      if (!canAfford) return;
      setIsSendingReport(true);
      try {
          await sendReportViaEmail(plan, userProfile, currentBody, currentWeek);
          setReportSent(true);
          setTimeout(() => setReportSent(false), 3000);
      } catch (err) {
          console.error(err);
      } finally {
          setIsSendingReport(false);
      }
  };

  const handleRedeemPromo = () => {
      setPromoError(null);
      setPromoSuccess(null);
      const codeStr = promoInput.trim().toUpperCase();
      if (!codeStr) return;

      const globalPromos = getGlobalPromos();
      const promo = globalPromos.find(p => p.code === codeStr);

      if (!promo) {
          setPromoError("Invalid protocol code.");
          return;
      }

      if (userProfile.redeemedCodes?.includes(codeStr)) {
          setPromoError("Code already utilized.");
          return;
      }

      const userData = loadUserData(user!.id);
      if (userData) {
          const updatedProfile = { ...userData.profile };
          if (!updatedProfile.redeemedCodes) updatedProfile.redeemedCodes = [];
          updatedProfile.redeemedCodes.push(codeStr);

          if (promo.type === 'premium') {
              updatedProfile.isPremium = true;
              setPromoSuccess("ELITE PROTOCOL UNLOCKED");
              subscribe(); 
          } else if (promo.type === 'discount') {
              updatedProfile.activeDiscount = promo.value;
              setPromoSuccess(`${promo.value}% DISCOUNT APPLIED`);
          } else {
              const bonus = promo.value;
              const newBalance = (updatedProfile.credits || 0) + bonus;
              updatedProfile.credits = newBalance;
              setPromoSuccess(`REDEEMED: +${bonus} CREDITS`);
              updateLocalCredits(newBalance);
          }

          incrementPromoUses(codeStr);
          setUserProfile(updatedProfile);
          saveFullProfile(user!.id, updatedProfile, userData.currentBody, userData.targetBody, userData.plan || undefined);
          setPromoInput('');
      }
  };

  const toggleWorkout = (week: number, dayIndex: number, exerciseIndex: number) => {
    const key = `w${week}-d${dayIndex}-e${exerciseIndex}`;
    setCompletedWorkouts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMeal = (index: number) => {
    setCompletedMeals(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handlePurchase = (amount: number) => {
     const btn = document.getElementById(`buy-${amount}`);
     if(btn) {
         const originalText = btn.innerText;
         btn.innerText = 'Processing...';
         setTimeout(() => {
             purchaseCredits(amount);
             btn.innerText = 'Success!';
             setTimeout(() => { btn.innerText = originalText; }, 1000);
         }, 800);
     }
  };

  const NavItem = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left group ${activeTab === id ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20' : 'text-textMuted hover:text-text hover:bg-surfaceHighlight'}`}>
      <Icon size={18} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  );

  const applyDiscount = (basePrice: string): string => {
      if (!userProfile.activeDiscount) return basePrice;
      const numeric = parseFloat(basePrice.replace('$', ''));
      const discounted = numeric * (1 - userProfile.activeDiscount / 100);
      return `$${discounted.toFixed(2)}`;
  };

  // --- LOGIC: Sidebar Progress Tracking ---
  // Create an array representing the total weeks in the plan to show progress
  const timelineWeeksCount = plan.isRecoveryPlan ? 7 : (plan.timelineWeeks || 1);
  const weekItems = Array.from({ length: timelineWeeksCount }, (_, i) => i + 1);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row text-text font-sans bg-background w-full overflow-hidden">
      
      {celebration.show && (
          <CelebrationOverlay 
            type={celebration.type} 
            weekNumber={celebration.week}
            onClose={() => setCelebration({ ...celebration, show: false })} 
          />
      )}

      {isRestoring && (
          <div className="fixed inset-0 z-[200] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in p-6 text-center">
              <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Zap size={24} className="text-primary animate-pulse" />
                  </div>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Syncing Main Plan</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Restoring protocol state...</p>
          </div>
      )}

      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-surface sticky top-0 z-[60] shadow-sm">
          <div className="flex items-center gap-3">
              <div className="scale-75 origin-left"><CreditDisplay /></div>
              <div className="w-px h-6 bg-border mx-1" />
              <AscendLogo size={20} />
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-lg bg-surfaceHighlight text-textMuted border border-border hover:text-text transition-colors">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
      </div>

      <aside className={`fixed lg:static inset-y-0 left-0 z-[70] w-72 bg-surface border-r border-border p-6 flex flex-col transition-transform duration-300 lg:translate-x-0 shadow-2xl lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${language === 'ar' ? 'right-0 left-auto lg:border-l lg:border-r-0' : 'left-0 right-auto'}`}>
        <div className="mb-6 px-2 w-full flex justify-between items-center">
            <AscendLogo size={28} />
            <div className="lg:hidden"><CreditDisplay /></div>
        </div>
        
        <div className="hidden lg:block mb-8 px-2">
            <CreditDisplay />
        </div>

        <nav className="space-y-2 mb-10">
          <NavItem id="overview" icon={LayoutDashboard} label={t('overview')} />
          <NavItem id="nutrition" icon={Utensils} label={t('nutrition')} />
          <NavItem id="analytics" icon={TrendingUp} label={t('analytics')} />
          <NavItem id="profile" icon={User} label={t('profile')} />
        </nav>
        
        <div className="mb-10 flex-1 overflow-y-auto custom-scrollbar text-left text-textMuted">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 px-2 sticky top-0 bg-surface pb-2">
                {plan.isRecoveryPlan ? 'RECOVERY DAYS' : t('timeline')}
            </h3>
            <div className="space-y-2">
                {weekItems.map((weekNum) => (
                    <div key={weekNum} className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${weekNum === currentWeek ? 'bg-primary/5 text-primary border border-primary/20' : 'text-textMuted hover:bg-slate-50'}`}>
                        <span>{plan.isRecoveryPlan ? `Day ${weekNum}` : `Week ${weekNum}`}</span>
                        {weekNum < currentWeek ? <CheckCircle size={12} className="text-emerald-500" /> : weekNum === currentWeek ? <Zap size={12} className="text-primary" /> : <Lock size={12} />}
                    </div>
                ))}
            </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen h-[100dvh] overflow-y-auto overflow-x-hidden relative bg-background">
        <div className="p-4 md:p-8 lg:p-12 pb-24 md:pb-12 text-left">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 md:mb-10 gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h1 className="text-2xl md:text-4xl font-black text-text tracking-tighter leading-none">{t('welcome')}, {userProfile.name}</h1>
                    {plan.isRecoveryPlan && (
                        <div className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                            <ShieldAlert size={12}/> RECOVERY ACTIVE
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-textMuted font-bold uppercase tracking-wider">
                    <span className="px-2 py-0.5 bg-surfaceHighlight rounded-full border border-border">
                        {plan.isRecoveryPlan ? '7-DAY REHAB' : userProfile.goal.replace('_', ' ')}
                    </span>
                    <span>•</span>
                    <span>{plan.isRecoveryPlan ? '7 DAYS' : `${plan?.timelineWeeks || 12} WEEKS`}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:flex md:flex-row gap-2 w-full md:w-auto">
                 <button onClick={handleSendReport} disabled={isSendingReport || reportSent} className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${reportSent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white border-border text-text hover:bg-slate-50 active:scale-95'}`}>
                    {isSendingReport ? <Loader2 className="animate-spin" size={14} /> : (reportSent ? <CheckCircle size={14} /> : <Send size={14} />)}
                    <span className="truncate">{reportSent ? t('reportSent') : t('weeklyStatus')}</span>
                 </button>
                 <button onClick={() => setIsInjuryModalOpen(true)} className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${plan.isRecoveryPlan ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>
                    {plan.isRecoveryPlan ? <HeartPulse size={14} /> : <Activity size={14} />}
                    <span className="truncate">{plan.isRecoveryPlan ? 'Update Rehab' : t('reportInjury')}</span>
                 </button>
              </div>
            </header>

            {activeTab === 'profile' && (
                <div className="space-y-10 animate-fade-in text-left">
                     <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-surface border border-border rounded-[32px] shadow-sm relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-50 to-blue-50 opacity-50 z-0"></div>
                         <div className="relative z-10 w-24 h-24 rounded-3xl bg-white border-4 border-white shadow-xl flex items-center justify-center text-3xl font-black text-primary overflow-hidden">
                            {user?.avatar ? <img src={user.avatar} alt="User" className="w-full h-full object-cover" /> : userProfile.name?.charAt(0).toUpperCase() || 'U'}
                         </div>
                         <div className="relative z-10 text-center md:text-left flex-1">
                             <h2 className="text-2xl font-black text-text tracking-tight mb-1">{userProfile.name}</h2>
                             <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                                 <span className="text-xs font-bold text-textMuted flex items-center gap-1"><User size={12} /> {userProfile.gender}</span>
                                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                 <span className="text-xs font-bold text-textMuted">{t('memberSince')} {new Date(userProfile.joinDate || Date.now()).getFullYear()}</span>
                             </div>
                             <div className="flex items-center justify-center md:justify-start gap-2">
                                 {isPremium ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-bold shadow-sm"><Crown size={12} fill="currentColor" /> {t('premiumTier')}</div>
                                 ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-slate-600 text-xs font-bold"><User size={12} /> {t('freeTier')}</div>
                                 )}
                             </div>
                         </div>
                     </div>

                     <div className="text-left">
                         <h3 className="text-lg font-black text-text uppercase tracking-tight mb-6 flex items-center gap-2"><CreditCard size={20} className="text-primary"/> {t('creditBalance')}</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="p-6 bg-slate-900 text-white rounded-[32px] shadow-xl flex flex-col justify-between relative overflow-hidden group">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2"></div>
                                 <div><div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Available</div><div className="text-5xl font-black mb-1">{credits}</div><div className="text-sm font-medium text-slate-400 uppercase tracking-widest">Credits</div></div>
                                 {!isPremium && <button onClick={subscribe} className="mt-8 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"><Crown size={14} className="text-amber-500 fill-amber-500" /> Unlock Premium</button>}
                             </div>
                             <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 {[ { amt: 50, price: "$4.99", label: "Starter", icon: Sparkles }, { amt: 150, price: "$12.99", label: "Pro", icon: Zap }, { amt: 500, price: "$39.99", label: "Elite", icon: Crown }, { amt: 1000, price: "$69.99", label: "Protocol", icon: CheckCircle2 } ].map((pack) => (
                                     <div key={pack.amt} className="p-5 bg-surface border border-border rounded-[24px] hover:shadow-lg transition-all hover:border-primary/30 group text-left">
                                         <div className="flex justify-between items-start mb-4">
                                             <div className={`p-3 rounded-2xl ${isPremium ? 'bg-slate-100 text-slate-400' : 'bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors'}`}><pack.icon size={20} /></div>
                                             <div className="text-right">
                                                 <div className="text-lg font-black text-text">{applyDiscount(pack.price)}</div>
                                                 <div className="text-[9px] font-black text-textMuted uppercase tracking-widest">{pack.label} Pack</div>
                                             </div>
                                         </div>
                                         <div className="flex items-center gap-2 mb-4"><span className="text-2xl font-black text-text">{pack.amt}</span><span className="text-[10px] font-black text-textMuted uppercase tracking-widest">CR</span></div>
                                         <button id={`buy-${pack.amt}`} onClick={() => handlePurchase(pack.amt)} className="w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-slate-100 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all text-slate-600">{t('purchase')}</button>
                                     </div>
                                 ))}
                             </div>
                         </div>
                     </div>

                     <div className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-sm text-left">
                         <h3 className="text-lg font-black text-text uppercase tracking-tight mb-4 flex items-center gap-2">
                             <Tag size={20} className="text-primary"/> Redeem Protocol Code
                         </h3>
                         <div className="flex flex-col md:flex-row gap-3">
                             <input type="text" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} placeholder="ENTER CODE" className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-black tracking-widest outline-none focus:border-primary transition-all uppercase" />
                             <button onClick={handleRedeemPromo} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all">Redeem</button>
                         </div>
                         {promoError && <p className="mt-3 text-[10px] font-bold text-rose-500 uppercase tracking-wide flex items-center gap-2 ml-1"><AlertCircle size={12}/> {promoError}</p>}
                         {promoSuccess && <p className="mt-3 text-[10px] font-bold text-emerald-500 uppercase tracking-wide flex items-center gap-2 ml-1"><CheckCircle2 size={12}/> {promoSuccess}</p>}
                     </div>

                     <div className="flex gap-4">
                         <button onClick={openSettings} className="flex-1 py-4 rounded-2xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                             <Settings size={18} /> {t('settings')}
                         </button>
                         <button onClick={logout} className="flex-1 py-4 rounded-2xl border border-rose-100 bg-rose-50 font-bold text-sm text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center gap-2">
                             <LogOut size={18} /> {t('logOut')}
                         </button>
                     </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="space-y-10 animate-fade-in text-left">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="p-8 bg-slate-900 text-white rounded-[40px] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Scale size={80} /></div>
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingDown size={12} className="text-primary"/> Baseline Delta</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black tracking-tighter">{massVelocity}</span>
                                        <span className="text-xs font-bold text-slate-500 uppercase">KG Δ</span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${(currentWeek / (plan.timelineWeeks || 12)) * 100}%` }} />
                                        </div>
                                        <span className="text-[9px] font-black text-slate-500">{Math.round((currentWeek / (plan.timelineWeeks || 12)) * 100)}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform text-primary"><Zap size={80} /></div>
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><CheckCircle size={12} className="text-primary"/> Consistency Matrix</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black tracking-tighter text-slate-900">{consistencyScore}%</span>
                                    </div>
                                    <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">Compliance Grade: {consistencyScore > 80 ? 'ELITE' : 'ADAPTIVE'}</p>
                                </div>
                            </div>
                            <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[40px] shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-emerald-600"><Target size={80} /></div>
                                <div className="relative z-10">
                                    <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={12}/> Health Signal</div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black tracking-tighter text-emerald-700">OPTIMAL</span>
                                    </div>
                                    <div className="mt-4 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-white/50 py-1 px-3 rounded-full inline-block border border-emerald-100">Biometrically Stable</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-6 flex flex-col justify-center items-center text-center">
                            <div className="w-16 h-16 rounded-3xl bg-white shadow-md flex items-center justify-center mb-4 text-primary">
                                <FlameKindling size={24} />
                            </div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Weekly Flux</div>
                            <div className="text-xl font-black text-slate-900">-{plan?.nutrition?.calories ? plan.nutrition.calories * 7 : 0} <span className="text-[10px] text-slate-400 uppercase">Kcal</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 p-8 bg-white border border-slate-200 rounded-[40px] shadow-sm">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> Physiological Projection</h3>
                                    <p className="text-xs text-slate-500 font-medium">Actual path vs theoretical target model.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actual</span></div>
                                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-200" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target</span></div>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={3} fill="none" strokeDasharray="5 5" />
                                        <Area type="monotone" dataKey="actual" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorActual)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-900 text-white rounded-[40px] shadow-2xl flex flex-col">
                            <h3 className="text-lg font-black uppercase tracking-tight mb-8">Protocol Sequence</h3>
                            <div className="flex-1 space-y-8 relative">
                                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-800" />
                                {[
                                    { week: 0, label: 'Initial Baseline', status: 'done', icon: CheckCircle2 },
                                    { week: 4, label: 'Metabolic Shift', status: 'current', icon: Sparkles },
                                    { week: 8, label: 'Hypertrophic Plateau', status: 'locked', icon: Lock },
                                    { week: 12, label: 'Protocol Accomplished', status: 'locked', icon: Trophy }
                                ].map((step, idx) => (
                                    <div key={idx} className={`relative pl-12 transition-all ${step.status === 'locked' ? 'opacity-40' : 'opacity-100'}`}>
                                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-full border-4 border-slate-900 z-10 flex items-center justify-center ${step.status === 'done' ? 'bg-primary' : 'bg-slate-800'}`}>
                                            <step.icon size={14} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Week {step.week}</div>
                                            <div className="text-sm font-bold">{step.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setActiveTab('overview')} className="mt-10 py-4 bg-white/5 border border-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Review Lifecycle</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'overview' && plan && (
                <div className="space-y-6 animate-fade-in text-left">
                    <h2 className="text-lg font-black text-text uppercase tracking-tight">
                        {plan.isRecoveryPlan ? 'FUNCTIONAL RECOVERY CYCLE' : `PROTOCOL: CYCLE ${currentWeek}`}
                    </h2>
                    <div className="space-y-4">
                    {(plan.workout || []).map((day, dIndex) => {
                        if (!day) return null;
                        const exercises = day.exercises || [];
                        return (
                            <div key={dIndex} className="rounded-[24px] bg-surface border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <div className="p-4 md:p-5 bg-surfaceHighlight flex flex-wrap items-center justify-between border-b border-border gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center font-black text-primary text-xs shadow-sm">
                                            {plan.isRecoveryPlan ? `D${dIndex + 1}` : (day.day?.slice(0, 3) || 'DY')}
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-sm text-text">
                                                {day.day || `Day ${dIndex + 1}`}
                                            </div>
                                            <div className="text-[10px] font-black text-textMuted uppercase tracking-widest">{day.focus || 'GENERAL'}</div>
                                        </div>
                                    </div>
                                    {day.isRecoveryDay ? (
                                        <span className="text-emerald-600 text-[10px] font-black flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                                            <Clock size={12} /> {t('rest')}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-black text-textMuted bg-white px-3 py-1.5 rounded-full border border-border uppercase tracking-widest">
                                            {exercises.length} {t('exercises')}
                                        </span>
                                    )}
                                </div>
                                {!day.isRecoveryDay && exercises.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {exercises.map((ex, eIndex) => {
                                            const isDone = completedWorkouts[`w${currentWeek}-d${dIndex}-e${eIndex}`];
                                            return (
                                                <button key={eIndex} onClick={() => toggleWorkout(currentWeek, dIndex, eIndex)} className={`w-full flex items-center gap-4 p-4 md:p-5 text-left transition-all ${isDone ? 'bg-surfaceHighlight' : 'hover:bg-slate-50'}`}>
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${isDone ? 'bg-primary border-primary text-white' : 'border-border bg-white'}`}>{isDone && <Check size={14} strokeWidth={3} />}</div>
                                                    <div className="flex-1">
                                                        <div className={`text-sm font-bold flex items-center gap-2 ${isDone ? 'text-textMuted line-through' : 'text-text'}`}>
                                                            {ex.name}
                                                            {(ex.isRehab || plan.isRecoveryPlan) && <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-md border border-emerald-100 uppercase tracking-widest">REHAB</span>}
                                                        </div>
                                                        <div className="text-[10px] font-mono text-textMuted mt-1 uppercase tracking-wider">{ex.sets} SETS × {ex.reps} REPS</div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : !day.isRecoveryDay && (
                                    <div className="p-8 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        NO EXERCISES ALLOCATED
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    </div>
                    
                    {/* Coach Logic Insight */}
                    {plan.coachAnalysis && (
                        <div className="p-6 md:p-8 bg-slate-50 border border-slate-200 rounded-[32px] mt-8 text-left">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Zap size={14} className="text-amber-500 fill-amber-500" /> Physiological Architect's Analysis
                            </h3>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic border-l-2 border-slate-200 pl-4">
                                "{plan.coachAnalysis.summary}"
                            </p>
                        </div>
                    )}

                    <div className="pt-8 pb-12">
                        <button 
                            onClick={handleFinishWeek} 
                            disabled={!isWeekComplete && !plan.isRecoveryPlan || isRestoring} 
                            className={`w-full py-6 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${
                                (isWeekComplete || plan.isRecoveryPlan) && !isRestoring
                                ? 'bg-slate-900 text-white hover:scale-[1.01]' 
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            {isRestoring && <Loader2 className="animate-spin" size={20} />}
                            {plan.isRecoveryPlan 
                                ? (isRestoring ? 'Restoring Cycle...' : 'Finish the Recovery')
                                : (currentWeek >= (plan.timelineWeeks || 0) ? t('finishProgram') : t('finishWeek'))
                            }
                            {(isWeekComplete || plan.isRecoveryPlan) && !isRestoring && <ArrowRight size={20} />}
                            {(!isWeekComplete && !plan.isRecoveryPlan) && <Lock size={20} />}
                        </button>
                        {!isWeekComplete && !plan.isRecoveryPlan && (
                            <p className="text-center mt-4 text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                                MUST COMPLETE ALL EXERCISES & MEALS TO ADVANCE
                            </p>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'nutrition' && plan?.nutrition && (
                <div className="space-y-10 animate-fade-in text-left">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                             <div className="p-8 rounded-[40px] bg-slate-900 text-white shadow-2xl relative overflow-hidden border border-slate-700">
                                 <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/20 rounded-full blur-[70px]" />
                                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Executive Target</h3>
                                 <div className="flex items-end gap-3 mb-10"><div className="text-6xl font-black text-white leading-none tracking-tighter">{plan.nutrition.calories}</div><div className="text-sm font-bold text-slate-400 mb-2 uppercase">Kcal / Day</div></div>
                                 <div className="grid grid-cols-3 gap-4">
                                     <div className="p-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md"><div className="flex items-center gap-2 text-blue-400 mb-2 font-black text-[9px] uppercase tracking-wider"><Droplets size={12} fill="currentColor" /> Protein</div><div className="text-2xl font-bold">{plan.nutrition.protein}g</div></div>
                                     <div className="p-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md"><div className="flex items-center gap-2 text-orange-400 mb-2 font-black text-[9px] uppercase tracking-wider"><Wheat size={12} fill="currentColor" /> Carbs</div><div className="text-2xl font-bold">{plan.nutrition.carbs}g</div></div>
                                     <div className="p-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md"><div className="flex items-center gap-2 text-yellow-400 mb-2 font-black text-[9px] uppercase tracking-wider"><Cookie size={12} fill="currentColor" /> Fats</div><div className="text-2xl font-bold">{plan.nutrition.fats}g</div></div>
                                 </div>
                             </div>
                             <MealScanner plan={plan} />
                        </div>
                     
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-text uppercase tracking-tight flex items-center gap-2"><Utensils size={20} className="text-primary" /> Daily Schedule</h2>
                            <div className="space-y-4">
                                {(plan.nutrition.meals || []).map((meal, index) => {
                                    const isChecked = completedMeals[index];
                                    return (
                                        <div key={index} className={`group bg-white border rounded-3xl p-6 shadow-sm transition-all duration-300 ${isChecked ? 'border-border opacity-50 bg-slate-50' : 'border-slate-100 hover:border-primary/30 hover:shadow-md'}`}>
                                            <div className="flex items-start gap-4">
                                                <button onClick={() => toggleMeal(index)} className={`shrink-0 w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-slate-200 text-transparent hover:border-emerald-400'}`}><Check size={14} strokeWidth={4} /></button>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className={`text-base font-bold transition-all ${isChecked ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{meal.name}</div>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">M{index + 1}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">{meal.options?.map((opt, i) => <span key={i} className="px-3 py-1 bg-surfaceHighlight border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500">{opt}</span>)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                     </div>
                </div>
            )}
        </div>
      </main>
      {isInjuryModalOpen && ( <InjuryReportingModal currentPlan={plan} userProfile={userProfile} onClose={() => setIsInjuryModalOpen(false)} onPlanUpdate={handleInjuryUpdate} existingInjury={userProfile.activeInjuries?.[0]} /> )}
    </div>
  );
};

export default Dashboard;

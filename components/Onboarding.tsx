
import React, { useState } from 'react';
import { UserProfile, Gender, Goal, Level, INITIAL_CREDITS } from '../types';
import { ChevronRight, Check, User, Target, BarChart2, AlertCircle, ArrowLeft, Ruler, Weight, Calendar } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const InputField = ({ label, error, icon: Icon, children }: { label: string, error?: string | null, icon?: any, children?: React.ReactNode }) => (
  <div className="flex flex-col gap-2 group text-left w-full">
      <div className="flex justify-between items-end px-1">
        <label className={`text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-primary'}`}>
            {Icon && <Icon size={10} />}
            {label}
        </label>
        {error && <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><AlertCircle size={10}/> {error}</span>}
      </div>
      {children}
  </div>
);

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t, language } = useSettings();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [profile, setProfile] = useState<UserProfile>({
    name: '', age: 25, gender: 'male', height: 175, weight: 75,
    goal: 'muscle_gain', level: 'intermediate', equipment: 'gym_full',
    injuries: [], availableDays: ['Monday', 'Wednesday', 'Friday'],
    credits: INITIAL_CREDITS,
    availableMeals: [],
    redeemedCodes: []
  });

  const totalSteps = 3;

  const validateStep1 = () => {
      const newErrors: Record<string, string | null> = {};
      let isValid = true;
      if (!profile.name || profile.name.trim().length < 2) {
          newErrors.name = "Required";
          isValid = false;
      }
      if (profile.age < 12) {
          newErrors.age = "Min age 12";
          isValid = false;
      }
      if (profile.weight < 30) {
          newErrors.weight = "Min 30kg";
          isValid = false;
      }
      if (profile.height < 100) {
          newErrors.height = "Invalid height";
          isValid = false;
      }
      setErrors(newErrors);
      return isValid;
  };

  const handleNext = () => {
      if (step === 1) {
          if (validateStep1()) {
              setStep(2);
              window.scrollTo(0,0);
          }
      } else if (step < 3) {
          setStep(s => s + 1);
          window.scrollTo(0,0);
      } else {
          onComplete(profile);
      }
  };

  const prevStep = () => {
      setStep(s => s - 1);
      window.scrollTo(0,0);
  };

  const getStepTitle = () => {
      switch(step) {
          case 1: return { title: t('obAbout'), subtitle: t('obCalibrate') };
          case 2: return { title: t('obGoals'), subtitle: t('obGoalPrompt') };
          case 3: return { title: t('obExp'), subtitle: t('obExpLevel') };
          default: return { title: "", subtitle: "" };
      }
  };

  const { title, subtitle } = getStepTitle();

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-6 bg-white overflow-y-auto">
      
      {/* Progress Header */}
      <div className="w-full max-w-sm pt-6 pb-8 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-end mb-4">
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  Step {step} <span className="text-slate-300">/ {totalSteps}</span>
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {step === 1 ? "Biometrics" : step === 2 ? "Objectives" : "Experience"}
              </span>
          </div>
          <div className="flex gap-2 h-1.5 w-full">
              {[1, 2, 3].map((s) => (
                  <div 
                    key={s} 
                    className={`h-full rounded-full flex-1 transition-all duration-500 ${
                        s <= step ? 'bg-primary' : 'bg-slate-100'
                    }`} 
                  />
              ))}
          </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center flex-1 pb-10">
        
        {/* Step Header */}
        <div className="w-full text-center mb-10 animate-fade-in">
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter">{title}</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{subtitle}</p>
        </div>

        {/* STEP 1: BIOMETRICS */}
        {step === 1 && (
          <div className="w-full space-y-8 animate-slide-up">
             
             {/* Gender Selector */}
             <div className="flex gap-4">
                {['male', 'female'].map((g) => (
                    <button 
                        key={g} 
                        onClick={() => setProfile({...profile, gender: g as Gender})} 
                        className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                            profile.gender === g 
                            ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                        }`}
                    >
                        <User size={20} strokeWidth={profile.gender === g ? 2.5 : 2} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {g === 'male' ? t('obMale') : t('obFemale')}
                        </span>
                    </button>
                ))}
             </div>

             <div className="space-y-6">
                <InputField label={t('authName')} error={errors.name} icon={User}>
                    <input 
                        type="text" 
                        value={profile.name} 
                        onChange={e => setProfile({...profile, name: e.target.value})} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 outline-none focus:border-primary focus:bg-white transition-all" 
                        placeholder="e.g. Alex Doe" 
                    />
                </InputField>

                <div className="grid grid-cols-3 gap-4">
                     <div className="col-span-1">
                         <InputField label={t('obAge')} error={errors.age} icon={Calendar}>
                            <input 
                                type="number" 
                                value={profile.age} 
                                onChange={e => setProfile({...profile, age: parseInt(e.target.value) || 0})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-center outline-none focus:border-primary focus:bg-white transition-all" 
                            />
                         </InputField>
                     </div>
                     <div className="col-span-2">
                        <div className="flex gap-4">
                             <div className="flex-1">
                                 <InputField label={t('obHeight')} icon={Ruler} error={errors.height}>
                                    <div className="relative">
                                        <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-center outline-none focus:border-primary focus:bg-white transition-all" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">cm</span>
                                    </div>
                                 </InputField>
                             </div>
                             <div className="flex-1">
                                 <InputField label={t('obWeight')} icon={Weight} error={errors.weight}>
                                    <div className="relative">
                                        <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-sm font-bold text-center outline-none focus:border-primary focus:bg-white transition-all" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">kg</span>
                                    </div>
                                 </InputField>
                             </div>
                        </div>
                     </div>
                </div>
            </div>
          </div>
        )}

        {/* STEP 2: GOALS */}
        {step === 2 && (
           <div className="w-full space-y-4 animate-slide-up">
                {[
                    { id: 'fat_loss', label: t('obGoalFatLoss'), desc: t('obGoalFatLossDesc'), icon: Target },
                    { id: 'muscle_gain', label: t('obGoalMuscle'), desc: t('obGoalMuscleDesc'), icon: User },
                    { id: 'recomp', label: t('obGoalRecomp'), desc: t('obGoalRecompDesc'), icon: BarChart2 },
                ].map((option) => (
                    <button 
                        key={option.id} 
                        onClick={() => setProfile({...profile, goal: option.id as Goal})}
                        className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                            profile.goal === option.id 
                            ? 'bg-primary/5 border-primary shadow-md' 
                            : 'bg-white border-slate-100 hover:border-slate-300'
                        }`}
                    >
                        <div className="flex-1">
                            <div className={`font-black text-sm mb-1 uppercase tracking-tight flex items-center gap-2 ${profile.goal === option.id ? 'text-primary' : 'text-slate-900'}`}>
                                <option.icon size={16} />
                                {option.label}
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 leading-relaxed pr-4">{option.desc}</div>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                            profile.goal === option.id 
                            ? 'bg-primary border-primary text-white' 
                            : 'bg-transparent border-slate-200 text-transparent'
                        }`}>
                            <Check size={12} strokeWidth={4} />
                        </div>
                    </button>
                ))}
           </div>
        )}

        {/* STEP 3: EXPERIENCE */}
        {step === 3 && (
           <div className="w-full space-y-4 animate-slide-up">
                {[
                    { id: 'beginner', label: t('obExpBeg'), desc: t('obExpBegDesc'), level: 1 },
                    { id: 'intermediate', label: t('obExpInt'), desc: t('obExpIntDesc'), level: 2 },
                    { id: 'advanced', label: t('obExpAdv'), desc: t('obExpAdvDesc'), level: 3 },
                ].map((option) => (
                    <button 
                        key={option.id} 
                        onClick={() => setProfile({...profile, level: option.id as Level})}
                        className={`w-full text-left p-6 rounded-3xl border-2 transition-all flex items-center justify-between group ${
                            profile.level === option.id 
                            ? 'bg-emerald-50 border-emerald-500 shadow-md' 
                            : 'bg-white border-slate-100 hover:border-slate-300'
                        }`}
                    >
                        <div className="flex-1">
                            <div className={`font-black text-sm mb-1 uppercase tracking-tight ${profile.level === option.id ? 'text-emerald-600' : 'text-slate-900'}`}>{option.label}</div>
                            <div className="text-[10px] font-bold text-slate-400 leading-relaxed pr-4">{option.desc}</div>
                        </div>
                        
                        {/* Visual Strength Indicator */}
                        <div className="flex gap-0.5 items-end h-4 mr-2">
                             {[1,2,3].map(bar => (
                                 <div 
                                    key={bar} 
                                    className={`w-1.5 rounded-sm transition-all ${
                                        bar <= option.level 
                                            ? (profile.level === option.id ? 'bg-emerald-500' : 'bg-slate-300')
                                            : 'bg-slate-100'
                                    }`}
                                    style={{ height: `${bar * 33}%` }}
                                 />
                             ))}
                        </div>

                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                            profile.level === option.id 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : 'bg-transparent border-slate-200 text-transparent'
                        }`}>
                            <Check size={12} strokeWidth={4} />
                        </div>
                    </button>
                ))}
           </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="w-full max-w-sm mt-auto bg-white pt-4">
        {step === 1 ? (
             <button 
                onClick={handleNext} 
                className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:bg-primaryDark active:scale-[0.98] transition-all"
            >
                {t('nextStep')} <ChevronRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />
            </button>
        ) : (
             <div className="flex gap-3 w-full">
                 <button 
                    onClick={prevStep} 
                    className="px-6 py-5 rounded-[24px] font-black text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                 </button>
                 <button 
                    onClick={handleNext} 
                    className={`flex-1 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all ${
                        step === 3 
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                 >
                     {step === 3 ? t('complete') : t('next')}
                 </button>
             </div>
        )}
      </div>

    </div>
  );
};

export default Onboarding;

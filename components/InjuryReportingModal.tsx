
import React, { useState, useRef, useEffect } from 'react';
import { ActiveInjury, GeneratedPlan, UserProfile, CREDIT_COSTS } from '../types';
import { adaptPlanForInjury } from '../services/geminiService';
import { 
  AlertTriangle, X, Camera, Upload, Activity, ChevronRight, 
  CheckCircle, ShieldAlert, Loader2, ArrowLeft, HeartPulse, 
  Info, Zap, Rotate3D 
} from 'lucide-react';
import BodyVisualizer, { MuscleData } from './BodyVisualizer';
import { useCredits } from '../contexts/CreditContext';

interface InjuryReportingModalProps {
  currentPlan: GeneratedPlan;
  userProfile: UserProfile;
  onClose: () => void;
  onPlanUpdate: (newPlan: GeneratedPlan, injury: ActiveInjury | null) => void;
  existingInjury?: ActiveInjury | null;
}

const Tooltip = ({ text }: { text: string }) => (
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-white font-mono leading-tight shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20">
    <div className="text-primary font-bold mb-1 tracking-tighter uppercase">CLINICAL_INFO:</div>
    {text}
    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
  </div>
);

const InjuryReportingModal: React.FC<InjuryReportingModalProps> = ({ currentPlan, userProfile, onClose, onPlanUpdate, existingInjury }) => {
  const { spendCredits, isPremium } = useCredits();
  const [step, setStep] = useState(existingInjury ? 2 : 1);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [injury, setInjury] = useState<Partial<ActiveInjury>>({
    painLevel: 5,
    worsensWithExercise: true,
    severity: 'moderate',
    ...existingInjury
  });
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Camera/File State
  const [cameraActive, setCameraActive] = useState(false);
  const [image, setImage] = useState<{ base64: string, mime: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const INJURY_TYPES = [
    { id: 'pain', label: 'Pain', tip: 'Localized ache without sharp restricted mobility.' },
    { id: 'strain', label: 'Strain', tip: 'Muscle or tendon injury. Often due to overstretching.' },
    { id: 'sprain', label: 'Sprain', tip: 'Ligament injury. Joint instability often present.' },
    { id: 'tear', label: 'Tear', tip: 'Structural fiber failure. Immediate cessation of training recommended.' },
    { id: 'discomfort', label: 'Discomfort', tip: 'General unease. May be DOMS or early overuse signaling.' },
    { id: 'stiffness', label: 'Stiffness', tip: 'Limited range of motion. Focuses on mobility routing.' }
  ];

  useEffect(() => {
    if (existingInjury) {
        setInjury(existingInjury);
    }
  }, [existingInjury]);

  const handleMuscleSelect = (muscle: MuscleData | null) => {
    if (muscle) {
        setSelectedMuscle(muscle);
        setInjury(prev => ({ ...prev, part: muscle.name }));
    }
  };

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error", err);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        setImage({ base64, mime: 'image/jpeg' });
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        setCameraActive(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              const base64 = (ev.target?.result as string).split(',')[1];
              setImage({ base64, mime: file.type });
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = async () => {
      if (!injury.part || !injury.type) return;
      const canAfford = await spendCredits(CREDIT_COSTS.COACH_ANALYSIS, 'Injury Analysis');
      if (!canAfford) return;

      setIsAnalyzing(true);
      const finalInjury: ActiveInjury = {
          id: existingInjury?.id || Math.random().toString(36).substr(2, 9),
          part: injury.part,
          type: injury.type as any,
          painLevel: injury.painLevel || 5,
          dateOccurred: existingInjury?.dateOccurred || new Date().toISOString(),
          worsensWithExercise: injury.worsensWithExercise || false,
          severity: injury.painLevel! > 7 ? 'severe' : (injury.painLevel! > 3 ? 'moderate' : 'mild'),
          recoveryPhase: existingInjury ? (existingInjury.recoveryPhase || 1) + 1 : 1
      };

      try {
          const newPlan = await adaptPlanForInjury(currentPlan, finalInjury, userProfile, image?.base64, image?.mime);
          onPlanUpdate({ ...newPlan, isRecoveryPlan: true }, finalInjury);
      } catch (e) {
          console.warn("[System Message] Rehab Synthesis Halted:", e);
          // Alert suppressed per user request
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-xl flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden">
        <div className="w-full max-w-lg flex justify-between items-center mb-3 px-2">
            <h2 className="text-lg md:text-xl font-black text-slate-900 italic tracking-tighter flex items-center gap-2">
                {existingInjury ? <HeartPulse className="text-emerald-500" size={18} /> : <ShieldAlert className="text-red-500" size={18} />}
                {existingInjury ? 'RECOVERY STATUS' : 'INJURY PROTOCOL'}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
            </button>
        </div>

        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[32px] md:rounded-[40px] p-4 md:p-8 relative overflow-hidden flex flex-col h-full max-h-[92vh] shadow-2xl">
            
            {step === 1 && !existingInjury && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right overflow-hidden">
                    
                    {/* Visualizer Area - Dynamically sized to fill remaining space */}
                    <div className="flex-1 relative min-h-0 border border-slate-100 rounded-[28px] bg-slate-50/50 overflow-hidden group/vis">
                        <BodyVisualizer 
                            stats={{...userProfile as any, bodyFat: 15}} 
                            onSelect={handleMuscleSelect}
                            disableAnimation
                            mode="standard"
                            view={view}
                            gender={userProfile.gender}
                        />
                    </div>

                    {/* Bottom Controls Area - Tight spacing to fit in one page */}
                    <div className="pt-4 space-y-4">
                        
                        {/* Muscle Badge - Moved UNDER the body */}
                        <div className="flex justify-center h-8">
                            {selectedMuscle ? (
                                <div className="bg-red-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-in zoom-in flex items-center gap-2">
                                    <ShieldAlert size={12} /> {selectedMuscle.name} ACTIVE
                                </div>
                            ) : (
                                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Select Bio-Zone on Body</div>
                            )}
                        </div>

                        {/* Location Header and Switch Toggle */}
                        <div className="flex justify-between items-center bg-slate-50/80 border border-slate-100 p-4 rounded-[20px]">
                            <div className="text-left">
                                <h3 className="text-base font-black text-slate-900 tracking-tight leading-none mb-1">Location</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Anatomical Selection</p>
                            </div>
                            <button 
                                onClick={() => setView(v => v === 'front' ? 'back' : 'front')}
                                className="bg-white hover:bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex flex-col items-center gap-0.5 transition-all border border-slate-200 shadow-sm active:scale-95"
                            >
                                <Rotate3D size={14} /> 
                                {view === 'front' ? 'TO BACK' : 'TO FRONT'}
                            </button>
                        </div>

                        <button 
                            disabled={!selectedMuscle}
                            onClick={() => setStep(2)}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 text-xs ${
                                selectedMuscle ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                        >
                            Confirm Zone <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right overflow-hidden">
                    {!existingInjury && (
                        <button onClick={() => setStep(1)} className="self-start text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                            <ArrowLeft size={14} strokeWidth={3} /> Change Location
                        </button>
                    )}
                    
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-6">Severity Scan</h3>
                    
                    <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 block">Sensation Index</label>
                            <div className="grid grid-cols-2 gap-2">
                                {INJURY_TYPES.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setInjury(prev => ({ ...prev, type: t.id as any }))}
                                        className={`p-3 rounded-xl text-[10px] font-bold border transition-all relative group/btn ${
                                            injury.type === t.id ? 'bg-red-50 border-red-500 text-red-600' : 'bg-white text-slate-500 hover:border-slate-300'
                                        }`}
                                    >
                                        {t.label}
                                        <Tooltip text={t.tip} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3 px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Pain Magnitude</label>
                                <span className="text-xs font-black italic">{injury.painLevel} / 10</span>
                            </div>
                            <input type="range" min="0" max="10" value={injury.painLevel} onChange={(e) => setInjury(prev => ({ ...prev, painLevel: parseInt(e.target.value) }))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none accent-red-600" />
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors">
                            <Activity size={20} className="text-slate-400" />
                            <div className="flex-1">
                                <div className="text-[10px] text-slate-900 font-black uppercase tracking-tight">Kinetic Trigger?</div>
                                <div className="text-[9px] text-slate-500 font-medium">Does load increase pain?</div>
                            </div>
                            <div onClick={() => setInjury(prev => ({ ...prev, worsensWithExercise: !prev.worsensWithExercise }))} className={`w-12 h-6 rounded-full p-1 transition-all ${injury.worsensWithExercise ? 'bg-red-600' : 'bg-slate-200'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${injury.worsensWithExercise ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                    </div>

                    <button onClick={() => setStep(3)} disabled={!injury.type} className={`w-full py-4 mt-2 rounded-xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 shrink-0 ${injury.type ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-100 text-slate-300'}`}>
                        Assess Protocol <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-right">
                    <button onClick={() => setStep(2)} className="self-start text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <ArrowLeft size={14} strokeWidth={3} /> Review Details
                    </button>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">Evidence Sync</h3>
                    <p className="text-[10px] text-slate-500 font-medium mb-6">Attach photo of inflammation for precision adaptation.</p>

                    <div className="flex-1 flex flex-col gap-4 justify-center">
                        {image ? (
                            <div className="relative rounded-2xl overflow-hidden border shadow-xl group animate-in zoom-in">
                                <img src={`data:${image.mime};base64,${image.base64}`} alt="Injury" className="w-full h-40 object-cover" />
                                <button onClick={() => setImage(null)} className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-lg shadow-lg hover:scale-110 transition-all">
                                    <X size={14} strokeWidth={3} />
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={startCamera} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all flex flex-col items-center gap-3 group">
                                    <Camera size={24} className="text-slate-400 group-hover:text-slate-900" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Live Capture</span>
                                </button>
                                <button onClick={() => fileInputRef.current?.click()} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 transition-all flex flex-col items-center gap-3 group">
                                    <Upload size={24} className="text-slate-400 group-hover:text-slate-900" />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Upload Data</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </div>
                        )}
                    </div>

                    <div className="mt-6">
                        <button onClick={handleSubmit} className="w-full py-5 bg-red-600 text-white rounded-xl font-black uppercase tracking-[0.4em] text-[10px] transition-all hover:bg-red-700 shadow-xl flex items-center justify-center gap-3">
                             {existingInjury ? 'SYNC RECOVERY' : 'INITIALIZE PROTOCOL'} <Activity size={18} />
                        </button>
                    </div>
                </div>
            )}
            
            {isAnalyzing && (
                <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                    <div className="relative mb-6">
                        <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-red-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Activity size={20} className="text-red-600 animate-pulse" />
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 italic tracking-tighter uppercase leading-none mb-3">CALCULATING REHAB</h3>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] animate-pulse">Scanning Biomechanic Delta...</p>
                </div>
            )}
        </div>

        {cameraActive && (
             <div className="absolute inset-0 z-[110] bg-black flex flex-col">
                 <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                 <div className="absolute top-6 right-6 z-20">
                     <button onClick={() => { setCameraActive(false); (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t => t.stop()); }} className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white"><X size={20}/></button>
                 </div>
                 <div className="absolute bottom-10 inset-x-0 flex justify-center items-center z-20">
                     <button onClick={captureImage} className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center bg-white shadow-2xl" />
                 </div>
             </div>
        )}
    </div>
  );
};

export default InjuryReportingModal;

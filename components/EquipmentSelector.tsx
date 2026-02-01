
import React, { useState, useRef } from 'react';
import { Equipment, Injury, InBodyData } from '../types';
import { 
  Dumbbell, Home, Zap, Activity, Check, X, Loader2, Upload, Camera, ScanLine, CheckCircle, Utensils, Plus, Trash2, ShoppingBasket, AlertCircle
} from 'lucide-react';
import { extractInBodyData } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';

interface EquipmentSelectorProps {
  onComplete: (equipment: Equipment, injuries: Injury[], days: string[], availableMeals: string[], inbodyData?: InBodyData) => void;
}

const EquipmentSelector: React.FC<EquipmentSelectorProps> = ({ onComplete }) => {
  const { t, language } = useSettings();
  const [equipment, setEquipment] = useState<Equipment>('gym_full');
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [availableMeals, setAvailableMeals] = useState<string[]>([]);
  const [mealInput, setMealInput] = useState('');
  const [inbodyData, setInbodyData] = useState<InBodyData | undefined>();
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? (prev.length > 1 ? prev.filter(d => d !== day) : prev) : [...prev, day]);
  };

  const toggleInjury = (injury: Injury) => {
    if (injury === 'none') { setInjuries([]); return; }
    setInjuries(prev => {
        const newInjuries = prev.filter(i => i !== 'none');
        return newInjuries.includes(injury) ? newInjuries.filter(i => i !== injury) : [...newInjuries, injury];
    });
  };

  const addMeal = () => {
    if (mealInput.trim() && !availableMeals.includes(mealInput.trim())) {
      setAvailableMeals([...availableMeals, mealInput.trim()]);
      setMealInput('');
    }
  };

  const removeMeal = (meal: string) => {
    setAvailableMeals(availableMeals.filter(m => m !== meal));
  };

  const startCamera = async () => {
    setScanError(null);
    try {
        setCameraActive(true);
        setTimeout(async () => {
             const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
             if (videoRef.current) videoRef.current.srcObject = stream;
        }, 100);
    } catch (err) {
        console.error(err);
        setScanError("Camera access denied or unavailable.");
        setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg');
        setPreview(base64);
        setCameraActive(false);
        
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
        
        processImage(base64.split(',')[1], 'image/jpeg');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setScanError(null);
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPreview(result);
        processImage(result.split(',')[1], file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string, mime: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
        const result = await extractInBodyData(base64, mime);
        if (result.errorReason) {
             setScanError(result.errorReason);
             setPreview(null);
        } else {
             setInbodyData(result);
        }
    } catch (e) {
        console.warn("[System Message] Body Scan Failed:", e);
        // Suppressed visible error as requested
        setPreview(null);
    } finally {
        setIsScanning(false);
    }
  };

  const clearInBody = () => {
    setInbodyData(undefined);
    setPreview(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const EQ_OPTS = [
      { id: 'gym_full', label: t('eqGym'), icon: Zap, desc: t('eqGymDesc') },
      { id: 'home_gym', label: t('eqHome'), icon: Home, desc: t('eqHomeDesc') },
      { id: 'dumbbells_only', label: t('eqDumbbells'), icon: Dumbbell, desc: t('eqDumbbellsDesc') },
      { id: 'bodyweight', label: t('eqBodyweight'), icon: Activity, desc: t('eqBodyweightDesc') },
  ];

  const INJURY_OPTS = [
      { id: 'shoulder', label: t('eqShoulder') },
      { id: 'knee', label: t('eqKnee') },
      { id: 'lower_back', label: t('eqBack') },
      { id: 'wrist', label: t('eqWrist') },
      { id: 'none', label: t('eqNone') },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 flex justify-center overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl w-full animate-fade-in pb-20 pt-10">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-[900] italic tracking-tighter text-slate-900 mb-2 uppercase">FINAL PARAMETERS</h2>
                <p className="text-slate-500 font-medium">Fine-tuning your protocol constraints.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Equipment & Schedule */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('eqAccess')}</h3>
                        <div className="grid gap-3">
                            {EQ_OPTS.map((eq) => (
                                <button
                                    key={eq.id}
                                    onClick={() => setEquipment(eq.id as Equipment)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                                        equipment === eq.id 
                                        ? 'bg-primary/5 border-primary shadow-sm' 
                                        : 'bg-white border-slate-100 hover:border-slate-300'
                                    }`}
                                >
                                    <div className={`p-2.5 rounded-xl ${equipment === eq.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                                        <eq.icon size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold text-sm ${equipment === eq.id ? 'text-primary' : 'text-slate-700'}`}>{eq.label}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{eq.desc}</div>
                                    </div>
                                    {equipment === eq.id && <CheckCircle size={18} className="text-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('eqDays')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map(day => (
                                <button
                                    key={day}
                                    onClick={() => toggleDay(day)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                        selectedDays.includes(day)
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    {day.slice(0,3)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Nutrition Inventory & Biometrics */}
                <div className="space-y-8">
                    {/* NEW: MEAL INVENTORY SECTION */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">MEAL INVENTORY</h3>
                            <ShoppingBasket size={14} className="text-slate-300" />
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                            <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed">
                                List the meals or ingredients you currently have. Our Coach will validate their suitability for your goal and include the best ones in your plan.
                            </p>
                            
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Utensils size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text"
                                        value={mealInput}
                                        onChange={(e) => setMealInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addMeal()}
                                        placeholder="Add chicken breast, oats..."
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-3 text-xs font-bold text-slate-700 outline-none focus:border-primary"
                                    />
                                </div>
                                <button 
                                    onClick={addMeal}
                                    className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {availableMeals.map((meal, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm animate-in scale-in">
                                        <span className="text-[11px] font-bold text-slate-600">{meal}</span>
                                        <button onClick={() => removeMeal(meal)} className="text-slate-400 hover:text-red-500">
                                            <X size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                                {availableMeals.length === 0 && (
                                    <div className="w-full py-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Items Added</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('eqLimitations')}</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {INJURY_OPTS.map(inj => {
                                const id = inj.id as Injury;
                                const active = injuries.includes(id) || (id === 'none' && injuries.length === 0);
                                const isNone = id === 'none';
                                return (
                                    <button
                                        key={id}
                                        onClick={() => toggleInjury(id)}
                                        className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                            active
                                            ? (isNone ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-rose-50 border-rose-500 text-rose-600')
                                            : 'bg-white border-slate-100 text-slate-400 hover:text-slate-700'
                                        }`}
                                    >
                                        {inj.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('eqBio')}</h3>
                        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm transition-all">
                            {inbodyData ? (
                                <div className="p-4">
                                    <div className="flex items-start gap-4 mb-4">
                                        {preview && (
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                                <img src={preview} alt="Scan" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-xs text-slate-900 flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Synced</span>
                                                <button onClick={clearInBody} className="text-[10px] text-rose-500 font-bold uppercase">Clear</button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">Biometric extraction active.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                                            <div className="text-[9px] text-slate-400 font-bold mb-1">WGT</div>
                                            <div className="text-xs font-black">{inbodyData.weight}kg</div>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                                            <div className="text-[9px] text-slate-400 font-bold mb-1">FAT</div>
                                            <div className="text-xs font-black">{inbodyData.bodyFat}%</div>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl text-center">
                                            <div className="text-[9px] text-slate-400 font-bold mb-1">MUS</div>
                                            <div className="text-xs font-black">{inbodyData.skeletalMuscleMass || '--'}</div>
                                        </div>
                                    </div>
                                </div>
                            ) : isScanning ? (
                                <div className="p-8 flex flex-col items-center justify-center text-center">
                                    <Loader2 className="text-primary animate-spin mb-3" size={24} />
                                    <div className="text-xs font-black text-slate-900 uppercase tracking-widest animate-pulse">Extracting Biometrics</div>
                                </div>
                            ) : (
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={startCamera}
                                            className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary transition-all flex flex-col items-center justify-center gap-2 group"
                                        >
                                            <Camera size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary">Camera</span>
                                        </button>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary transition-all flex flex-col items-center justify-center gap-2 group"
                                        >
                                            <Upload size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary">Upload</span>
                                        </button>
                                    </div>
                                    {scanError && (
                                        <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                            <AlertCircle size={14} className="text-rose-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] font-bold text-rose-600 leading-snug">{scanError}</p>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => onComplete(equipment, injuries, selectedDays, availableMeals, inbodyData)}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 group flex items-center justify-center gap-3 active:scale-[0.98]"
            >
                {t('eqGenerate')}
                <Zap size={18} className="text-amber-400 fill-amber-400 group-hover:animate-pulse" />
            </button>
        </div>

        {/* Camera Overlay */}
        {cameraActive && (
             <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
                 <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
                 <canvas ref={canvasRef} className="hidden" />
                 <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-20">
                     <span className="text-white text-[10px] font-black uppercase tracking-widest">Medical Scan Active</span>
                     <button onClick={() => { 
                         setCameraActive(false); 
                         const stream = videoRef.current?.srcObject as MediaStream;
                         stream?.getTracks().forEach(t => t.stop());
                     }} className="p-2 rounded-full bg-white/10 text-white backdrop-blur-md"><X size={20}/></button>
                 </div>
                 <div className="absolute bottom-0 inset-x-0 p-12 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center z-20">
                     <button 
                         onClick={captureImage} 
                         className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative active:scale-90 transition-transform shadow-lg"
                     >
                         <div className="w-16 h-16 bg-white rounded-full" />
                     </button>
                 </div>
             </div>
        )}
    </div>
  );
};

export default EquipmentSelector;

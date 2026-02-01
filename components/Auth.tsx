import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Loader2, ArrowRight, AlertCircle, Mail, Apple, Settings, Camera, X } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/**
 * ASCEND ELITE LOGO
 * A high-impact, typographic-only mark. 
 * Optimized for strength and stability using an ultra-bold italic weight.
 */
export const AscendLogo = ({ size = 28, className = "", textColor = "text-text" }: { size?: number, className?: string, textColor?: string }) => (
  <div className={`inline-flex items-center select-none ${className} ${textColor}`}>
    <span 
      className="font-[900] italic tracking-[-0.04em] uppercase leading-none drop-shadow-sm" 
      style={{ fontSize: size }}
    >
      ASCEND
    </span>
  </div>
);

const Auth: React.FC = () => {
  const { login, signup, socialLogin } = useAuth();
  const { t, openSettings, language } = useSettings();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    avatar: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setFormData(prev => ({ ...prev, avatar: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email || !formData.password) {
        setError("Please fill in all required fields.");
        return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error("Name is required");
        await signup(formData.name, formData.email, formData.password, formData.avatar);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: 'google' | 'apple') => {
      setError(null);
      setLoading(true);
      try {
          await socialLogin(provider);
      } catch (err) {
          setError("Social authentication failed.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background relative overflow-y-auto">
      <button 
        onClick={openSettings}
        className="absolute top-6 right-6 p-3 rounded-full bg-white border border-border text-textMuted hover:text-text shadow-sm z-50 rtl:left-6 rtl:right-auto active:scale-95"
      >
        <Settings size={20} />
      </button>

      <div className="w-full max-w-sm py-12 animate-fade-in flex flex-col items-center">
        
        <div className="text-center mb-10 w-full flex flex-col items-center">
            <div className="flex flex-col items-center mb-6 group cursor-default">
                {imgError ? (
                  <AscendLogo size={48} className="mb-4" />
                ) : (
                  <img 
                    src="LOGO.png" 
                    alt="ASCEND" 
                    className="h-20 mb-4 object-contain" 
                    onError={() => setImgError(true)}
                  />
                )}
            </div>
            
            <p className="text-textMuted text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                {isLogin ? t('authVerify') : t('authInit')}
            </p>
        </div>

        <div className="w-full bg-surface rounded-[32px] p-8 shadow-2xl border border-border">
           {error && (
             <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-600 text-xs font-bold animate-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
             </div>
           )}

            <div className="grid grid-cols-2 gap-3 mb-8">
                <button 
                    onClick={() => handleSocial('google')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all active:scale-95"
                >
                    <GoogleIcon /> Google
                </button>
                <button 
                    onClick={() => handleSocial('apple')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all active:scale-95"
                >
                    <Apple size={18} /> Apple
                </button>
            </div>

            <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-surface px-4 text-textMuted">{t('authOr')}</span>
                </div>
            </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center mb-2">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-border border-dashed flex items-center justify-center overflow-hidden transition-all">
                        {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="text-slate-300" size={32} />
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => formData.avatar ? removeAvatar() : fileInputRef.current?.click()}
                        className={`absolute -bottom-2 -right-2 p-2.5 rounded-2xl shadow-xl transition-all active:scale-90 border-2 border-white ${formData.avatar ? 'bg-rose-500 text-white' : 'bg-primary text-white'}`}
                      >
                        {formData.avatar ? <X size={14} strokeWidth={3} /> : <Camera size={14} strokeWidth={3} />}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-textMuted ml-1 uppercase tracking-widest">{t('authName')}</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-surfaceHighlight border border-border rounded-2xl px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                   <label className="text-[10px] font-black text-textMuted ml-1 uppercase tracking-widest">{t('authEmail')}</label>
                   <div className="relative">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-textMuted opacity-50" size={18} />
                       <input 
                         type="email" 
                         required
                         value={formData.email}
                         onChange={(e) => setFormData({...formData, email: e.target.value})}
                         className="w-full bg-surfaceHighlight border border-border rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-text outline-none focus:border-primary transition-all"
                         placeholder="you@email.com"
                       />
                   </div>
              </div>

              <div className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                       <label className="text-[10px] font-black text-textMuted uppercase tracking-widest">{t('authPass')}</label>
                       {isLogin && <button type="button" className="text-[10px] font-bold text-primary hover:text-primaryDark">{t('authForgot')}</button>}
                   </div>
                   <input 
                     type="password" 
                     required
                     value={formData.password}
                     onChange={(e) => setFormData({...formData, password: e.target.value})}
                     className="w-full bg-surfaceHighlight border border-border rounded-2xl px-5 py-4 text-sm font-bold text-text outline-none focus:border-primary transition-all"
                     placeholder="••••••••"
                   />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-sm transition-all flex items-center justify-center gap-3 shadow-xl hover:bg-black active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? t('authEstablish') : t('authRegister'))}
                {!loading && <ArrowRight size={20} className={language === 'ar' ? 'rotate-180' : ''} />}
              </button>
           </form>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); }}
                className="text-xs font-bold text-textMuted hover:text-text transition-all"
            >
                {isLogin ? t('authNewUser') : t('authExisting')}
                <span className="text-slate-900 font-black ml-2 uppercase tracking-tighter">{isLogin ? t('authInitProto') : t('authSignIn')}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;

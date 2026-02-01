import React from 'react';
import { ArrowLeft, Moon, Sun, Globe, Settings, RefreshCw, LogOut, ChevronRight, Bell, Clock, ShieldCheck, ShieldAlert, Droplets } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
    onReset?: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onReset }) => {
    const { 
        language, setLanguage, 
        darkMode, toggleTheme, 
        notificationsEnabled, setNotificationsEnabled,
        reminderTime, setReminderTime,
        hydrationEnabled, setHydrationEnabled,
        hydrationInterval, setHydrationInterval,
        notificationPermission, requestNotificationPermission,
        t, closeSettings, isSettingsOpen 
    } = useSettings();
    const { logout } = useAuth();

    if (!isSettingsOpen) return null;

    const handleReset = () => {
        if (onReset) onReset();
        closeSettings();
    };

    const handleLogout = () => {
        logout();
        closeSettings();
    };

    return (
          <div className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm text-text font-sans p-4 flex items-center justify-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="w-full max-w-xl bg-surface border border-border rounded-[32px] shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar relative animate-scale-in">
                  <header className="flex items-center justify-between mb-8 sticky top-0 bg-surface/95 backdrop-blur-sm z-10 py-2">
                      <h1 className="text-3xl font-bold tracking-tight">{t('settings')}</h1>
                      <button 
                        onClick={closeSettings}
                        className="p-2 -mr-2 rounded-full hover:bg-surfaceHighlight text-textMuted hover:text-text transition-colors"
                      >
                          {language === 'ar' ? <ArrowLeft size={24} className="rotate-180" /> : <ArrowLeft size={24} />}
                      </button>
                  </header>

                  <div className="space-y-6">
                      {/* Appearance Section */}
                      <div className="bg-surfaceHighlight/20 border border-border rounded-[24px] p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                              <h2 className="text-lg font-bold">{t('appearance')}</h2>
                              <Moon size={20} className="text-primary" /> 
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border/50">
                               <div className="flex items-center gap-3">
                                   <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer ${darkMode ? 'bg-slate-800' : 'bg-slate-300'}`} onClick={toggleTheme}>
                                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${darkMode ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                                   </div>
                               </div>
                               <div className="text-right flex flex-col items-end">
                                   <div className="flex items-center gap-2">
                                       <span className="font-bold text-sm">{t('darkMode')}</span>
                                       <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-orange-100 text-orange-500' : 'bg-orange-50 text-orange-400'}`}>
                                           <Sun size={14} />
                                       </div>
                                   </div>
                                   <span className="text-[10px] text-textMuted">{t('darkModeDesc')}</span>
                               </div>
                          </div>
                      </div>

                      {/* Notifications Section */}
                      <div className="bg-surfaceHighlight/20 border border-border rounded-[24px] p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                              <h2 className="text-lg font-bold">{t('notifications')}</h2>
                              <Bell size={20} className="text-indigo-500" />
                          </div>
                          
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border/50">
                                   <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer ${notificationsEnabled ? 'bg-primary' : 'bg-slate-300'}`} onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${notificationsEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                                   </div>
                                   <div className="text-right flex flex-col items-end">
                                       <span className="font-bold text-sm">{t('notifEnable')}</span>
                                       <span className="text-[10px] text-textMuted">{t('notifDesc')}</span>
                                   </div>
                              </div>

                              {notificationsEnabled && (
                                <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border/50 animate-in slide-in-from-top-2">
                                     <input 
                                        type="time" 
                                        value={reminderTime}
                                        onChange={(e) => setReminderTime(e.target.value)}
                                        className="bg-transparent font-bold text-primary outline-none text-lg"
                                     />
                                     <div className="text-right flex flex-col items-end">
                                         <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">{t('notifTime')}</span>
                                            <Clock size={14} className="text-slate-400" />
                                         </div>
                                     </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border/50">
                                   {notificationPermission === 'granted' ? (
                                       <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                           <ShieldCheck size={16} /> {t('notifGranted')}
                                       </div>
                                   ) : (
                                       <button 
                                          onClick={requestNotificationPermission}
                                          className="flex items-center gap-2 text-primary font-bold text-xs hover:underline"
                                       >
                                           <ShieldAlert size={16} /> {t('notifRequest')}
                                       </button>
                                   )}
                                   <span className="font-bold text-sm text-textMuted">{t('notifPermission')}</span>
                              </div>
                          </div>
                      </div>

                      {/* Hydration Section */}
                      <div className="bg-surfaceHighlight/20 border border-border rounded-[24px] p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                              <h2 className="text-lg font-bold">{t('hydration')}</h2>
                              <Droplets size={20} className="text-blue-500" />
                          </div>
                          
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border/50">
                                   <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 cursor-pointer ${hydrationEnabled ? 'bg-blue-500' : 'bg-slate-300'}`} onClick={() => setHydrationEnabled(!hydrationEnabled)}>
                                      <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${hydrationEnabled ? (language === 'ar' ? '-translate-x-5' : 'translate-x-5') : ''}`} />
                                   </div>
                                   <div className="text-right flex flex-col items-end">
                                       <span className="font-bold text-sm">{t('hydrationEnable')}</span>
                                       <span className="text-[10px] text-textMuted">Stay hydrated throughout the day</span>
                                   </div>
                              </div>

                              {hydrationEnabled && (
                                <div className="p-4 bg-surface rounded-2xl border border-border/50 space-y-4 animate-in slide-in-from-top-2">
                                     <div className="flex justify-between items-center mb-2">
                                         <span className="text-sm font-bold">{t('hydrationInterval')}</span>
                                         <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{t(`hydrationInterval${hydrationInterval}`)}</span>
                                     </div>
                                     <div className="grid grid-cols-4 gap-2">
                                         {[1, 2, 3, 4].map(h => (
                                             <button 
                                                key={h}
                                                onClick={() => setHydrationInterval(h)}
                                                className={`py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${hydrationInterval === h ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-400 border-transparent hover:border-slate-200'}`}
                                             >
                                                 {h}H
                                             </button>
                                         ))}
                                     </div>
                                </div>
                              )}
                          </div>
                      </div>

                      {/* Language Section */}
                      <div className="bg-surfaceHighlight/20 border border-border rounded-[24px] p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                              <h2 className="text-lg font-bold">{t('language')}</h2>
                              <Globe size={20} className="text-secondary" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => setLanguage('ar')}
                                className={`relative p-4 rounded-2xl border transition-all flex items-center justify-between group overflow-hidden ${
                                    language === 'ar' 
                                    ? 'bg-primary/5 border-primary shadow-sm' 
                                    : 'bg-surface border-transparent hover:border-border'
                                }`}
                              >
                                  <span className={`font-bold text-sm ${language === 'ar' ? 'text-primary' : 'text-textMuted'}`}>Arabic ( العربية )</span>
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${language === 'ar' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>AR</span>
                              </button>

                              <button 
                                onClick={() => setLanguage('en')}
                                className={`relative p-4 rounded-2xl border transition-all flex items-center justify-between group overflow-hidden ${
                                    language === 'en' 
                                    ? 'bg-primary/5 border-primary shadow-sm' 
                                    : 'bg-surface border-transparent hover:border-border'
                                }`}
                              >
                                  <span className={`font-bold text-sm ${language === 'en' ? 'text-primary' : 'text-textMuted'}`}>English</span>
                                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${language === 'en' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>EN</span>
                              </button>
                          </div>
                      </div>

                      {/* System Section */}
                      <div className="bg-surfaceHighlight/20 border border-border rounded-[24px] p-6 shadow-sm">
                          <div className="flex items-center justify-between mb-6">
                              <h2 className="text-lg font-bold">{t('system')}</h2>
                              <Settings size={20} className="text-slate-400" />
                          </div>
                          
                          <div className="space-y-3">
                              {onReset && (
                                <button 
                                    onClick={handleReset}
                                    className="w-full flex items-center justify-between p-4 bg-surface hover:bg-rose-50 text-text hover:text-rose-600 rounded-2xl transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ChevronRight size={16} className={`text-textMuted/50 group-hover:text-rose-400 ${language === 'ar' ? 'rotate-180' : ''}`} />
                                        <span className="font-medium text-sm">{t('resetData')}</span>
                                    </div>
                                    <RefreshCw size={18} className="text-textMuted group-hover:text-rose-500" />
                                </button>
                              )}

                              <button 
                                onClick={handleLogout}
                                className="w-full flex items-center justify-between p-4 bg-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-text rounded-2xl transition-colors group"
                              >
                                  <div className="flex items-center gap-3">
                                      <ChevronRight size={16} className={`text-textMuted/50 group-hover:text-text ${language === 'ar' ? 'rotate-180' : ''}`} />
                                      <span className="font-medium text-sm">{t('logOut')}</span>
                                  </div>
                                  <LogOut size={18} className="text-textMuted group-hover:text-text" />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
    );
};

export default SettingsModal;
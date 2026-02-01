import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Activity, DollarSign, TrendingUp, Shield, BarChart2, 
  Search, Filter, ChevronDown, Bell, LogOut, ArrowLeft,
  UserCheck, UserPlus, UserX, Crown, CreditCard, Download,
  Zap, Database, Server, AlertTriangle, CheckCircle, X, ChevronRight,
  PieChart as PieIcon, Calendar, Lock, Unlock, Trash2, Gift, Tag, Plus,
  LayoutDashboard, History, Settings, MousePointer2, RefreshCw, Cpu,
  ExternalLink, User as UserIcon, Globe, Layers, BarChart as BarChartIcon,
  Menu, Percent
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, INITIAL_CREDITS, PromoCode } from '../types';
import { UserData, getGlobalPromos, addGlobalPromo, removeGlobalPromo } from '../services/storageService';
import { AscendLogo } from './Auth';

interface FounderDashboardProps {
  onBack: () => void;
}

interface AdminUser extends UserData {
  isOnline?: boolean;
}

const STORAGE_PREFIX = 'physique_v2_';

const FounderDashboard: React.FC<FounderDashboardProps> = ({ onBack }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'promos' | 'system'>('overview');
  const [realUsers, setRealUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Promo Code State
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [newPromo, setNewPromo] = useState<{
      code: string;
      value: number;
      type: 'credits' | 'premium' | 'discount';
      magnitudeType: 'fixed' | 'percentage';
      maxUses?: number;
      expiryDate?: string;
  }>({ code: '', value: 100, type: 'credits', magnitudeType: 'fixed' });

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchData = () => {
        const users: AdminUser[] = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(STORAGE_PREFIX)) {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const data = JSON.parse(raw);
                        if (data && data.profile) {
                            users.push({
                                ...data,
                                isOnline: Math.random() > 0.85,
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Founder data load failed", e);
        }
        setRealUsers(users.sort((a,b) => new Date(b.lastSynced || 0).getTime() - new Date(a.lastSynced || 0).getTime()));
        setPromos(getGlobalPromos());
    };
    fetchData();
  }, [refreshTrigger, activeTab]);

  // --- ADMIN ACTIONS ---
  const updateUserProfile = (userId: string, updates: Partial<UserProfile>) => {
      try {
          const key = `${STORAGE_PREFIX}${userId}`;
          const raw = localStorage.getItem(key);
          if (raw) {
              const data = JSON.parse(raw);
              data.profile = { ...data.profile, ...updates };
              localStorage.setItem(key, JSON.stringify(data));
              setRefreshTrigger(p => p + 1);
              if (selectedUser && selectedUser.id === userId) {
                  setSelectedUser({ ...selectedUser, profile: { ...selectedUser.profile, ...updates } });
              }
          }
      } catch (e) {
          alert("Action failed. Verification required.");
      }
  };

  const handleGrantPremium = (u: AdminUser) => {
      if (!u.profile) return;
      updateUserProfile(u.id, { isPremium: !u.profile.isPremium });
  };

  const handleAddCredits = (u: AdminUser, amount: number) => {
      if (!u.profile) return;
      updateUserProfile(u.id, { credits: (u.profile.credits || 0) + amount });
  };

  const handleDeleteUser = (userId: string) => {
      if (confirm("DANGER: Wiping user metadata. Proceed?")) {
          localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
          setRefreshTrigger(p => p + 1);
          setSelectedUser(null);
      }
  };

  const handleAddPromo = () => {
      if (!newPromo.code) return;
      addGlobalPromo(newPromo.code, newPromo.value, newPromo.type, newPromo.magnitudeType, newPromo.maxUses, newPromo.expiryDate);
      setNewPromo({ code: '', value: 100, type: 'credits', magnitudeType: 'fixed' });
      setPromos(getGlobalPromos());
  };

  const handleRemovePromo = (code: string) => {
      if (confirm(`Revoke promo ${code}?`)) {
          removeGlobalPromo(code);
          setPromos(getGlobalPromos());
      }
  };

  // --- ANALYTICS ---
  const stats = useMemo(() => {
      const totalRevenue = realUsers.reduce((acc, u) => {
          const premiumRev = u.profile?.isPremium ? 29.99 : 0;
          const creditRev = ((u.profile?.credits || INITIAL_CREDITS) - INITIAL_CREDITS) * 0.05;
          return acc + premiumRev + Math.max(0, creditRev);
      }, 0);

      const goalDist = realUsers.reduce((acc, u) => {
          const g = u.profile?.goal || 'muscle_gain';
          acc[g] = (acc[g] || 0) + 1;
          return acc;
      }, {} as Record<string, number>);

      const chartData = realUsers.slice(0, 10).map((u, i) => ({
          name: u.profile?.name?.split(' ')[0] || `U${i}`,
          credits: u.profile?.credits || 0,
          actions: u.history?.length || 0
      }));

      return { totalRevenue, goalDist, chartData };
  }, [realUsers]);

  const pieData = Object.keys(stats.goalDist).map(k => ({ 
      name: k.toUpperCase().replace('_', ' '), 
      value: stats.goalDist[k],
      color: k === 'muscle_gain' ? '#4f46e5' : k === 'fat_loss' ? '#10b981' : '#f43f5e'
  }));

  const filteredUsers = realUsers.filter(u => 
      u.profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigation = [
    { id: 'overview', label: 'Monitor', icon: LayoutDashboard },
    { id: 'users', label: 'Athletes', icon: Users },
    { id: 'promos', label: 'Deployments', icon: Zap },
    { id: 'system', label: 'System', icon: Server },
  ] as const;

  return (
    <div className="min-h-screen bg-[#05060f] text-slate-300 font-sans selection:bg-primary/40 flex flex-col h-screen overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
      </div>

      {/* Responsive Header */}
      <header className="relative z-[100] border-b border-white/5 bg-black/40 backdrop-blur-3xl px-4 md:px-8 h-20 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4 text-left">
              <AscendLogo size={24} textColor="text-white" />
              <div className="hidden sm:block h-6 w-px bg-white/10"></div>
              <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase leading-none">Founder Console</span>
                  <span className="text-[8px] font-mono text-emerald-500 mt-1 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                      ENCRYPTION ACTIVE
                  </span>
              </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/5">
              {navigation.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                        ? 'bg-white/10 text-white shadow-xl border border-white/10 scale-105' 
                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                      <tab.icon size={14} /> {tab.label}
                  </button>
              ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
              <button 
                className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/5 text-slate-400"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <button 
                  onClick={onBack}
                  className="px-4 md:px-5 py-2.5 rounded-xl text-[10px] font-black text-white bg-rose-600 hover:bg-rose-500 transition-all uppercase tracking-widest shadow-lg shadow-rose-900/20 active:scale-95"
              >
                  Exit
              </button>
          </div>
      </header>

      {/* Mobile Sidebar Menu */}
      {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex flex-col pt-24 p-6 animate-fade-in">
              <div className="space-y-3">
                  {navigation.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-4 p-5 rounded-[24px] text-sm font-black uppercase tracking-[0.2em] transition-all border ${
                            activeTab === tab.id 
                            ? 'bg-primary/20 text-white border-primary/40 shadow-2xl' 
                            : 'bg-white/5 text-slate-500 border-white/5'
                        }`}
                      >
                          <tab.icon size={18} /> {tab.label}
                      </button>
                  ))}
              </div>
          </div>
      )}

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 lg:p-10 relative z-10">
        <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-12">
            
            {activeTab === 'overview' && (
                <div className="space-y-8 md:space-y-12 animate-fade-in">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {[
                            { label: 'Athletes', value: realUsers.length, icon: Users, color: 'from-blue-600/10 to-primary/10', accent: 'text-primary' },
                            { label: 'Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'from-emerald-600/10 to-teal-500/10', accent: 'text-emerald-500' },
                            { label: 'Active', value: realUsers.filter(u => u.plan).length, icon: Activity, color: 'from-purple-600/10 to-fuchsia-500/10', accent: 'text-purple-500' },
                            { label: 'Elite', value: `${((realUsers.filter(u => u.profile?.isPremium).length / (realUsers.length || 1)) * 100).toFixed(0)}%`, icon: Crown, color: 'from-amber-600/10 to-orange-500/10', accent: 'text-amber-500' },
                        ].map((metric, i) => (
                            <div key={i} className={`bg-gradient-to-br ${metric.color} border border-white/5 p-5 md:p-8 rounded-[32px] group relative overflow-hidden shadow-2xl text-left`}>
                                <metric.icon className={`absolute top-4 right-4 md:top-6 md:right-6 opacity-10 group-hover:opacity-20 transition-opacity ${metric.accent}`} size={32} />
                                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1 md:mb-2">{metric.label}</div>
                                <div className="text-2xl md:text-4xl font-black text-white tracking-tighter">{metric.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                        {/* Allocation Chart */}
                        <div className="bg-black/20 border border-white/5 rounded-[40px] p-6 md:p-10 backdrop-blur-xl h-[400px] flex flex-col shadow-2xl">
                             <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                 <PieIcon size={16} className="text-primary" /> Goal Mix
                             </h3>
                             <div className="flex-1 w-full relative">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <PieChart>
                                         <Pie 
                                            data={pieData} 
                                            innerRadius={70} 
                                            outerRadius={100} 
                                            paddingAngle={8} 
                                            dataKey="value"
                                            stroke="none"
                                         >
                                             {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.6} />)}
                                         </Pie>
                                         <Tooltip 
                                            contentStyle={{backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px', fontWeight: 'bold'}} 
                                            itemStyle={{color: '#fff'}}
                                         />
                                     </PieChart>
                                 </ResponsiveContainer>
                                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                     <span className="text-3xl font-black text-white">{realUsers.length}</span>
                                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                                 </div>
                             </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="lg:col-span-2 bg-black/20 border border-white/5 rounded-[40px] p-6 md:p-10 backdrop-blur-xl h-[400px] flex flex-col shadow-2xl">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                                <TrendingUp size={16} className="text-emerald-500" /> Platform Velocity
                            </h3>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.chartData}>
                                        <defs>
                                            <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 800}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748b', fontWeight: 800}} />
                                        <Tooltip 
                                            contentStyle={{backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}}
                                            itemStyle={{fontSize: '10px', fontWeight: 'black'}}
                                        />
                                        <Area type="monotone" dataKey="actions" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorUsage)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-10 h-auto lg:h-[calc(100vh-200px)] animate-fade-in overflow-hidden">
                    {/* Athlete Directory */}
                    <div className={`lg:col-span-2 bg-black/40 border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl ${selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                        <div className="p-6 md:p-8 border-b border-white/5 flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH DATABASE..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-[10px] font-black text-white tracking-widest placeholder:opacity-30 focus:outline-none focus:border-primary/50 transition-all uppercase" 
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {filteredUsers.map(u => (
                                <button 
                                    key={u.id} 
                                    onClick={() => setSelectedUser(u)} 
                                    className={`w-full flex items-center justify-between p-5 rounded-[24px] border transition-all text-left group relative overflow-hidden ${selectedUser?.id === u.id ? 'bg-primary/10 border-primary/40 shadow-xl' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                                <UserIcon size={18} className={u.isOnline ? 'text-emerald-500' : 'text-slate-500'} />
                                            </div>
                                            {u.isOnline && <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black animate-pulse"></span>}
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-white flex items-center gap-2 tracking-tight">
                                                {u.profile?.name || 'Unknown Athlete'}
                                                {u.profile?.isPremium && <Crown size={12} className="text-amber-500 fill-amber-500" />}
                                            </div>
                                            <div className="text-[9px] text-slate-600 font-mono mt-0.5 truncate max-w-[140px]">{u.profile?.email || 'No email provided'}</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-700" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Athlete Inspector */}
                    <div className={`lg:col-span-3 bg-white/5 border border-white/10 rounded-[40px] overflow-hidden flex flex-col relative shadow-2xl backdrop-blur-3xl animate-slide-up ${!selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                        {selectedUser ? (
                            <div className="flex-1 p-6 md:p-10 space-y-8 md:space-y-12 overflow-y-auto custom-scrollbar">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6 text-left">
                                    <div className="flex flex-col md:flex-row gap-6 items-center w-full md:w-auto">
                                        <button onClick={() => setSelectedUser(null)} className="lg:hidden self-start p-3 rounded-full bg-white/5 mb-2"><ArrowLeft size={18} /></button>
                                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-[32px] bg-gradient-to-br from-primary/40 to-slate-800 flex items-center justify-center text-4xl font-black text-white shadow-2xl border border-white/10 shrink-0">
                                            {selectedUser.profile?.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="text-left">
                                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter mb-2">{selectedUser.profile?.name || 'Athlete Profile'}</h2>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${selectedUser.profile?.isPremium ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                                                    {selectedUser.profile?.isPremium ? 'Elite Tier' : 'Standard'}
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-600">ID: {selectedUser.id?.slice(0,12) || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto justify-center">
                                        <button 
                                            onClick={() => handleGrantPremium(selectedUser)} 
                                            className={`flex-1 md:flex-none p-4 rounded-2xl border transition-all flex items-center justify-center gap-2 ${selectedUser.profile?.isPremium ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                                        >
                                            <Crown size={18} />
                                            <span className="md:hidden text-[10px] font-black uppercase">Tier</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(selectedUser.id)} 
                                            className="flex-1 md:flex-none p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={18} />
                                            <span className="md:hidden text-[10px] font-black uppercase">Purge</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Credit Balance', val: selectedUser.profile?.credits || 0, unit: 'CR', icon: CreditCard, color: 'text-primary' },
                                        { label: 'Protocols', val: selectedUser.history?.length || 0, unit: 'OPS', icon: Activity, color: 'text-emerald-500' },
                                        { label: 'Current Mass', val: selectedUser.profile?.weight || 0, unit: 'KG', icon: TrendingUp, color: 'text-blue-500' },
                                    ].map((box, i) => (
                                        <div key={i} className="p-6 bg-black/40 rounded-3xl border border-white/5 flex flex-col items-center shadow-inner group hover:border-white/20 transition-all">
                                            <box.icon size={16} className={`${box.color} mb-3 opacity-40 group-hover:opacity-100 transition-opacity`} />
                                            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{box.label}</div>
                                            <div className="text-2xl font-black text-white">{box.val}<span className="text-[10px] ml-1 opacity-40">{box.unit}</span></div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6 text-left">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <MousePointer2 size={12} /> Override Directives
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {[100, 500].map(amt => (
                                            <button 
                                                key={amt}
                                                onClick={() => handleAddCredits(selectedUser, amt)} 
                                                className="group flex items-center justify-between p-5 bg-white/5 hover:bg-primary/10 border border-white/5 rounded-3xl transition-all"
                                            >
                                                <span className="text-[10px] font-black text-white uppercase">Inject +{amt}</span>
                                                <Plus size={16} className="text-primary group-hover:scale-125 transition-transform" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 text-left">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Identity Event Log</h4>
                                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {selectedUser.history?.slice().reverse().map((h, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 font-mono text-[9px] group/item hover:bg-white/[0.02] transition-colors">
                                                <span className="text-emerald-500 font-bold">{new Date(h.timestamp).toLocaleTimeString()}</span>
                                                <span className="text-white font-black uppercase tracking-widest">{h.type}</span>
                                                <span className="hidden md:inline text-slate-700 truncate max-w-[120px]">{JSON.stringify(h.payload)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-12 text-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 animate-pulse">
                                    <Search size={32} className="opacity-20" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Monitor Athletes</h3>
                                <p className="text-[10px] max-w-xs leading-relaxed opacity-60 uppercase tracking-wider">Select a profile from the directory to inspect synchronized biometric datasets.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'promos' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 animate-fade-in text-left">
                    {/* Deployment Form */}
                    <div className="bg-black/40 border border-white/10 rounded-[48px] p-8 md:p-12 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                            <Zap size={250} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-6 mb-10 md:mb-12">
                                <div className="p-4 bg-primary/20 rounded-[20px] text-primary border border-primary/20"><Tag size={28} /></div>
                                <div>
                                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">Market Provisioning</h3>
                                    <p className="text-[9px] font-bold text-slate-500 mt-2 tracking-widest uppercase opacity-60">Deploy global identifiers</p>
                                </div>
                            </div>

                            <div className="space-y-8 md:space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 block">Unique Identifier</label>
                                    <input 
                                        type="text" 
                                        value={newPromo.code}
                                        onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                                        placeholder="EX: CYBER2025" 
                                        className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 text-white font-black text-xl tracking-[0.1em] focus:border-primary/50 transition-all uppercase placeholder:opacity-5 outline-none shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 block">Asset Protocol</label>
                                        <select 
                                            value={newPromo.type}
                                            onChange={(e) => {
                                                const type = e.target.value as any;
                                                setNewPromo({...newPromo, type, magnitudeType: type === 'discount' ? 'percentage' : newPromo.magnitudeType });
                                            }}
                                            className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-5 text-white font-black text-[10px] uppercase tracking-widest outline-none focus:border-primary/50 appearance-none cursor-pointer"
                                        >
                                            <option value="credits">Credit Allocation</option>
                                            <option value="premium">Elite Tier Unlock</option>
                                            <option value="discount">Store Discount</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center ml-2 mr-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Magnitude</label>
                                            <div className="flex gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
                                                <button 
                                                    onClick={() => setNewPromo({...newPromo, magnitudeType: 'fixed'})}
                                                    className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${newPromo.magnitudeType === 'fixed' ? 'bg-primary text-white' : 'text-slate-500'}`}
                                                >FIXED</button>
                                                <button 
                                                    onClick={() => setNewPromo({...newPromo, magnitudeType: 'percentage'})}
                                                    className={`px-2 py-0.5 rounded text-[8px] font-black transition-all ${newPromo.magnitudeType === 'percentage' ? 'bg-primary text-white' : 'text-slate-500'}`}
                                                >PCT %</button>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={newPromo.value}
                                                disabled={newPromo.type === 'premium'}
                                                onChange={(e) => setNewPromo({...newPromo, value: parseInt(e.target.value) || 0})}
                                                className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-5 text-white font-black text-xl outline-none focus:border-primary/50 disabled:opacity-20"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-600">
                                                {newPromo.magnitudeType === 'percentage' ? '%' : 'CR'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 block">Usage Limit</label>
                                        <input 
                                            type="number" 
                                            value={newPromo.maxUses || ''}
                                            placeholder="UNLIMITED"
                                            onChange={(e) => setNewPromo({...newPromo, maxUses: parseInt(e.target.value) || undefined})}
                                            className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-5 text-white font-bold text-sm outline-none focus:border-primary/50 text-center"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2 block">Expiration</label>
                                        <input 
                                            type="date" 
                                            value={newPromo.expiryDate || ''}
                                            onChange={(e) => setNewPromo({...newPromo, expiryDate: e.target.value})}
                                            className="w-full bg-white/5 border border-white/10 rounded-[24px] px-6 py-5 text-white font-bold text-[10px] outline-none focus:border-primary/50 text-center"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAddPromo}
                                    className="w-full py-6 bg-primary text-white rounded-[32px] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl shadow-primary/40 hover:scale-[1.02] hover:bg-primaryDark transition-all active:scale-95"
                                >
                                    <Zap size={18} className="fill-white/20" /> Initialize Global Deployment
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Promo Registry */}
                    <div className="bg-black/40 border border-white/10 rounded-[48px] p-8 md:p-12 shadow-2xl backdrop-blur-3xl flex flex-col max-h-[600px] md:max-h-[800px]">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Active Registry</h3>
                            <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">{promos.length} ACTIVE</span>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-4">
                            {promos.map(p => (
                                <div key={p.code} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-[32px] bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all group gap-4">
                                    <div className="flex items-center gap-5">
                                        <div className="p-4 rounded-2xl bg-black/40 text-primary border border-white/5 shadow-inner"><Tag size={20} /></div>
                                        <div>
                                            <div className="text-lg font-black text-white tracking-tight leading-none mb-2">{p.code}</div>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${p.type === 'discount' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {p.type === 'premium' ? 'Elite Tier' : p.type === 'discount' ? `-${p.value}% Store Discount` : `+${p.value}${p.magnitudeType === 'percentage' ? '%' : ' CR'}`}
                                                </span>
                                                <span className="text-[8px] font-mono text-slate-500 uppercase bg-white/5 px-2 py-0.5 rounded">Used: {p.uses}/{p.maxUses || '∞'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemovePromo(p.code)}
                                        className="self-end md:self-center p-4 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                            {promos.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-24 text-slate-700 opacity-20">
                                    <Tag size={64} strokeWidth={1} className="mb-6" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">No Deployments Found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="bg-black/60 border border-white/5 rounded-[48px] p-6 md:p-12 backdrop-blur-3xl shadow-2xl h-[calc(100vh-200px)] flex flex-col animate-fade-in overflow-hidden text-left">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/10"><Server size={24} /></div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Core Diagnostics</h3>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-60">Global Audit Trail</p>
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/5">
                                <Download size={14} /> Export
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 border border-white/5 rounded-[32px] bg-black/40 overflow-hidden flex flex-col shadow-inner">
                        <div className="hidden md:grid grid-cols-6 p-6 border-b border-white/10 bg-white/[0.02] text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                            <div className="col-span-1">Timestamp</div>
                            <div className="col-span-1">Athlete</div>
                            <div className="col-span-1">Directive</div>
                            <div className="col-span-3 text-right">Payload Magnitude</div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {realUsers.flatMap(u => (u.history || []).map(h => ({ ...h, userId: u.id, userName: u.profile?.name }))).sort((a,b) => b.timestamp - a.timestamp).map((log, i) => (
                                <div key={i} className="flex flex-col md:grid md:grid-cols-6 p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.01] transition-all group font-mono text-[9px] gap-2 md:gap-0">
                                    <div className="col-span-1 text-slate-600">{new Date(log.timestamp).toLocaleString()}</div>
                                    <div className="col-span-1 text-primary font-bold">{log.userName?.slice(0,10) || (log.userId?.slice(0, 8) || 'N/A')}</div>
                                    <div className="col-span-1 flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${log.type.includes('GENERATE') ? 'bg-primary' : 'bg-emerald-500'}`}></span>
                                        <span className="text-white font-black">{log.type}</span>
                                    </div>
                                    <div className="col-span-3 text-slate-700 truncate group-hover:text-slate-300 transition-colors text-right">{JSON.stringify(log.payload)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
      </main>
    </div>
  );
};

export default FounderDashboard;
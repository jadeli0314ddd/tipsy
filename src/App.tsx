import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  Search, Plus, History, Home, Star, Pin, Trash2, X, Check,
  User, Settings, Mail, Info, LogOut, Download, RotateCcw,
  Beer, Wine as WineIcon, GlassWater, Flame, Zap, Camera, Image as ImageIcon,
  LogIn, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Drink, DrinkLog, DrinkCategory, UserProfile, Selfie } from './types';
import { DEFAULT_DRINKS, CATEGORIES } from './constants';

// --- Utils ---
const generateId = () => Math.random().toString(36).substring(2, 9);
const getSessionId = () => {
  const now = new Date();
  const sessionDate = new Date(now);
  if (now.getHours() < 6) sessionDate.setDate(now.getDate() - 1);
  return sessionDate.toISOString().split('T')[0];
};

const renderIcon = (icon: string) => {
  const mapping: Record<string, string> = {
    'Beer': '🍺', 'Cocktail': '🍸', 'Wine': '🍷', 
    'Spirit': '🥃', 'Shot': '🍶', 'Aperol': '🍹'
  };
  return mapping[icon] || icon;
};

// --- Components ---
const Toast = ({ message, onComplete }: { message: string; onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full flex items-center gap-2 border-neon-blue/20 shadow-lg text-stone-800"
    >
      <Zap className="w-4 h-4 text-neon-blue" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
};

const DrinkCard = ({ drink, onLog, onToggleFavorite, onTogglePin, onRemove }: { drink: Drink; onLog: (drink: Drink) => void; onToggleFavorite: (id: string, e: React.MouseEvent) => void; onTogglePin: (id: string, e: React.MouseEvent) => void; onRemove: (id: string, e: React.MouseEvent) => void }) => (
  <motion.div layout onClick={() => onLog(drink)} className={`glass rounded-[2rem] p-4 flex flex-col items-center text-center gap-3 active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden ${drink.is_pinned ? 'border-neon-blue/30' : ''}`}>
    {drink.is_pinned && <div className="absolute inset-0 bg-neon-blue/5 pointer-events-none" />}
    <div className="text-3xl w-14 h-14 flex items-center justify-center bg-stone-100 rounded-2xl group-active:scale-110 transition-transform">{renderIcon(drink.icon)}</div>
    <div className="flex-1 w-full">
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        <h3 className="font-semibold text-base leading-tight truncate text-stone-800">{drink.name}</h3>
        {drink.is_pinned && <Pin className="w-2.5 h-2.5 text-neon-blue fill-neon-blue shrink-0" />}
      </div>
      <p className="text-stone-400 text-[11px] font-medium">{drink.abv}% · {drink.volume_ml}ml</p>
    </div>
    <div className="flex items-center justify-center gap-1 w-full">
      <button onClick={(e) => onToggleFavorite(drink.id, e)} className={`p-1.5 rounded-full ${drink.is_favorite ? 'text-neon-pink' : 'text-stone-300'}`}><Star className={`w-4 h-4 ${drink.is_favorite ? 'fill-neon-pink' : ''}`} /></button>
      <button onClick={(e) => onTogglePin(drink.id, e)} className={`p-1.5 rounded-full ${drink.is_pinned ? 'text-neon-blue' : 'text-stone-300'}`}><Pin className={`w-4 h-4 ${drink.is_pinned ? 'fill-neon-blue' : ''}`} /></button>
      {drink.is_custom && <button onClick={(e) => onRemove(drink.id, e)} className="p-1.5 rounded-full text-stone-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
    </div>
  </motion.div>
);

export default function App() {
  // --- Auth & Profile ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  
  // --- Data States ---
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory>('All');
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'profile'>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDrunkPopup, setShowDrunkPopup] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tipsy_profile');
    return saved ? JSON.parse(saved) : { 
      username: 'Jade', email: 'jade@email.com', age: 20, weight_kg: 55, gender: 'female', 
      tolerance_type: 'auto', manual_tolerance: 'medium', enable_selfie_reminder: true 
    };
  });

  // 1. Auth 监听
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  // 2. 数据拉取 (云端优先)
  useEffect(() => {
    if (session) {
      const loadData = async () => {
        const { data: logData } = await supabase.from('drinks_log').select('*').order('created_at', { ascending: false });
        if (logData) setLogs(logData);
        const { data: selfieData } = await supabase.from('selfies').select('*');
        if (selfieData) setSelfies(selfieData);
        
        // 合并本地和默认酒水
        const savedDrinks = localStorage.getItem('tipsy_drinks');
        const parsed = savedDrinks ? JSON.parse(savedDrinks) : [];
        const merged = [...parsed];
        DEFAULT_DRINKS.forEach(d => { if(!merged.find(m => m.id === d.id)) merged.push(d); });
        setDrinks(merged);
      };
      loadData();
    }
  }, [session]);

  // 保存 Profile 到本地
  useEffect(() => { localStorage.setItem('tipsy_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { if(drinks.length > 0) localStorage.setItem('tipsy_drinks', JSON.stringify(drinks)); }, [drinks]);

  // --- Logic Functions ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMsg('Sending magic link...');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setLoginMsg(error ? `Error: ${error.message}` : '✅ Check your email!');
  };

  const handleLogout = () => supabase.auth.signOut();

  const logDrink = async (drink: Drink) => {
    if (!session) return;
    const { data, error } = await supabase.from('drinks_log').insert([{
      drink_id: drink.id, drink_name: drink.name, abv: drink.abv, volume: drink.volume_ml, session_id: getSessionId()
    }]).select();
    if (!error && data) {
      setLogs(prev => [data[0], ...prev]);
      setToasts(prev => [...prev, { id: generateId(), message: `+1 ${drink.name}` }]);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrinks(prev => prev.map(d => d.id === id ? { ...d, is_favorite: !d.is_favorite } : d));
  };

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrinks(prev => prev.map(d => d.id === id ? { ...d, is_pinned: !d.is_pinned } : d));
  };

  const removeDrink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this drink?')) setDrinks(prev => prev.filter(d => d.id !== id));
  };

  // --- BAC Calculation (完整复活版) ---
  const currentSessionId = getSessionId();
  const tonightLogs = useMemo(() => logs.filter(l => l.session_id === currentSessionId), [logs, currentSessionId]);
  
  const tonightStats = useMemo(() => {
    const totalAlcoholMl = tonightLogs.reduce((acc, log) => acc + ((log.volume * log.abv) / 100), 0);
    const alcoholGrams = totalAlcoholMl * 0.789;
    const r = userProfile.gender === 'male' ? 0.68 : 0.55;
    const weightGrams = userProfile.weight_kg * 1000;
    const firstDrinkTime = tonightLogs.length > 0 ? new Date(tonightLogs[tonightLogs.length-1].created_at || Date.now()).getTime() : Date.now();
    const hours = (Date.now() - firstDrinkTime) / (1000 * 60 * 60);
    
    let bac = (alcoholGrams / (weightGrams * r)) * 100;
    bac = Math.max(0, bac - (hours * 0.015));

    let t_tipsy = 0.04, t_drunk = 0.10, t_wasted = 0.20;
    if (userProfile.tolerance_type === 'manual') {
      if (userProfile.manual_tolerance === 'low') { t_tipsy = 0.03; t_drunk = 0.08; t_wasted = 0.15; }
      else if (userProfile.manual_tolerance === 'high') { t_tipsy = 0.08; t_drunk = 0.18; t_wasted = 0.32; }
    }
    
    return { 
      count: tonightLogs.length, alcoholMl: totalAlcoholMl.toFixed(1), bac: bac.toFixed(3), 
      status: bac > t_wasted ? 'Wasted' : bac > t_drunk ? 'Drunk' : bac > t_tipsy ? 'Tipsy' : 'Sober',
      t_tipsy, t_drunk, t_wasted
    };
  }, [tonightLogs, userProfile]);

  const filteredDrinks = useMemo(() => {
    let result = drinks;
    if (selectedCategory !== 'All') result = selectedCategory === 'My Drinks' ? result.filter(d => d.is_custom) : result.filter(d => d.category === selectedCategory);
    if (searchQuery) result = result.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort((a, b) => (a.is_pinned && !b.is_pinned ? -1 : !a.is_pinned && b.is_pinned ? 1 : a.is_favorite && !b.is_favorite ? -1 : !a.is_favorite && b.is_favorite ? 1 : 0));
  }, [drinks, selectedCategory, searchQuery]);

  // --- Rendering ---
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-neon-blue" /></div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-sm p-8 rounded-[2.5rem] text-center">
          <div className="text-5xl mb-6">🍸</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">TIPSY</h1>
          <p className="text-stone-400 mb-8 text-sm">Sign in to save your history</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="jade@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full glass rounded-2xl p-4 outline-none" />
            <button type="submit" className="w-full bg-neon-blue text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg"><LogIn className="w-5 h-5" /> Get Magic Link</button>
          </form>
          {loginMsg && <p className="mt-4 text-xs font-medium text-neon-pink">{loginMsg}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 px-4 pt-6 max-w-md mx-auto relative overflow-x-hidden bg-stone-50 text-stone-800">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">TIPSY<span className="text-neon-pink">🍸</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('profile')} className={`w-10 h-10 rounded-full glass flex items-center justify-center ${activeTab === 'profile' ? 'text-neon-blue' : 'text-stone-400'}`}><User className="w-5 h-5" /></button>
          <button onClick={() => setShowAddModal(true)} className="w-10 h-10 rounded-full glass flex items-center justify-center text-neon-blue"><Plus className="w-6 h-6" /></button>
        </div>
      </header>

      {/* Search & Tabs */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input type="text" placeholder="Search drinks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full glass rounded-3xl py-3.5 pl-12 pr-4 outline-none shadow-sm" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">{CATEGORIES.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-neon-blue text-white shadow-md' : 'glass text-stone-500'}`}>{cat}</button>))}</div>

      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-2 gap-3">
            {filteredDrinks.map(drink => (<DrinkCard key={drink.id} drink={drink} onLog={logDrink} onToggleFavorite={toggleFavorite} onTogglePin={togglePin} onRemove={removeDrink} />))}
          </motion.div>
        ) : activeTab === 'timeline' ? (
          <motion.div key="timeline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><History className="text-neon-blue" /> Night Diary</h2>
            {tonightLogs.map(log => (
              <div key={log.id} className="glass p-4 rounded-2xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{renderIcon(drinks.find(d => d.id === log.drink_id)?.icon || '🍹')}</span>
                  <span className="font-medium">{log.drink_name}</span>
                </div>
                <span className="text-stone-400 text-xs font-mono">{new Date(log.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="profile" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="glass rounded-[2.5rem] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue"><User className="w-8 h-8" /></div>
                <div><h2 className="text-xl font-bold">Settings</h2><p className="text-stone-400 text-sm">{session.user.email}</p></div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Age</label>
                  <input type="number" value={userProfile.age} onChange={e => setUserProfile(p => ({...p, age: +e.target.value}))} className="w-full glass rounded-2xl p-4 outline-none" /></div>
                  <div><label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Weight (kg)</label>
                  <input type="number" value={userProfile.weight_kg} onChange={e => setUserProfile(p => ({...p, weight_kg: +e.target.value}))} className="w-full glass rounded-2xl p-4 outline-none" /></div>
                </div>
                <div><label className="text-[10px] font-bold text-stone-400 uppercase ml-1">Gender</label>
                <div className="flex gap-2">{(['male', 'female'] as const).map(g => (<button key={g} onClick={() => setUserProfile(p => ({...p, gender: g}))} className={`flex-1 py-3 rounded-2xl font-bold capitalize ${userProfile.gender === g ? 'bg-neon-blue text-white shadow-md' : 'glass text-stone-400'}`}>{g}</button>))}</div></div>
              </div>
            </div>
            
            <div className="glass rounded-[2.5rem] p-6">
               <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Flame className="text-neon-orange" /> Tolerance</h3>
               <div className="flex gap-2 mb-4">
                 <button onClick={() => setUserProfile(p => ({...p, tolerance_type: 'auto'}))} className={`flex-1 py-3 rounded-2xl text-xs font-bold ${userProfile.tolerance_type === 'auto' ? 'bg-neon-blue text-white' : 'glass text-stone-400'}`}>Auto</button>
                 <button onClick={() => setUserProfile(p => ({...p, tolerance_type: 'manual'}))} className={`flex-1 py-3 rounded-2xl text-xs font-bold ${userProfile.tolerance_type === 'manual' ? 'bg-neon-blue text-white' : 'glass text-stone-400'}`}>Manual</button>
               </div>
               {userProfile.tolerance_type === 'manual' && <div className="flex gap-2">{(['low', 'medium', 'high'] as const).map(t => (<button key={t} onClick={() => setUserProfile(p => ({...p, manual_tolerance: t}))} className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase ${userProfile.manual_tolerance === t ? 'bg-stone-800 text-white' : 'glass text-stone-400'}`}>{t}</button>))}</div>}
            </div>

            <button onClick={handleLogout} className="w-full p-4 glass rounded-2xl text-red-500 font-bold flex items-center justify-center gap-2"><LogOut className="w-5 h-5" /> Sign Out</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary & Nav (复刻完整版) */}
      <div className="fixed bottom-6 left-6 right-6 p-4 glass rounded-[2.5rem] border border-stone-200 z-40 shadow-2xl max-w-md mx-auto">
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <div className="text-center"><p className="text-lg font-bold leading-none">{tonightStats.count}</p><p className="text-[8px] text-stone-400 font-bold uppercase">Drinks</p></div>
            <div className="text-center"><p className="text-lg font-bold leading-none text-neon-blue">{tonightStats.bac}</p><p className="text-[8px] text-stone-400 font-bold uppercase">BAC</p></div>
          </div>
          <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tonightStats.status === 'Sober' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-pink/10 text-neon-pink'}`}>{tonightStats.status}</p>
        </div>
        
        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden mb-4 relative">
          <div className="absolute top-0 bottom-0 w-px bg-stone-300 z-10" style={{ left: `${(tonightStats.t_tipsy / (tonightStats.t_wasted * 1.2)) * 100}%` }} />
          <div className="h-full bg-neon-blue transition-all duration-1000" style={{ width: `${Math.min(100, (parseFloat(tonightStats.bac) / (tonightStats.t_wasted * 1.2)) * 100)}%` }} />
        </div>

        <div className="flex justify-around items-center pt-2">
          <button onClick={() => setActiveTab('home')} className={`flex items-center gap-2 transition-colors ${activeTab === 'home' ? 'text-neon-blue' : 'text-stone-300'}`}><Home className="w-5 h-5" /><span className="text-[10px] font-bold uppercase">Home</span></button>
          <button onClick={() => setActiveTab('timeline')} className={`flex items-center gap-2 transition-colors ${activeTab === 'timeline' ? 'text-neon-blue' : 'text-stone-300'}`}><History className="w-5 h-5" /><span className="text-[10px] font-bold uppercase">Diary</span></button>
        </div>
      </div>

      <AnimatePresence>{toasts.map(t => <Toast key={t.id} message={t.message} onComplete={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}</AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="glass w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 relative shadow-2xl">
              <button onClick={() => setShowAddModal(false)} className="absolute right-6 top-6 w-10 h-10 rounded-full glass flex items-center justify-center text-stone-400"><X /></button>
              <h2 className="text-2xl font-bold mb-6">New Drink</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const newDrink: Drink = {
                  id: generateId(), name: fd.get('name') as string, abv: +fd.get('abv')!, volume_ml: +fd.get('volume')!, 
                  alcohol_ml: (+fd.get('volume')! * +fd.get('abv')!) / 100, category: fd.get('category') as any, 
                  icon: (fd.get('icon') as string) || '🍹', is_favorite: false, is_pinned: false, is_custom: true,
                };
                setDrinks(p => [...p, newDrink]); setShowAddModal(false);
              }} className="space-y-4">
                <input name="name" placeholder="Drink Name" required className="w-full glass rounded-2xl p-4 outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="abv" type="number" step="0.1" placeholder="ABV %" required className="w-full glass rounded-2xl p-4 outline-none" />
                  <input name="volume" type="number" placeholder="Volume ml" required className="w-full glass rounded-2xl p-4 outline-none" />
                </div>
                <select name="category" className="w-full glass rounded-2xl p-4 outline-none">{CATEGORIES.filter(c=>c!=='All' && c!=='My Drinks').map(c=>(<option key={c} value={c}>{c}</option>))}</select>
                <input name="icon" placeholder="Emoji Icon (Optional)" className="w-full glass rounded-2xl p-4 outline-none" />
                <button type="submit" className="w-full bg-neon-blue text-white font-bold py-4 rounded-2xl shadow-lg">Create</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

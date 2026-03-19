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
      <button onClick={(e) => onToggleFavorite(drink.id, e)} className={`p-1.5 rounded-full transition-colors ${drink.is_favorite ? 'text-neon-pink' : 'text-stone-300 hover:text-stone-500'}`}><Star className={`w-4 h-4 ${drink.is_favorite ? 'fill-neon-pink' : ''}`} /></button>
      <button onClick={(e) => onTogglePin(drink.id, e)} className={`p-1.5 rounded-full transition-colors ${drink.is_pinned ? 'text-neon-blue' : 'text-stone-300 hover:text-stone-500'}`}><Pin className={`w-4 h-4 ${drink.is_pinned ? 'fill-neon-blue' : ''}`} /></button>
      {drink.is_custom && <button onClick={(e) => onRemove(drink.id, e)} className="p-1.5 rounded-full text-stone-300 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
    </div>
  </motion.div>
);

export default function App() {
  // --- Auth & Data State ---
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory>('All');
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'profile'>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDrunkPopup, setShowDrunkPopup] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    username: 'Jade', email: 'jade@email.com', age: 20, weight_kg: 55, gender: 'female', tolerance_type: 'auto', manual_tolerance: 'medium', enable_selfie_reminder: true
  });

  // 1. Auth 监听
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. 数据拉取与本地混合
  useEffect(() => {
    if (session) {
      const loadData = async () => {
        const { data: logData } = await supabase.from('drinks_log').select('*').order('created_at', { ascending: false });
        if (logData) setLogs(logData);
        const { data: selfieData } = await supabase.from('selfies').select('*');
        if (selfieData) setSelfies(selfieData);
        
        const savedDrinks = localStorage.getItem('tipsy_drinks');
        if (savedDrinks) {
          const parsed = JSON.parse(savedDrinks);
          setDrinks([...parsed, ...DEFAULT_DRINKS.filter(d => !parsed.find((p:any) => p.id === d.id))]);
        } else {
          setDrinks(DEFAULT_DRINKS);
        }
      };
      loadData();
    }
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMsg('Sending link...');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) setLoginMsg(error.message);
    else setLoginMsg('Check your email!');
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

  // --- BAC 计算逻辑 (保留原样) ---
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
    return { count: tonightLogs.length, alcoholMl: totalAlcoholMl.toFixed(1), bac: bac.toFixed(3), status: bac > 0.15 ? 'Wasted' : bac > 0.08 ? 'Drunk' : bac > 0.03 ? 'Tipsy' : 'Sober' };
  }, [tonightLogs, userProfile]);

  const filteredDrinks = useMemo(() => {
    let result = drinks;
    if (selectedCategory !== 'All') result = selectedCategory === 'My Drinks' ? result.filter(d => d.is_custom) : result.filter(d => d.category === selectedCategory);
    if (searchQuery) result = result.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort((a, b) => (a.is_pinned ? -1 : b.is_pinned ? 1 : a.is_favorite ? -1 : b.is_favorite ? 1 : 0));
  }, [drinks, selectedCategory, searchQuery]);

  // --- 渲染逻辑 ---
  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="animate-spin text-neon-blue" /></div>;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-sm p-8 rounded-[2.5rem] text-center">
          <div className="text-5xl mb-6">🍸</div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">TIPSY</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full glass rounded-2xl p-4 outline-none" />
            <button type="submit" className="w-full bg-neon-blue text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"><LogIn className="w-5 h-5" /> Login</button>
          </form>
          {loginMsg && <p className="mt-4 text-xs text-neon-pink">{loginMsg}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 px-4 pt-6 max-w-md mx-auto relative overflow-x-hidden bg-stone-50">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-stone-800">TIPSY<span className="text-neon-pink">🍸</span></h1>
        <div className="flex gap-2">
          <button onClick={handleLogout} className="w-10 h-10 rounded-full glass flex items-center justify-center text-stone-400"><LogOut className="w-5 h-5" /></button>
          <button onClick={() => setShowAddModal(true)} className="w-10 h-10 rounded-full glass flex items-center justify-center text-neon-blue"><Plus className="w-6 h-6" /></button>
        </div>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full glass rounded-3xl py-3.5 pl-12 pr-4 outline-none" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">{CATEGORIES.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium ${selectedCategory === cat ? 'bg-neon-blue text-white' : 'glass text-stone-500'}`}>{cat}</button>))}</div>

      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
            {filteredDrinks.map(drink => (<DrinkCard key={drink.id} drink={drink} onLog={logDrink} onToggleFavorite={()=>{}} onTogglePin={()=>{}} onRemove={()=>{}} />))}
          </motion.div>
        ) : (
          <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {tonightLogs.map(log => (
              <div key={log.id} className="glass p-4 rounded-2xl flex justify-between items-center">
                <span className="text-stone-700 font-medium">{log.drink_name}</span>
                <span className="text-stone-400 text-xs">{new Date(log.created_at || '').toLocaleTimeString()}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 left-6 right-6 p-4 glass rounded-[2rem] border border-stone-200 z-40 shadow-xl max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4">
            <div className="text-center"><p className="text-lg font-bold text-stone-800">{tonightStats.count}</p><p className="text-[8px] text-stone-400 font-bold uppercase">Drinks</p></div>
            <div className="text-center"><p className="text-lg font-bold text-neon-blue">{tonightStats.bac}</p><p className="text-[8px] text-stone-400 font-bold uppercase">BAC</p></div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-neon-green/10 text-neon-green">{tonightStats.status}</span>
        </div>
        <div className="flex justify-around border-t pt-3">
          <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-neon-blue' : 'text-stone-300'}><Home /></button>
          <button onClick={() => setActiveTab('timeline')} className={activeTab === 'timeline' ? 'text-neon-blue' : 'text-stone-300'}><History /></button>
        </div>
      </div>

      <AnimatePresence>{toasts.map(t => <Toast key={t.id} message={t.message} onComplete={() => setToasts(p => p.filter(x => x.id !== t.id))} />)}</AnimatePresence>
    </div>
  );
}

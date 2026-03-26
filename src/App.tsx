import React, { useState, useEffect, useMemo, useRef } from 'react';
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

const Toast = ({ message, onComplete }: { message: string; onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full flex items-center gap-2 shadow-lg text-stone-800"
    >
      <Zap className="w-4 h-4 text-neon-blue" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
};

const DrinkCard = ({ drink, onLog, onToggleFavorite, onTogglePin, onRemove }: { drink: Drink; onLog: (drink: Drink) => void; onToggleFavorite: (id: string, e: React.MouseEvent) => void; onTogglePin: (id: string, e: React.MouseEvent) => void; onRemove: (id: string, e: React.MouseEvent) => void }) => (
  <motion.div layout className={`glass rounded-[2rem] p-4 flex flex-col items-center text-center gap-3 transition-all relative overflow-hidden ${drink.is_pinned ? 'border-neon-blue/30' : ''}`}>
    {drink.is_pinned && <div className="absolute inset-0 bg-neon-blue/5 pointer-events-none" />}
    <div onClick={() => onLog(drink)} className="w-full flex flex-col items-center gap-3 cursor-pointer active:scale-[0.97] transition-transform">
      <div className="text-3xl w-14 h-14 flex items-center justify-center bg-stone-100 rounded-2xl">{renderIcon(drink.icon)}</div>
      <div className="flex-1 w-full">
        <div className="flex items-center justify-center gap-1.5 mb-0.5">
          <h3 className="font-semibold text-base leading-tight truncate text-stone-800">{drink.name}</h3>
          {drink.is_pinned && <Pin className="w-2.5 h-2.5 text-neon-blue fill-neon-blue shrink-0" />}
        </div>
        <p className="text-stone-400 text-[11px] font-medium">{drink.abv}% · {drink.volume_ml}ml</p>
      </div>
    </div>
    <div className="flex items-center justify-center gap-1 w-full">
      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(drink.id, e); }} className={`p-1.5 rounded-full ${drink.is_favorite ? 'text-neon-pink' : 'text-stone-300'}`}><Star className={`w-4 h-4 ${drink.is_favorite ? 'fill-neon-pink' : ''}`} /></button>
      <button onClick={(e) => { e.stopPropagation(); onTogglePin(drink.id, e); }} className={`p-1.5 rounded-full ${drink.is_pinned ? 'text-neon-blue' : 'text-stone-300'}`}><Pin className={`w-4 h-4 ${drink.is_pinned ? 'fill-neon-blue' : ''}`} /></button>
      {drink.is_custom && <button onClick={(e) => { e.stopPropagation(); onRemove(drink.id, e); }} className="p-1.5 rounded-full text-stone-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>}
    </div>
  </motion.div>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMsg, setLoginMsg] = useState<{text: string; type: 'error' | 'success'} | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory>('All');
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'profile'>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => localStorage.getItem('tipsy_avatar') || '🙂');
  const [showSelfieModal, setShowSelfieModal] = useState(false);
  const [selfieCapturing, setSelfieCapturing] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieUploading, setSelfieUploading] = useState(false);
  const wasWastedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const AVATAR_OPTIONS = ['🙂','😎','🥳','🍸','🍹','🥂','🍺','🦊','🐱','🐸','🦋','🌙','⭐','🔥','💫','🌈','🎉','👑'];

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('tipsy_profile');
    return saved ? JSON.parse(saved) : { 
      username: 'notdrunk', email: '', age: 20, weight_kg: 55, gender: 'female', 
      tolerance_type: 'auto', manual_tolerance: 'medium', enable_selfie_reminder: true 
    };
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      const loadData = async () => {
        const { data: logData } = await supabase.from('drinks_log').select('*').order('created_at', { ascending: false });
        if (logData) setLogs(logData);
        const { data: selfieData } = await supabase.from('selfies').select('*');
        if (selfieData) setSelfies(selfieData);
        const savedDrinks = localStorage.getItem('tipsy_drinks');
        const parsed = savedDrinks ? JSON.parse(savedDrinks) : [];
        const merged = [...parsed];
        DEFAULT_DRINKS.forEach(d => { if(!merged.find((m: Drink) => m.id === d.id)) merged.push(d); });
        setDrinks(merged);
      };
      loadData();
    }
  }, [session]);

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

  useEffect(() => { localStorage.setItem('tipsy_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { if(drinks.length > 0) localStorage.setItem('tipsy_drinks', JSON.stringify(drinks)); }, [drinks]);
  useEffect(() => { localStorage.setItem('tipsy_avatar', avatarEmoji); }, [avatarEmoji]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSubmitting(true);
    setLoginMsg(null);
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setLoginMsg({ text: error.message, type: 'error' });
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setLoginMsg({ text: error.message, type: 'error' });
      else setLoginMsg({ text: '✅ Account created! You can now sign in.', type: 'success' });
    }
    setAuthSubmitting(false);
  };

  const handleLogout = () => supabase.auth.signOut();

  const logDrink = async (drink: Drink) => {
    if (!session) return;
    const tempId = generateId();
    const optimisticLog = {
      id: tempId,
      _isPending: true,
      drink_id: drink.id, drink_name: drink.name, abv: drink.abv, volume: drink.volume_ml,
      session_id: getSessionId(), created_at: new Date().toISOString()
    } as any;
    setLogs(prev => [optimisticLog, ...prev]);
    setToasts(prev => [...prev, { id: generateId(), message: `+1 ${drink.name}` }]);
    const { data, error } = await supabase.from('drinks_log').insert([{
      drink_id: drink.id, drink_name: drink.name, abv: drink.abv, volume: drink.volume_ml, session_id: getSessionId()
    }]).select();
    if (!error && data) {
      setLogs(prev => prev.map(l => l.id === tempId ? data[0] : l));
    } else {
      setLogs(prev => prev.filter(l => l.id !== tempId));
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

  const deleteLog = async (logId: string) => {
    setLogs(prev => prev.filter(l => l.id !== logId));
    const { error } = await supabase.from('drinks_log').delete().eq('id', logId);
    if (error) {
      const { data } = await supabase.from('drinks_log').select('*').order('created_at', { ascending: false });
      if (data) setLogs(data);
    }
  };

  useEffect(() => {
    if (tonightStats.status === 'Wasted' && !wasWastedRef.current) {
      wasWastedRef.current = true;
      setTimeout(() => setShowSelfieModal(true), 800);
    }
    if (tonightStats.status !== 'Wasted') wasWastedRef.current = false;
  }, [tonightStats.status]);

  const startCamera = async () => {
    setSelfieCapturing(true);
    setSelfiePreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setSelfieCapturing(false);
    }
  };

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setSelfiePreview(dataUrl);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setSelfieCapturing(false);
  };

  const saveSelfie = async () => {
    if (!selfiePreview || !session) return;
    setSelfieUploading(true);
    const { data, error } = await supabase.from('selfies').insert([{
      image_url: selfiePreview, session_id: currentSessionId
    }]).select();
    if (!error && data) {
      setSelfies(prev => [data[0], ...prev]);
      setToasts(prev => [...prev, { id: generateId(), message: '📸 Selfie saved!' }]);
    }
    setSelfieUploading(false);
    setSelfiePreview(null);
    setShowSelfieModal(false);
  };

  const closeSelfieModal = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setSelfieCapturing(false);
    setSelfiePreview(null);
    setShowSelfieModal(false);
  };

  const filteredDrinks = useMemo(() => {
    let result = drinks;
    if (selectedCategory !== 'All') result = selectedCategory === 'My Drinks' ? result.filter(d => d.is_custom) : result.filter(d => d.category === selectedCategory);
    if (searchQuery) result = result.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return [...result].sort((a, b) => (a.is_pinned && !b.is_pinned ? -1 : !a.is_pinned && b.is_pinned ? 1 : a.is_favorite && !b.is_favorite ? -1 : !a.is_favorite && b.is_favorite ? 1 : 0));
  }, [drinks, selectedCategory, searchQuery]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#fdf8ee' }}><Loader2 className="animate-spin" style={{ color: '#e87c3a' }} /></div>;

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col justify-end p-6 relative overflow-hidden" style={{ background: '#fdf8ee' }}>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-80px] right-[-60px] w-72 h-72 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #fde68a 0%, transparent 70%)' }} />
          <div className="absolute top-[15%] left-[-80px] w-56 h-56 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #fca5a5 0%, transparent 70%)' }} />
          <div className="absolute top-[30%] right-[-40px] w-40 h-40 rounded-full opacity-25" style={{ background: 'radial-gradient(circle, #6ee7b7 0%, transparent 70%)' }} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center pb-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-2">
            <div className="text-7xl mb-4 drop-shadow-sm">🍸</div>
            <h1 className="text-5xl font-black tracking-tight text-stone-900 mb-1">TIPSY</h1>
            <p className="text-stone-400 text-sm font-medium tracking-widest uppercase">Your Night Out Diary</p>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }} className="relative z-10 w-full max-w-sm mx-auto">
          <div className="flex glass rounded-2xl p-1 mb-5">
            <button onClick={() => { setAuthMode('login'); setLoginMsg(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={authMode === 'login' ? { background: '#e87c3a', color: 'white' } : { color: '#a8a29e' }}>Sign In</button>
            <button onClick={() => { setAuthMode('signup'); setLoginMsg(null); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all" style={authMode === 'signup' ? { background: '#e87c3a', color: 'white' } : { color: '#a8a29e' }}>Create Account</button>
          </div>
          <div className="glass rounded-[2rem] p-6 shadow-lg">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-11 pr-4 outline-none text-sm placeholder-stone-300 transition-colors" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300 text-sm">🔒</span>
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-11 pr-4 outline-none text-sm placeholder-stone-300 transition-colors" />
              </div>
              <AnimatePresence>
                {loginMsg && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`text-xs font-medium px-1 ${loginMsg.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {loginMsg.text}
                  </motion.p>
                )}
              </AnimatePresence>
              <button type="submit" disabled={authSubmitting} className="w-full text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-60 mt-1" style={{ background: '#e87c3a' }}>
                {authSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : authMode === 'login' ? <><LogIn className="w-4 h-4" /> Sign In</> : <><span>🎉</span> Create Account</>}
              </button>
            </form>
          </div>
          <p className="text-center text-[11px] text-stone-300 mt-5 mb-2">By continuing you agree to our Terms & Privacy Policy</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40 px-4 pt-6 max-w-md mx-auto relative overflow-x-hidden text-stone-800" style={{ background: '#fdf8ee' }}>
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">TIPSY<span className="text-neon-pink">🍸</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('profile')} className={`w-10 h-10 rounded-full glass flex items-center justify-center ${activeTab === 'profile' ? 'text-neon-blue' : 'text-stone-400'}`}><User className="w-5 h-5" /></button>
          <button onClick={() => setShowAddModal(true)} className="w-10 h-10 rounded-full glass flex items-center justify-center text-neon-blue"><Plus className="w-6 h-6" /></button>
        </div>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input type="text" placeholder="Search drinks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full glass rounded-3xl py-3.5 pl-12 pr-4 outline-none shadow-sm" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8">
        {CATEGORIES.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat ? 'bg-neon-blue text-white shadow-md' : 'glass text-stone-500'}`}>{cat}</button>))}
      </div>

      <AnimatePresence mode​​​​​​​​​​​​​​​​

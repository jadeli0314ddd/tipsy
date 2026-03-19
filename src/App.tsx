import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  Search, 
  Plus, 
  History, 
  Home, 
  Star, 
  Pin, 
  Trash2, 
  X, 
  Check,
  User,
  Settings,
  Mail,
  Info,
  LogOut,
  Download,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  Beer,
  Wine as WineIcon,
  GlassWater,
  Flame,
  Zap,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Drink, DrinkLog, DrinkCategory, UserProfile, Selfie } from './types';
import { DEFAULT_DRINKS, CATEGORIES } from './constants';

// --- Utils ---
const generateId = () => Math.random().toString(36).substring(2, 9);

const getSessionId = () => {
  const now = new Date();
  // Session resets at 6 AM
  const sessionDate = new Date(now);
  if (now.getHours() < 6) {
    sessionDate.setDate(now.getDate() - 1);
  }
  return sessionDate.toISOString().split('T')[0];
};

const renderIcon = (icon: string) => {
  const mapping: Record<string, string> = {
    'Beer': '🍺',
    'Cocktail': '🍸',
    'Wine': '🍷',
    'Spirit': '🥃',
    'Shot': '🍶',
    'Aperol': '🍹'
  };
  return mapping[icon] || icon;
};

// --- Components ---

interface ToastProps {
  message: string;
  onComplete: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 glass px-6 py-3 rounded-full flex items-center gap-2 border-neon-blue/20 shadow-lg text-stone-800"
    >
      <Zap className="w-4 h-4 text-neon-blue" />
      <span className="text-sm font-medium">{message}</span>
    </motion.div>
  );
};

interface DrinkCardProps {
  drink: Drink;
  onLog: (drink: Drink) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onRemove: (id: string, e: React.MouseEvent) => void;
}

const DrinkCard: React.FC<DrinkCardProps> = ({ drink, onLog, onToggleFavorite, onTogglePin, onRemove }) => (
  <motion.div
    layout
    onClick={() => onLog(drink)}
    className={`glass rounded-[2rem] p-4 flex flex-col items-center text-center gap-3 active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden ${drink.is_pinned ? 'border-neon-blue/30' : ''}`}
  >
    {drink.is_pinned && (
      <div className="absolute inset-0 bg-neon-blue/5 pointer-events-none" />
    )}
    
    <div className="text-3xl w-14 h-14 flex items-center justify-center bg-stone-100 rounded-2xl group-active:scale-110 transition-transform">
      {renderIcon(drink.icon)}
    </div>
    
    <div className="flex-1 w-full">
      <div className="flex items-center justify-center gap-1.5 mb-0.5">
        <h3 className="font-semibold text-base leading-tight truncate text-stone-800">{drink.name}</h3>
        {drink.is_pinned && <Pin className="w-2.5 h-2.5 text-neon-blue fill-neon-blue shrink-0" />}
      </div>
      <p className="text-stone-400 text-[11px] font-medium">
        {drink.abv}% · {drink.volume_ml}ml
      </p>
    </div>

    <div className="flex items-center justify-center gap-1 w-full">
      <button 
        onClick={(e) => onToggleFavorite(drink.id, e)}
        className={`p-1.5 rounded-full transition-colors ${drink.is_favorite ? 'text-neon-pink' : 'text-stone-300 hover:text-stone-500'}`}
      >
        <Star className={`w-4 h-4 ${drink.is_favorite ? 'fill-neon-pink' : ''}`} />
      </button>
      <button 
        onClick={(e) => onTogglePin(drink.id, e)}
        className={`p-1.5 rounded-full transition-colors ${drink.is_pinned ? 'text-neon-blue' : 'text-stone-300 hover:text-stone-500'}`}
      >
        <Pin className={`w-4 h-4 ${drink.is_pinned ? 'fill-neon-blue' : ''}`} />
      </button>
      {drink.is_custom && (
        <button 
          onClick={(e) => onRemove(drink.id, e)}
          className="p-1.5 rounded-full text-stone-300 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  </motion.div>
);

export default function App() {
  // --- State ---
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory>('All');
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'profile'>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDrunkPopup, setShowDrunkPopup] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  
  // User profile for BAC calculation
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    username: 'Jade',
    email: 'jade@email.com',
    age: 20,
    weight_kg: 55, 
    gender: 'female',
    tolerance_type: 'auto',
    manual_tolerance: 'medium',
    enable_selfie_reminder: true
  });

  // --- Persistence ---
  useEffect(() => {
    const savedDrinks = localStorage.getItem('tipsy_drinks');
    const savedLogs = localStorage.getItem('tipsy_logs');
    const savedSelfies = localStorage.getItem('tipsy_selfies');
    const savedProfile = localStorage.getItem('tipsy_profile');
    
    if (savedDrinks) {
      const parsedDrinks: Drink[] = JSON.parse(savedDrinks);
      // Merge: keep saved state for existing drinks, add new ones from DEFAULT_DRINKS
      const mergedDrinks = [...parsedDrinks];
      DEFAULT_DRINKS.forEach(defaultDrink => {
        if (!mergedDrinks.find(d => d.id === defaultDrink.id)) {
          mergedDrinks.push(defaultDrink);
        }
      });
      setDrinks(mergedDrinks);
    } else {
      setDrinks(DEFAULT_DRINKS);
    }

    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
    
    if (savedLogs) {
      const parsedLogs: DrinkLog[] = JSON.parse(savedLogs);
      // Check for 6 hour inactivity
      if (parsedLogs.length > 0) {
        const lastLogTime = Math.max(...parsedLogs.map(l => l.timestamp));
        const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
        if (lastLogTime < sixHoursAgo) {
          // Clear logs if inactive for 6 hours
          setLogs([]);
          localStorage.removeItem('tipsy_logs');
        } else {
          setLogs(parsedLogs);
        }
      }
    }

    if (savedSelfies) {
      setSelfies(JSON.parse(savedSelfies));
    }
  }, []);

  useEffect(() => {
    if (drinks.length > 0) {
      localStorage.setItem('tipsy_drinks', JSON.stringify(drinks));
    }
  }, [drinks]);

  useEffect(() => {
    localStorage.setItem('tipsy_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('tipsy_selfies', JSON.stringify(selfies));
  }, [selfies]);

  useEffect(() => {
    localStorage.setItem('tipsy_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // --- Logic ---
  const currentSessionId = getSessionId();
  const tonightLogs = useMemo(() => {
    const sessionLogs = logs.filter(log => log.session_id === currentSessionId);
    if (sessionLogs.length === 0) return [];
    
    const lastLogTime = Math.max(...sessionLogs.map(l => l.timestamp));
    const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);
    
    if (lastLogTime < sixHoursAgo) {
      return [];
    }
    
    return sessionLogs;
  }, [logs, currentSessionId]);

  const tonightStats = useMemo(() => {
    const totalAlcoholMl = tonightLogs.reduce((acc, log) => {
      const drink = drinks.find(d => d.id === log.drink_id);
      return acc + (drink?.alcohol_ml || 0);
    }, 0);

    // Simplified Widmark Formula for BAC
    // BAC = [Alcohol consumed in grams / (Body weight in grams * r)] * 100
    // r is 0.68 for men, 0.55 for women
    // Alcohol density is ~0.789 g/ml
    const alcoholGrams = totalAlcoholMl * 0.789;
    const r = userProfile.gender === 'male' ? 0.68 : 0.55;
    const weightGrams = userProfile.weight_kg * 1000;
    
    // Metabolism: ~0.015% per hour
    // Find first drink time
    const firstDrinkTime = tonightLogs.length > 0 ? Math.min(...tonightLogs.map(l => l.timestamp)) : Date.now();
    const hoursSinceFirstDrink = (Date.now() - firstDrinkTime) / (1000 * 60 * 60);
    
    let bac = (alcoholGrams / (weightGrams * r)) * 100;
    bac = Math.max(0, bac - (hoursSinceFirstDrink * 0.015));

    // Tolerance thresholds (Adjusted to be more realistic)
    let tipsyThreshold = 0.04;
    let drunkThreshold = 0.10;
    let wastedThreshold = 0.20;

    if (userProfile.tolerance_type === 'manual') {
      if (userProfile.manual_tolerance === 'low') {
        tipsyThreshold = 0.03;
        drunkThreshold = 0.08;
        wastedThreshold = 0.15;
      } else if (userProfile.manual_tolerance === 'high') {
        tipsyThreshold = 0.08;
        drunkThreshold = 0.18;
        wastedThreshold = 0.32;
      } else { // medium
        tipsyThreshold = 0.05;
        drunkThreshold = 0.12;
        wastedThreshold = 0.22;
      }
    } else {
      // Auto estimate based on age and weight
      const ageFactor = Math.max(0.8, Math.min(1.2, userProfile.age / 25));
      const weightFactor = Math.max(0.8, Math.min(1.2, userProfile.weight_kg / 70));
      tipsyThreshold *= (ageFactor * weightFactor);
      drunkThreshold *= (ageFactor * weightFactor);
      wastedThreshold *= (ageFactor * weightFactor);
    }

    let status: 'Sober' | 'Tipsy' | 'Drunk' | 'Wasted' = 'Sober';
    if (bac > wastedThreshold) status = 'Wasted';
    else if (bac > drunkThreshold) status = 'Drunk';
    else if (bac > tipsyThreshold) status = 'Tipsy';

    return {
      count: tonightLogs.length,
      alcoholMl: totalAlcoholMl.toFixed(1),
      bac: bac.toFixed(3),
      status,
      tipsyThreshold,
      drunkThreshold,
      wastedThreshold
    };
  }, [tonightLogs, drinks, userProfile]);

  // Trigger Wasted Selfie Popup
  useEffect(() => {
    if (tonightStats.status === 'Wasted' && !showDrunkPopup && userProfile.enable_selfie_reminder) {
      // Only show if we haven't taken a selfie in the last hour
      const lastSelfie = [...selfies].sort((a, b) => b.timestamp - a.timestamp)[0];
      const oneHourAgo = Date.now() - (1000 * 60 * 60);
      if (!lastSelfie || lastSelfie.timestamp < oneHourAgo) {
        setShowDrunkPopup(true);
      }
    }
  }, [tonightStats.status, selfies, userProfile.enable_selfie_reminder]);

  const filteredDrinks = useMemo(() => {
    let result = drinks;
    
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'My Drinks') {
        result = result.filter(d => d.is_custom);
      } else {
        result = result.filter(d => d.category === selectedCategory);
      }
    }

    if (searchQuery) {
      result = result.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort: Pinned first, then favorites, then alphabetical
    return [...result].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [drinks, selectedCategory, searchQuery]);

  const resetCurrentSession = () => {
    if (confirm('Reset current drinking session? This will clear all drinks from tonight.')) {
      setLogs(prev => prev.filter(l => l.session_id !== currentSessionId));
      setSelfies(prev => prev.filter(s => s.session_id !== currentSessionId));
      const toastId = generateId();
      setToasts(prev => [...prev, { id: toastId, message: "Session Reset! 🔄" }]);
    }
  };

  const clearAllHistory = () => {
    if (confirm('Clear ALL drinking history? This cannot be undone.')) {
      setLogs([]);
      setSelfies([]);
      const toastId = generateId();
      setToasts(prev => [...prev, { id: toastId, message: "History Cleared! 🧹" }]);
    }
  };

  const exportHistory = () => {
    const data = {
      logs,
      selfies: selfies.map(s => ({ ...s, image_url: '[IMAGE_DATA]' })), 
      profile: userProfile
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipsy_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const toastId = generateId();
    setToasts(prev => [...prev, { id: toastId, message: "History Exported! 📥" }]);
  };

  const logDrink = (drink: Drink) => {
    const newLog: DrinkLog = {
      id: generateId(),
      drink_id: drink.id,
      timestamp: Date.now(),
      session_id: currentSessionId,
    };
    setLogs(prev => [...prev, newLog]);
    
    const toastId = generateId();
    setToasts(prev => [...prev, { id: toastId, message: `+1 ${drink.name}` }]);
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
    if (confirm('Delete this drink?')) {
      setDrinks(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSelfie: Selfie = {
          id: generateId(),
          timestamp: Date.now(),
          image_url: reader.result as string,
          session_id: currentSessionId,
        };
        setSelfies(prev => [...prev, newSelfie]);
        setShowDrunkPopup(false);
        const toastId = generateId();
        setToasts(prev => [...prev, { id: toastId, message: "Drunk Moment Captured! 📸" }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const timelineItems = useMemo(() => {
    const sessionLogs = logs.filter(l => l.session_id === currentSessionId);
    const sessionSelfies = selfies.filter(s => s.session_id === currentSessionId);
    
    const items = [
      ...sessionLogs.map(l => ({ ...l, type: 'drink' as const })),
      ...sessionSelfies.map(s => ({ ...s, type: 'selfie' as const }))
    ];
    
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [logs, selfies, currentSessionId]);

  // --- Render ---
  return (
    <div className="min-h-screen pb-40 px-4 pt-6 max-w-md mx-auto relative overflow-x-hidden">
      {/* Header & Search */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
            TIPSY<span className="text-neon-pink">🍸</span>
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'profile' ? 'home' : 'profile')}
              className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-all active:scale-90 shadow-sm ${activeTab === 'profile' ? 'text-neon-blue' : 'text-stone-400'}`}
            >
              <User className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-10 h-10 rounded-full glass flex items-center justify-center text-neon-blue active:scale-90 transition-transform shadow-sm"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text"
            placeholder="Search drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass rounded-3xl py-3.5 pl-12 pr-4 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-neon-blue/30 transition-all shadow-sm"
          />
        </div>
      </header>

      {/* Category Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 -mx-4 px-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === cat 
                ? 'bg-neon-blue text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]' 
                : 'glass text-stone-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.div 
            key="home"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Pinned / Favorites Section */}
            {selectedCategory === 'All' && !searchQuery && filteredDrinks.some(d => d.is_pinned || d.is_favorite) && (
              <section>
                <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4 ml-1">Favorites & Pinned</h2>
                <div className="grid grid-cols-2 gap-3">
                  {filteredDrinks.filter(d => d.is_pinned || d.is_favorite).map(drink => (
                    <DrinkCard key={drink.id} drink={drink} onLog={logDrink} onToggleFavorite={toggleFavorite} onTogglePin={togglePin} onRemove={removeDrink} />
                  ))}
                </div>
              </section>
            )}

            {/* All Drinks / Category Section */}
            <section>
              <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4 ml-1">
                {searchQuery ? `Search Results (${filteredDrinks.length})` : 
                 selectedCategory === 'All' ? 'Drink Menu' : `${selectedCategory}`}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {filteredDrinks.length > 0 ? (
                  (selectedCategory === 'All' && !searchQuery ? filteredDrinks.filter(d => !d.is_pinned && !d.is_favorite) : filteredDrinks).map(drink => (
                    <DrinkCard key={drink.id} drink={drink} onLog={logDrink} onToggleFavorite={toggleFavorite} onTogglePin={togglePin} onRemove={removeDrink} />
                  ))
                ) : (
                  <div className="col-span-2 text-center py-20">
                    <p className="text-stone-300 mb-4">No drinks found</p>
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="text-neon-blue font-bold text-sm underline"
                    >
                      Add a custom drink
                    </button>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        ) : activeTab === 'timeline' ? (
          <motion.div 
            key="timeline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-800">
              <History className="w-5 h-5 text-neon-blue" />
              Night Out Diary
            </h2>
            
            {timelineItems.length > 0 ? (
              timelineItems.map(item => {
                const time = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                if (item.type === 'drink') {
                  const drink = drinks.find(d => d.id === (item as any).drink_id);
                  return (
                    <div key={item.id} className="glass rounded-2xl p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="text-stone-400 font-mono text-sm">{time}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{renderIcon(drink?.icon || '🍹')}</span>
                          <span className="font-medium text-stone-700">{drink?.name || 'Unknown Drink'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setLogs(prev => prev.filter(l => l.id !== item.id))}
                        className="text-stone-300 hover:text-neon-pink transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                } else {
                  return (
                    <div key={item.id} className="glass rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-4 flex items-center justify-between border-b border-stone-100">
                        <div className="flex items-center gap-4">
                          <span className="text-stone-400 font-mono text-sm">{time}</span>
                          <span className="text-sm font-bold text-neon-pink flex items-center gap-1">
                            <Camera className="w-4 h-4" /> Drunk Moment
                          </span>
                        </div>
                        <button 
                          onClick={() => setSelfies(prev => prev.filter(s => s.id !== item.id))}
                          className="text-stone-300 hover:text-neon-pink transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <img src={(item as any).image_url} alt="Drunk Selfie" className="w-full aspect-square object-cover" />
                    </div>
                  );
                }
              })
            ) : (
              <div className="text-center py-20 text-stone-300">
                No drinks or moments logged yet tonight.
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Profile Card */}
            <div className="glass rounded-[2.5rem] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-stone-800">Profile</h2>
                  <p className="text-stone-400 text-sm">Account settings</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
                  <input 
                    type="text" 
                    value={userProfile.username}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full glass rounded-2xl p-4 text-stone-800 focus:outline-none focus:ring-1 focus:ring-neon-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                  <div className="w-full glass rounded-2xl p-4 text-stone-400 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{userProfile.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Info Card */}
            <div className="glass rounded-[2.5rem] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-neon-blue" />
                Personal Information
              </h3>
              <p className="text-stone-400 text-xs mb-6">Used for accurate BAC estimation</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Age</label>
                  <input 
                    type="number" 
                    value={userProfile.age}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                    className="w-full glass rounded-2xl p-4 text-stone-800 focus:outline-none focus:ring-1 focus:ring-neon-blue/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Weight (kg)</label>
                  <input 
                    type="number" 
                    value={userProfile.weight_kg}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, weight_kg: parseInt(e.target.value) || 0 }))}
                    className="w-full glass rounded-2xl p-4 text-stone-800 focus:outline-none focus:ring-1 focus:ring-neon-blue/30"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 ml-1">Gender</label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setUserProfile(prev => ({ ...prev, gender: g }))}
                      className={`flex-1 py-3 rounded-2xl font-bold capitalize transition-all ${
                        userProfile.gender === g ? 'bg-neon-blue text-white shadow-md' : 'glass text-stone-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drinking Tolerance Card */}
            <div className="glass rounded-[2.5rem] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-neon-orange" />
                Drinking Tolerance
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setUserProfile(prev => ({ ...prev, tolerance_type: 'auto' }))}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                      userProfile.tolerance_type === 'auto' ? 'bg-neon-blue text-white shadow-md' : 'glass text-stone-400'
                    }`}
                  >
                    Estimate automatically
                  </button>
                  <button
                    onClick={() => setUserProfile(prev => ({ ...prev, tolerance_type: 'manual' }))}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                      userProfile.tolerance_type === 'manual' ? 'bg-neon-blue text-white shadow-md' : 'glass text-stone-400'
                    }`}
                  >
                    Set manually
                  </button>
                </div>

                {userProfile.tolerance_type === 'manual' && (
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Tolerance Level</label>
                    <div className="flex gap-2">
                      {(['low', 'medium', 'high'] as const).map(t => (
                        <button
                          key={t}
                          onClick={() => setUserProfile(prev => ({ ...prev, manual_tolerance: t }))}
                          className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                            userProfile.manual_tolerance === t ? 'bg-stone-800 text-white' : 'glass text-stone-400'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* App Settings Card */}
            <div className="glass rounded-[2.5rem] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-stone-500" />
                App Settings
              </h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-700 text-sm">Drunk Selfie Reminder</p>
                  <p className="text-stone-400 text-[10px]">Prompt for selfie when drunk</p>
                </div>
                <button 
                  onClick={() => setUserProfile(prev => ({ ...prev, enable_selfie_reminder: !prev.enable_selfie_reminder }))}
                  className={`w-12 h-6 rounded-full transition-colors relative ${userProfile.enable_selfie_reminder ? 'bg-neon-green' : 'bg-stone-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${userProfile.enable_selfie_reminder ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            {/* Data Management Card */}
            <div className="glass rounded-[2.5rem] p-6 shadow-sm">
              <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-red-400" />
                Data Management
              </h3>
              
              <div className="space-y-3">
                <button 
                  onClick={resetCurrentSession}
                  className="w-full flex items-center justify-between p-4 glass rounded-2xl text-stone-700 active:scale-[0.98] transition-all"
                >
                  <span className="font-bold text-sm">Reset current session</span>
                  <RotateCcw className="w-4 h-4 text-stone-400" />
                </button>
                <button 
                  onClick={clearAllHistory}
                  className="w-full flex items-center justify-between p-4 glass rounded-2xl text-red-500 active:scale-[0.98] transition-all"
                >
                  <span className="font-bold text-sm">Clear all history</span>
                  <Trash2 className="w-4 h-4 text-red-300" />
                </button>
                <button 
                  onClick={exportHistory}
                  className="w-full flex items-center justify-between p-4 glass rounded-2xl text-stone-700 active:scale-[0.98] transition-all"
                >
                  <span className="font-bold text-sm">Export drink history</span>
                  <Download className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Bar */}
      <div className="fixed bottom-6 left-6 right-6 p-3.5 glass rounded-[2rem] border border-stone-200 z-40 shadow-xl shadow-stone-200/50">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <p className="text-[14px] font-bold leading-none text-stone-800">{tonightStats.count}</p>
                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">Drinks</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[14px] font-bold leading-none text-stone-800">{tonightStats.alcoholMl}</p>
                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">Alcohol</p>
              </div>
              <div className="flex flex-col">
                <p className="text-[14px] font-bold text-neon-blue leading-none">{tonightStats.bac}</p>
                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">BAC</p>
              </div>
            </div>
            
            <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              tonightStats.status === 'Sober' ? 'bg-neon-green/10 text-neon-green' :
              tonightStats.status === 'Tipsy' ? 'bg-neon-orange/10 text-neon-orange' :
              tonightStats.status === 'Drunk' ? 'bg-neon-pink/10 text-neon-pink' :
              'bg-purple-500/10 text-purple-500'
            }`}>
              {tonightStats.status}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden mb-3.5 flex relative">
             {/* Threshold Markers */}
             <div 
               className="absolute top-0 bottom-0 w-px bg-stone-300 z-10" 
               style={{ left: `${(tonightStats.tipsyThreshold / (tonightStats.wastedThreshold * 1.2)) * 100}%` }}
             />
             <div 
               className="absolute top-0 bottom-0 w-px bg-stone-400 z-10" 
               style={{ left: `${(tonightStats.drunkThreshold / (tonightStats.wastedThreshold * 1.2)) * 100}%` }}
             />
             <div 
               className="absolute top-0 bottom-0 w-px bg-stone-500 z-10" 
               style={{ left: `${(tonightStats.wastedThreshold / (tonightStats.wastedThreshold * 1.2)) * 100}%` }}
             />
             
             <div 
              className={`h-full transition-all duration-1000 ${
                tonightStats.status === 'Sober' ? 'bg-neon-green' :
                tonightStats.status === 'Tipsy' ? 'bg-neon-orange' :
                tonightStats.status === 'Drunk' ? 'bg-neon-pink' :
                'bg-purple-500'
              }`}
              style={{ width: `${Math.min(100, (parseFloat(tonightStats.bac) / (tonightStats.wastedThreshold * 1.2)) * 100)}%` }}
             />
          </div>

          {/* Navigation */}
          <div className="flex justify-around items-center">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 transition-colors ${activeTab === 'home' ? 'text-neon-blue' : 'text-stone-300'}`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
            </button>
            <div className="w-px h-3 bg-stone-200" />
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 transition-colors ${activeTab === 'timeline' ? 'text-neon-blue' : 'text-stone-300'}`}
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Timeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            message={toast.message} 
            onComplete={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
          />
        ))}
      </AnimatePresence>

      {/* Drunk Selfie Popup */}
      <AnimatePresence>
        {showDrunkPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass w-full max-w-sm rounded-[2.5rem] p-8 text-center border-neon-pink/30 shadow-2xl shadow-neon-pink/10"
            >
              <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-stone-800">You're Wasted! 😵‍💫</h2>
              <p className="text-stone-500 mb-8">You've reached the limit! Take a selfie for the memories?</p>
              
              <div className="space-y-3">
                <label className="block w-full bg-purple-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-500/30 active:scale-95 transition-all cursor-pointer">
                  Take Selfie
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="user" 
                    className="hidden" 
                    onChange={handleSelfieCapture}
                  />
                </label>
                <button 
                  onClick={() => setShowDrunkPopup(false)}
                  className="w-full glass text-stone-400 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                >
                  Not Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Drink Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="glass w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 relative shadow-2xl"
            >
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute right-6 top-6 w-10 h-10 rounded-full glass flex items-center justify-center text-stone-400"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold mb-8 text-stone-800">New Drink</h2>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const abv = parseFloat(formData.get('abv') as string);
                const volume = parseFloat(formData.get('volume') as string);
                const category = formData.get('category') as DrinkCategory;
                const icon = formData.get('icon') as string || '🍹';

                if (name && abv && volume) {
                  const newDrink: Drink = {
                    id: generateId(),
                    name,
                    abv,
                    volume_ml: volume,
                    alcohol_ml: (volume * abv) / 100,
                    category,
                    icon,
                    is_favorite: false,
                    is_pinned: false,
                    is_custom: true,
                  };
                  setDrinks(prev => [...prev, newDrink]);
                  setShowAddModal(false);
                }
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Name</label>
                  <input name="name" required placeholder="e.g. Moscow Mule" className="w-full glass rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 text-stone-800 placeholder:text-stone-300" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">ABV (%)</label>
                    <input name="abv" type="number" step="0.1" required placeholder="12" className="w-full glass rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 text-stone-800 placeholder:text-stone-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Volume (ml)</label>
                    <input name="volume" type="number" required placeholder="250" className="w-full glass rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 text-stone-800 placeholder:text-stone-300" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Category</label>
                  <select name="category" className="w-full glass rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 appearance-none text-stone-800">
                    {CATEGORIES.filter(c => c !== 'All' && c !== 'My Drinks').map(c => (
                      <option key={c} value={c} className="bg-white text-stone-800">{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Icon (Emoji)</label>
                  <input name="icon" placeholder="🍹" className="w-full glass rounded-2xl p-4 focus:outline-none focus:ring-1 focus:ring-neon-blue/50 text-stone-800 placeholder:text-stone-300" />
                </div>

                <button type="submit" className="w-full bg-neon-blue text-white font-bold py-5 rounded-2xl shadow-lg shadow-neon-blue/30 active:scale-95 transition-all">
                  Create Drink
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

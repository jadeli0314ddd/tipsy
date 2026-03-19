import React, { useState, useEffect, useMemo } from 'react';
// 这里的路径必须与你在 GitHub 中的 src/lib/supabase.ts 对应
import { supabase } from './lib/supabase';
import { 
  Search, Plus, History, Home, Star, Pin, Trash2, X, Check,
  User, Settings, Mail, Info, LogOut, Download, RotateCcw,
  Beer, Camera, Zap, Flame
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

// --- Sub-Components ---
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

export default function App() {
  // --- State ---
  const [drinks, setDrinks] = useState<Drink[]>(DEFAULT_DRINKS);
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DrinkCategory>('All');
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'profile'>('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDrunkPopup, setShowDrunkPopup] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    username: 'Jade', email: 'jade@email.com', age: 20, weight_kg: 55, 
    gender: 'female', tolerance_type: 'auto', manual_tolerance: 'medium', enable_selfie_reminder: true
  });

  // --- 1. 从 Supabase 加载数据 ---
  useEffect(() => {
    async function fetchData() {
      // 加载饮酒日志
      const { data: logData } = await supabase.from('drinks_log').select('*');
      if (logData) setLogs(logData);

      // 加载自拍数据
      const { data: selfieData } = await supabase.from('selfies').select('*');
      if (selfieData) setSelfies(selfieData);
      
      // 用户配置依然保留在本地，方便快速响应
      const savedProfile = localStorage.getItem('tipsy_profile');
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    }
    fetchData();
  }, []);

  // --- 2. 存入饮酒记录 (云端同步) ---
  const logDrink = async (drink: Drink) => {
    const newEntry = {
      drink_id: drink.id,
      drink_name: drink.name,
      abv: drink.abv,
      volume: drink.volume_ml,
      session_id: getSessionId()
    };

    const { data, error } = await supabase.from('drinks_log').insert([newEntry]).select();

    if (!error && data) {
      setLogs(prev => [...prev, data[0]]);
      const toastId = generateId();
      setToasts(prev => [...prev, { id: toastId, message: `+1 ${drink.name} (Saved to Cloud)` }]);
    } else {
      console.error("Cloud Save Failed:", error);
    }
  };

  // --- 3. 自拍上传 (Storage + Database) ---
  const handleSelfieCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    
    // 上传到 Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('selfies')
      .upload(fileName, file);

    if (uploadData) {
      const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);
      
      const newSelfie = {
        image_url: publicUrl,
        session_id: getSessionId()
      };
      
      const { data: dbData } = await supabase.from('selfies').insert([newSelfie]).select();
      if (dbData) setSelfies(prev => [...prev, dbData[0]]);
      
      setShowDrunkPopup(false);
      setToasts(prev => [...prev, { id: generateId(), message: "Moment Saved! 📸" }]);
    }
  };

  // --- BAC 计算逻辑 (保持不变) ---
  const tonightStats = useMemo(() => {
    const currentSessionId = getSessionId();
    const tonightLogs = logs.filter(log => log.session_id === currentSessionId);
    const totalAlcoholMl = tonightLogs.reduce((acc, log) => acc + ((log.volume * log.abv) / 100), 0);
    
    const alcoholGrams = totalAlcoholMl * 0.789;
    const r = userProfile.gender === 'male' ? 0.68 : 0.55;
    const weightGrams = userProfile.weight_kg * 1000;
    const bac = (alcoholGrams / (weightGrams * r)) * 100;

    let status: 'Sober' | 'Tipsy' | 'Drunk' | 'Wasted' = 'Sober';
    if (bac > 0.15) status = 'Wasted';
    else if (bac > 0.08) status = 'Drunk';
    else if (bac > 0.03) status = 'Tipsy';

    return { count: tonightLogs.length, alcoholMl: totalAlcoholMl.toFixed(1), bac: bac.toFixed(3), status };
  }, [logs, userProfile]);

  // --- 渲染逻辑 ---
  return (
    <div className="min-h-screen pb-40 px-4 pt-6 max-w-md mx-auto relative overflow-x-hidden bg-stone-50">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-stone-800">TIPSY<span className="text-neon-pink">🍸</span></h1>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('profile')} className="p-2 glass rounded-full"><User className="w-5 h-5"/></button>
          <button onClick={() => setShowAddModal(true)} className="p-2 glass rounded-full text-neon-blue"><Plus className="w-5 h-5"/></button>
        </div>
      </header>

      {/* 选项卡内容渲染 */}
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
            {DEFAULT_DRINKS.map(drink => (
              <div key={drink.id} onClick={() => logDrink(drink)} className="glass p-4 rounded-3xl text-center cursor-pointer active:scale-95 transition-all">
                <div className="text-3xl mb-2">{renderIcon(drink.icon)}</div>
                <div className="font-bold text-sm text-stone-800">{drink.name}</div>
                <div className="text-[10px] text-stone-400">{drink.abv}% · {drink.volume_ml}ml</div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'timeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {logs.slice().reverse().map(log => (
              <div key={log.id} className="glass p-4 rounded-2xl flex justify-between items-center">
                <span className="text-stone-800 font-medium">{log.drink_name}</span>
                <span className="text-stone-400 text-xs">{new Date(log.created_at || '').toLocaleTimeString()}</span>
              </div>
            ))}
            {selfies.map(s => <img key={s.id} src={s.image_url} className="rounded-3xl w-full shadow-lg"/>)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部统计栏 */}
      <div className="fixed bottom-6 left-6 right-6 p-4 glass rounded-[2rem] shadow-2xl z-50">
        <div className="flex justify-around items-center mb-2">
          <div className="text-center"><p className="text-lg font-bold">{tonightStats.count}</p><p className="text-[8px] uppercase text-stone-400">Drinks</p></div>
          <div className="text-center"><p className="text-lg font-bold text-neon-blue">{tonightStats.bac}</p><p className="text-[8px] uppercase text-stone-400">BAC</p></div>
          <div className="px-3 py-1 rounded-full bg-stone-100 text-[10px] font-bold">{tonightStats.status}</div>
        </div>
        <div className="flex justify-around border-t border-stone-100 pt-2">
          <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-neon-blue' : 'text-stone-300'}><Home/></button>
          <button onClick={() => setActiveTab('timeline')} className={activeTab === 'timeline' ? 'text-neon-blue' : 'text-stone-300'}><History/></button>
        </div>
      </div>

      <AnimatePresence>
        {toasts.map(t => <Toast key={t.id} message={t.message} onComplete={() => setToasts(p => p.filter(x => x.id !== t.id))}/>)}
      </AnimatePresence>
    </div>
  );
}

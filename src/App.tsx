import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase'; // 引入刚才建的连接文件
import { 
  Search, Plus, History, Home, Star, Pin, Trash2, X, Check,
  User, Settings, Mail, Info, LogOut, Download, RotateCcw,
  Beer, Camera, Zap
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

export default function App() {
  // --- State ---
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [logs, setLogs] = useState<DrinkLog[]>([]);
  const [selfies, setSelfies] = useState<Selfie[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'timeline' | 'profile'>('home');
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  // --- 核心：从云端拉取数据 ---
  useEffect(() => {
    async function loadData() {
      // 1. 获取饮酒日志
      const { data: logData } = await supabase.from('drinks_log').select('*');
      if (logData) setLogs(logData);

      // 2. 获取自拍 (从 Storage 获取链接)
      const { data: selfieData } = await supabase.from('selfies').select('*');
      if (selfieData) setSelfies(selfieData);
    }
    loadData();
  }, []);

  // --- 核心：存入饮酒记录 ---
  const logDrink = async (drink: Drink) => {
    const newLog = {
      drink_id: drink.id,
      drink_name: drink.name,
      abv: drink.abv,
      volume: drink.volume_ml,
      session_id: getSessionId()
    };

    // 这一步数据直接飞向 Supabase 云端
    const { error } = await supabase.from('drinks_log').insert([newLog]);

    if (!error) {
      setLogs(prev => [...prev, { ...newLog, id: generateId(), timestamp: Date.now() } as any]);
      const toastId = generateId();
      setToasts(prev => [...prev, { id: toastId, message: `+1 ${drink.name} (Saved to Cloud)` }]);
    }
  };

  // --- 核心：真正的云端自拍上传 ---
  const handleSelfieCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = `${Date.now()}-${file.name}`;
      
      // 1. 先把图片文件上传到 Supabase Storage 桶
      const { data: uploadData } = await supabase.storage
        .from('selfies')
        .upload(fileName, file);

      if (uploadData) {
        // 2. 获取图片的公开访问链接
        const { data: { publicUrl } } = supabase.storage.from('selfies').getPublicUrl(fileName);
        
        // 3. 将链接存入数据库
        const newSelfie = {
          image_url: publicUrl,
          session_id: getSessionId(),
          timestamp: Date.now()
        };
        await supabase.from('selfies').insert([newSelfie]);
        
        setSelfies(prev => [...prev, { ...newSelfie, id: generateId() } as any]);
      }
    }
  };

  // ... (保留你原来的渲染逻辑和样式)
  return (
    // ... (此处粘贴你原有的 UI 代码)
    <div /> 
  );
}

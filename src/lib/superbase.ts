import { createClient } from '@supabase/supabase-js'

// 这些变量会从 Vercel 的“保险箱”里读取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
